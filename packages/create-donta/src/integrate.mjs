import { readFile, readdir, lstat, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDatabaseUrl } from './database.mjs';
import { randomBytes } from 'node:crypto';

const assets = fileURLToPath(new URL('../assets/', import.meta.url));
const missing = (error) => { if (error.code === 'ENOENT') return undefined; throw error; };
const read = (path) => readFile(path, 'utf8').catch(missing);

async function safePath(root, file) {
  let current = root;
  for (const segment of file.split('/')) {
    current = resolve(current, segment);
    const stat = await lstat(current).catch(missing);
    if (stat?.isSymbolicLink()) throw new Error(`Cannot modify ${file}: ${relative(root, current)} is a symlink.`);
  }
}

export async function detectManager(root) {
  const pkg = JSON.parse(await read(resolve(root, 'package.json')) || '{}');
  const declared = pkg.packageManager?.split('@')[0];
  if (['npm', 'pnpm', 'yarn', 'bun'].includes(declared)) return declared;
  for (const [file, manager] of [['pnpm-lock.yaml', 'pnpm'], ['yarn.lock', 'yarn'], ['bun.lock', 'bun'], ['bun.lockb', 'bun']]) {
    if (await lstat(resolve(root, file)).catch(missing)) return manager;
  }
  return 'npm';
}

export async function planIntegration(target, { cwd = process.cwd(), databaseUrl } = {}) {
  if (databaseUrl && validateDatabaseUrl(databaseUrl)) throw new Error(validateDatabaseUrl(databaseUrl));
  const root = resolve(cwd, target);
  const original = await read(resolve(root, 'package.json'));
  if (!original) throw new Error('No package.json found. Choose an existing Next.js project.');
  const pkg = JSON.parse(original);
  if (!pkg.dependencies?.next && !pkg.devDependencies?.next) throw new Error('This project does not declare Next.js.');
  if (!await read(resolve(root, 'tsconfig.json'))) throw new Error('Automatic integration currently supports TypeScript projects. Add tsconfig.json first.');
  const exists = async (path) => Boolean(await lstat(resolve(root, path)).catch(missing));
  const app = await exists('app') ? 'app' : await exists('src/app') ? 'src/app' : undefined;
  if (!app) throw new Error('No App Router directory found (app/ or src/app/). Pages Router projects need manual integration.');
  if (pkg.dependencies?.['better-auth'] || pkg.devDependencies?.['better-auth']) throw new Error('Better Auth is already installed. Follow docs/existing-projects.md to reuse your auth configuration instead of creating a second instance.');
  for (const config of ['drizzle.config.ts', 'drizzle.config.js', 'drizzle.config.mjs', 'drizzle.config.cjs', 'drizzle.config.mts']) {
    if (await exists(config)) throw new Error(`Found ${config}. Follow docs/existing-projects.md to merge the auth schema into your existing migration history.`);
  }
  if (await exists('vendor/donta')) throw new Error('vendor/donta already exists. This project may already be configured; see DONTA_SETUP.md.');
  if (pkg.dependencies?.donta || pkg.devDependencies?.donta) throw new Error('donta is already installed. See DONTA_SETUP.md or the existing-project guide before running setup again.');
  const lib = app === 'app' ? 'lib/donta' : 'src/lib/donta';
  const files = new Map();
  for (const name of ['db.ts', 'schema.ts', 'auth.ts', 'session.ts']) {
    const contents = await readFile(resolve(assets, 'next/lib', name), 'utf8');
    files.set(`${lib}/${name}`, contents);
  }
  files.set(`${lib}/auth-client.ts`, '"use client";\n\nimport { createAuthClient } from "better-auth/react";\n\nexport const authClient = createAuthClient();\n');
  const route = `${app}/api/auth/[...all]/route.ts`;
  // Avoid assuming the project has an @/* alias.
  const authImport = relative(dirname(route), `${lib}/auth`).split(sep).join('/');
  files.set(route, `import { toNextJsHandler } from "better-auth/next-js";\nimport { auth } from "${authImport}";\n\nexport const runtime = "nodejs";\nexport const { GET, POST } = toNextJsHandler(auth);\n`);
  files.set('donta.config.ts', `import { defineConfig } from "donta/drizzle-config";\n\nexport default defineConfig({ schema: "./${lib}/schema.ts", out: "./drizzle-donta" });\n`);
  async function collect(source, dest) {
    for (const entry of await readdir(source, { withFileTypes: true })) {
      const path = `${dest}/${entry.name}`;
      if (entry.isDirectory()) await collect(resolve(source, entry.name), path);
      else files.set(path, await readFile(resolve(source, entry.name), 'utf8'));
    }
  }
  await collect(resolve(assets, 'runtime'), 'vendor/donta');
  await collect(resolve(assets, 'next/drizzle'), 'drizzle-donta');
  // A broad auth route can already own this URL even without Better Auth.
  const authRoot = `${app}/api/auth`;
  if (await exists(authRoot)) throw new Error(`${authRoot} already exists. Keep your current auth routes and follow docs/existing-projects.md.`);
  const template = JSON.parse(await readFile(resolve(assets, 'next/package.json'), 'utf8'));
  const warnings = [];
  for (const name of ['@electric-sql/pglite', '@neondatabase/serverless', 'better-auth', 'drizzle-orm']) {
    if (!pkg.dependencies?.[name] && !pkg.devDependencies?.[name]) (pkg.dependencies ??= {})[name] = template.dependencies[name];
    else warnings.push(`Keeping your existing ${name} version; check compatibility with donta.`);
  }
  (pkg.dependencies ??= {}).donta = 'file:./vendor/donta';
  if (!pkg.devDependencies?.['drizzle-kit'] && !pkg.dependencies?.['drizzle-kit']) (pkg.devDependencies ??= {})['drizzle-kit'] = template.devDependencies['drizzle-kit'];
  const scripts = {
    'donta:generate': 'drizzle-kit generate --config=donta.config.ts',
    'donta:migrate': 'drizzle-kit migrate --config=donta.config.ts',
    'donta:studio': 'drizzle-kit studio --config=donta.config.ts',
  };
  for (const [name, command] of Object.entries(scripts)) {
    if (pkg.scripts?.[name] && pkg.scripts[name] !== command) throw new Error(`Script ${name} already exists. Rename it before running setup.`);
    (pkg.scripts ??= {})[name] = command;
  }
  files.set('DONTA_SETUP.md', `# donta setup\n\nBackend integration is installed in \`${lib}\`. Your pages and existing scripts are preserved.\n\n1. Install dependencies with your package manager.\n2. Review \`.env.local\`. Leave DATABASE_URL unset for local PGlite, or set your Neon connection string.\n3. Add \`"@electric-sql/pglite"\` to \`serverExternalPackages\` in your Next.js configuration when using local PGlite (keep any existing entries).\n4. Stop the dev server, then run \`npm run donta:migrate\`. Setup never runs migrations or connects to your database.\n5. Start your app normally.\n\n## Use authentication\n\nImport \`authClient\` from \`${lib}/auth-client\` in your client UI and call \`authClient.signUp.email({ name, email, password })\` or \`authClient.signIn.email({ email, password })\`. Check the returned \`error\` before redirecting.\n\nIn a server component, use \`getSession()\` from \`${lib}/session\`. \`requireSession()\` redirects to \`/sign-in\`; create that page or change the redirect to match your login route. No UI pages are added by integration.\n\n## Database changes\n\nEdit \`${lib}/schema.ts\`, run \`npm run donta:generate\`, review the SQL in \`drizzle-donta\`, then run \`npm run donta:migrate\`. Only one process can open local PGlite at a time.\n\nIf your database already has user, session, account, or verification tables, reconcile them with the auth schema before running migrations. Do not point this migration history at an existing database without reviewing it.\n\n## Deploy\n\nSet DATABASE_URL, BETTER_AUTH_SECRET and BETTER_AUTH_URL on your host. Use a private random secret and your public origin. Apply reviewed migrations as a release step. PGlite is for local development; use Neon in production. Keep vendor/donta committed. Email verification and password-reset delivery need your own mail provider configuration.\n\n## Remove the integration\n\nRemove the files listed in the setup preview, the donta:* scripts and added dependencies. Remove the generated environment entries only if no longer used. Existing files were extended only in package.json, .gitignore and .env.local.\n`);
  for (const file of files.keys()) {
    await safePath(root, file);
    if (await exists(file)) throw new Error(`${file} already exists. No files were changed.`);
  }
  const modifications = new Map([['package.json', { before: original, after: JSON.stringify(pkg, null, 2) + '\n' }]]);
  for (const file of ['.env.local', '.gitignore']) await safePath(root, file);
  const env = await read(resolve(root, '.env.local'));
  const envSources = await Promise.all(['.env', '.env.local', '.env.development', '.env.development.local'].map(file => read(resolve(root, file))));
  const combined = envSources.filter(Boolean).join('\n');
  const has = (key) => new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`, 'm').test(combined) || Boolean(process.env[key]);
  const additions = [];
  if (databaseUrl) {
    if (has('DATABASE_URL')) throw new Error('DATABASE_URL is already configured. Keep the existing connection or update your environment manually.');
    additions.push(`DATABASE_URL="${databaseUrl}"`);
  }
  if (!has('BETTER_AUTH_SECRET')) additions.push(`BETTER_AUTH_SECRET="${randomBytes(32).toString('base64')}"`);
  if (!has('BETTER_AUTH_URL')) additions.push('BETTER_AUTH_URL="http://localhost:3000"');
  if (additions.length) modifications.set('.env.local', { before: env, after: (env || '') + '\n# donta authentication\n' + additions.join('\n') + '\n' });
  if (has('DATABASE_URL')) warnings.push('An existing DATABASE_URL was detected. Review the database before applying auth migrations.');
  const ignore = await read(resolve(root, '.gitignore'));
  modifications.set('.gitignore', { before: ignore, after: (ignore || '') + '\n# donta local state and secrets\n.env.local\n.env*.local\n.donta/\n' });
  return { root, app, lib, files, modifications, warnings, manager: await detectManager(root) };
}

export async function applyIntegration(plan) {
  // Recheck every path and original content immediately before the first write.
  for (const file of [...plan.files.keys(), ...plan.modifications.keys()]) await safePath(plan.root, file);
  for (const file of plan.files.keys()) {
    if (await lstat(resolve(plan.root, file)).catch(missing)) throw new Error(`${file} appeared after preview. Run setup again.`);
  }
  for (const [file, { before }] of plan.modifications) {
    if (await read(resolve(plan.root, file)) !== before) throw new Error(`${file} changed after preview. Run setup again.`);
  }
  const written = [];
  try {
    for (const [file, content] of plan.files) {
      await mkdir(dirname(resolve(plan.root, file)), { recursive: true });
      await writeFile(resolve(plan.root, file), content, { flag: 'wx' });
      written.push([file, undefined]);
    }
    for (const [file, { before, after }] of plan.modifications) {
      await writeFile(resolve(plan.root, file), after, { mode: file === '.env.local' ? 0o600 : 0o644 });
      written.push([file, before]);
    }
  } catch (error) {
    for (const [file, before] of written.reverse()) {
      if (before === undefined) await rm(resolve(plan.root, file), { force: true });
      else await writeFile(resolve(plan.root, file), before);
    }
    throw error;
  }
  return { destination: plan.root };
}
