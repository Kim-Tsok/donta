#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import * as p from '@clack/prompts';
import { validateDatabaseUrl } from './database.mjs';
import { createProject, projectName } from './create.mjs';
import { planIntegration, applyIntegration, detectManager } from './integrate.mjs';

const help = `donta — Postgres and auth, ready to build on.

Usage: donta <command> [directory] [options]
       create-donta [directory] [options]

Commands:
  create [directory]     Create a new Next.js project
  add [directory]        Add the backend to an existing Next.js app (default: .)
  help                   Show this help

Run donta with no arguments for the interactive wizard.

Options:
  --add                  Add the backend to an existing Next.js App Router app
  --yes, -y              Accept the integration plan without prompting
  --dry-run              Preview existing-project changes without writing
  --package-manager <npm|pnpm|yarn|bun>
  --skip-install         Generate files without installing dependencies
  --help, -h             Show this help
  --version, -v          Show the version

Examples:
  npx donta@latest create my-app
  npx donta@latest add .
  donta add ../my-app --dry-run
  donta add . --yes --skip-install
  npm create donta@latest my-app

Existing-project support: TypeScript, app/ or src/app/.
Existing auth routes or Drizzle configs require a manual merge.`;

const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY && !process.env.CI);
class Cancelled extends Error {}
async function answer(prompt) {
  const value = await prompt;
  if (p.isCancel(value)) throw new Cancelled();
  return value;
}
async function install(manager, cwd) {
  return new Promise((done) => {
    const command = process.platform === 'win32' && ['npm', 'pnpm', 'yarn'].includes(manager) ? `${manager}.cmd` : manager;
    const child = spawn(command, ['install'], { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('error', () => done(false));
    child.on('exit', code => done(code === 0));
  });
}
const line = (message) => interactive ? p.log.info(message) : console.log(message);

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'v' },
    add: { type: 'boolean' }, yes: { type: 'boolean', short: 'y' },
    'dry-run': { type: 'boolean' }, 'skip-install': { type: 'boolean' },
    'package-manager': { type: 'string' },
  } });
  if (positionals[0] === 'help') { values.help = true; positionals.shift(); }
  if (values.help) { console.log(help); process.exit(0); }
  if (values.version) {
    const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    console.log(pkg.version); process.exit(0);
  }
  let command;
  if (['create', 'add'].includes(positionals[0])) command = positionals.shift();
  const namedCommand = basename(process.argv[1] || '') === 'donta.mjs' || basename(process.argv[1] || '') === 'donta';
  if (namedCommand && !command && positionals.length) {
    throw new Error(`Unknown command "${positionals[0]}". Use donta create <directory> or donta add <directory>. Version tags go on the package: npx donta@latest create my-app.`);
  }
  if (command === 'create' && values.add) throw new Error('Use either donta create or donta add.');
  if (positionals.length > 1) throw new Error('Supply one project directory.');
  if (values['package-manager'] && !['npm', 'pnpm', 'yarn', 'bun'].includes(values['package-manager'])) throw new Error('Package manager must be npm, pnpm, yarn or bun.');
  if (interactive) p.intro('donta  /  a little setup, a lot to build.');
  let add = command === 'add' || values.add;
  let target = positionals[0];
  if (!target && !add && !command && interactive) {
    add = await answer(p.select({ message: 'Where are we starting?', options: [
      { value: false, label: 'A fresh project', hint: 'Next.js + Postgres + authentication' },
      { value: true, label: 'An existing Next.js app', hint: 'Add the backend to your project' },
    ] }));
  }
  if (!target) {
    if (!interactive && !add) throw new Error('Supply a directory, or use --add . to integrate into an existing app.');
    target = interactive ? await answer(p.text({
      message: add ? 'Where is your Next.js project?' : 'Where should we create your project?',
      placeholder: add ? '.' : './my-donta-app', defaultValue: add ? '.' : './my-donta-app',
      validate: value => {
        if (!add) { try { projectName(value || './my-donta-app'); } catch (error) { return error.message; } }
      },
    })) : '.';
  }
  if (values['dry-run'] && !add) throw new Error('--dry-run is available with --add.');
  let databaseUrl;
  if (interactive && !values.yes && !values['dry-run']) {
    const database = await answer(p.select({ message: 'How would you like to connect Postgres?', options: [
      { value: 'keep', label: 'Use local Postgres or my existing environment', hint: 'PGlite when DATABASE_URL is unset' },
      { value: 'neon', label: 'Connect Neon', hint: 'Paste a connection string privately' },
    ] }));
    if (database === 'neon') databaseUrl = await answer(p.password({ message: 'Your Neon connection string', validate: validateDatabaseUrl }));
  }
  let plan;
  if (add) {
    plan = await planIntegration(target, { databaseUrl });
    const preview = [
      `Project  ${plan.root}`, `Router   ${plan.app}/`, '',
      ...[...plan.files.keys()].map(file => `+ ${file}`),
      ...[...plan.modifications.keys()].map(file => `~ ${file}`),
      '', 'No pages are added. No database queries or migrations run during setup.',
      'Review DONTA_SETUP.md afterward for Next.js config and login UI steps.',
      ...plan.warnings.map(warning => `! ${warning}`),
    ].join('\n');
    if (interactive) p.note(preview, 'Your setup plan'); else console.log(preview);
    if (values['dry-run']) { line('Preview complete. No files changed.'); process.exit(0); }
    if (!values.yes) {
      if (!interactive) throw new Error('Review with --dry-run, then pass --yes to apply this integration without prompts.');
      if (!await answer(p.confirm({ message: 'Apply this setup to your project?', initialValue: true }))) throw new Cancelled();
    }
  }
  let manager = values['package-manager'] || (plan ? plan.manager : await detectManager(process.cwd()));
  let shouldInstall = !values['skip-install'];
  if (interactive && !values.yes && shouldInstall) {
    shouldInstall = await answer(p.confirm({ message: 'Install dependencies?', initialValue: true }));
    if (shouldInstall && !values['package-manager']) manager = await answer(p.select({
      message: 'Which package manager?', initialValue: manager,
      options: ['npm', 'pnpm', 'yarn', 'bun'].map(value => ({ value, label: value })),
    }));
  }
  const progress = interactive ? p.spinner() : undefined;
  progress?.start(add ? 'Wiring up your backend' : 'Creating your project');
  let result;
  try { result = add ? await applyIntegration(plan) : await createProject(target, { databaseUrl }); }
  catch (error) { progress?.stop('Setup could not finish'); throw error; }
  progress?.stop(add ? 'Backend files are ready' : 'Your project is ready');
  if (!interactive) console.log(`\n${add ? 'Configured' : 'Created'} ${result.destination}`);
  let installed = false;
  if (shouldInstall) {
    line(`Installing with ${manager}…`);
    installed = await install(manager, result.destination);
    if (!installed) { line(`Files are ready. Dependency installation failed; retry ${manager} install in your project.`); process.exitCode = 1; }
  }
  const steps = [
    `cd ${JSON.stringify(resolve(result.destination))}`,
    ...(!installed ? [`${manager} install`] : []),
    ...(add ? ['Read DONTA_SETUP.md for the Next.js config step.', `Stop your dev server, then: ${manager} run donta:migrate`, 'Add your sign-in UI using the generated auth client.'] : []),
    `${manager} run dev`,
    '', add ? 'Keep building. Your existing pages are ready for the new backend.' : 'Open http://localhost:3000 and create your first account.',
    'Local Postgres works without an account. For Neon, set DATABASE_URL in .env.local.',
  ].join('\n');
  if (interactive) { p.note(steps, 'Next steps'); p.outro('All set. Make something yours.'); }
  else console.log(`\nNext steps\n${steps}`);
} catch (error) {
  if (error instanceof Cancelled) { p.cancel('Setup cancelled. No project files changed.'); process.exitCode = 0; }
  else { if (interactive) p.log.error(error.message); else console.error(`create-donta: ${error.message}`); process.exitCode = 1; }
}
