import { readFile, lstat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { detectManager, safePath } from './integrate.mjs';

export const AGENTS = [
  { value: 'codex', label: 'Codex', hint: 'AGENTS.md' },
  { value: 'claude', label: 'Claude Code', hint: 'CLAUDE.md → AGENTS.md' },
  { value: 'gemini', label: 'Gemini CLI', hint: 'GEMINI.md → AGENTS.md' },
  { value: 'cursor', label: 'Cursor', hint: '.cursor/rules/donta.mdc' },
];
export const DEFAULT_AGENTS = ['codex', 'claude', 'gemini'];
const begin = '<!-- BEGIN:donta-agent-workflow -->';
const end = '<!-- END:donta-agent-workflow -->';
const missing = error => { if (error.code === 'ENOENT') return undefined; throw error; };
const read = path => readFile(path, 'utf8').catch(missing);

export function parseAgents(value) {
  const selected = value === 'all' ? AGENTS.map(a => a.value) : value.split(',').map(s => s.trim());
  if (!selected.length || selected.some(s => !AGENTS.some(a => a.value === s))) throw new Error('Choose codex, claude, gemini, cursor, or all (comma-separated).');
  return [...new Set(selected)];
}

function merge(before, content, file) {
  const block = `${begin}\n${content.trim()}\n${end}`;
  if (before === undefined) return block + '\n';
  const starts = before.split(begin).length - 1;
  const ends = before.split(end).length - 1;
  if (starts !== ends || starts > 1 || (starts && before.indexOf(end) < before.indexOf(begin))) throw new Error(`Malformed donta block in ${file}. Repair it before rerunning setup.`);
  if (starts) return before.slice(0, before.indexOf(begin)) + block + before.slice(before.indexOf(end) + end.length);
  return before + (before.endsWith('\n') ? '\n' : '\n\n') + block + '\n';
}

export async function planAgentSetup(target = '.', { cwd = process.cwd(), agents = DEFAULT_AGENTS, packageManager } = {}) {
  const selected = parseAgents(agents.join(','));
  const root = resolve(cwd, target);
  await safePath(root, 'package.json');
  const source = await read(resolve(root, 'package.json'));
  if (!source) throw new Error('No package.json found. Run agent setup from your app directory.');
  const pkg = JSON.parse(source);
  if (packageManager && !['npm', 'pnpm', 'yarn', 'bun'].includes(packageManager)) throw new Error('Unsupported package manager.');
  let manager = packageManager || await detectManager(root);
  const files = new Map();
  const modifications = new Map();
  const warnings = [];
  const exists = async file => Boolean(await lstat(resolve(root, file)).catch(missing));
  const first = async candidates => { for (const file of candidates) if (await exists(file)) return file; };
  if (!packageManager && !pkg.packageManager && !await first(['package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb'])) {
    // A freshly generated app may not have installed dependencies yet. Retain
    // its selected manager until an explicit declaration or lockfile exists.
    await safePath(root, 'AGENTS.md');
    const previous = await read(resolve(root, 'AGENTS.md'));
    const context = previous?.split(begin)[1]?.split(end)[0];
    manager = context?.match(/- Package manager: (npm|pnpm|yarn|bun)\./)?.[1] || manager;
  }
  const app = await first(['app', 'src/app']);
  const schema = await first(['lib/donta/schema.ts', 'src/lib/donta/schema.ts', 'lib/schema.ts', 'src/lib/schema.ts']);
  const auth = await first(['lib/donta/auth.ts', 'src/lib/donta/auth.ts', 'lib/auth.ts', 'src/lib/auth.ts']);
  const commands = Object.keys(pkg.scripts || {}).filter(name => ['dev', 'build', 'typecheck', 'lint', 'test', 'test:cli', 'test:runtime', 'db:generate', 'db:migrate', 'donta:generate', 'donta:migrate'].includes(name));
  const checks = commands.filter(name => ['typecheck', 'lint', 'test', 'test:cli', 'test:runtime', 'build'].includes(name));
  const instructions = `## donta shared agent workflow\n\nApplies to this project for every selected coding agent. Preserve existing project-specific instructions. Treat the current code and package.json as the source of truth when this generated context is stale.\n\n### Project context\n\n- Package manager: ${manager}. Use the existing lockfile.\n${app ? `- App Router: ${app}/.\n` : ''}${schema ? `- Database schema: ${schema}.\n` : ''}${auth ? `- Auth configuration: ${auth}.\n` : ''}- Read README.md and DONTA_SETUP.md when present. For Next.js, read the relevant installed documentation in node_modules/next/dist/docs before using unfamiliar APIs.\n\n### Work cycle\n\n1. Inspect git status and the relevant files. Preserve unrelated work. Read .agents/donta/TASK.md and HANDOFF.md when resuming a task.\n2. Write the objective, scope and observable acceptance criteria in TASK.md. Plan proportionally; proceed with reversible work already authorized by the user. Ask only for missing decisions that block progress.\n3. Implement a focused change using the project's existing conventions. Keep database access and auth secrets on the server. Validate authorization for protected actions.\n4. Verify changed behavior with appropriate checks and tests. Inspect script definitions before executing them; dev/build scripts can trigger migrations or network access. Never claim a check passed without running it.\n5. Review the diff for regressions and accidental secrets. Update TASK.md and HANDOFF.md with changed files, actual check results, remaining work and a concrete next action. Report the result to the user.\n\n### Commands discovered at setup time\n\n${commands.length ? commands.map(name => `- ${manager} run ${name}`).join('\n') : '- No standard scripts detected. Inspect package.json and choose the relevant project commands.'}\n\nCandidate validation scripts: ${checks.join(', ') || 'none detected; determine checks from the project'}. Run only checks appropriate to the change.\n\n### Database and auth\n\n- With the donta runtime, DATABASE_URL selects Neon; unset uses local PGlite in .donta/pglite. Keep that directory and environment secrets out of git.\n- Stop the development server before migrating local PGlite. Inspect generated SQL and confirm which database it targets before applying it. Preserve the existing migration history.\n- Never print or copy credentials into task notes, handoffs or commits. Use variable names and redacted values.\n- Do not deploy, publish packages or apply destructive database changes unless the user has authorized that action.\n\n### Switching agents\n\nUse .agents/donta/README.md for the workflow and starter prompts. Start the next agent in this project directory and ask it to read AGENTS.md, TASK.md and HANDOFF.md. Verify the current git diff; the handoff may be stale. Avoid simultaneous edits to the same files; use separate worktrees for parallel tasks.\n`;
  async function managed(file, content) {
    await safePath(root, file);
    const before = await read(resolve(root, file));
    const after = merge(before, content, file);
    if (before === after) return;
    if (before === undefined) files.set(file, after);
    else modifications.set(file, { before, after });
  }
  await managed('AGENTS.md', instructions);
  if (selected.includes('claude')) {
    const before = await read(resolve(root, 'CLAUDE.md'));
    if (!/^\s*@(?:\.\/)?AGENTS\.md\s*$/m.test(before || '')) await managed('CLAUDE.md', '@AGENTS.md');
  }
  if (selected.includes('gemini')) {
    const before = await read(resolve(root, 'GEMINI.md'));
    if (!/^\s*@(?:\.\/)?AGENTS\.md\s*$/m.test(before || '')) await managed('GEMINI.md', '@./AGENTS.md');
  }
  if (selected.includes('cursor')) {
    const file = '.cursor/rules/donta.mdc';
    await safePath(root, file);
    const before = await read(resolve(root, file));
    if (before !== undefined && !before.includes(begin)) throw new Error(`${file} already exists without a donta block. Merge this rule manually.`);
    const after = `---\ndescription: Shared donta project workflow\nalwaysApply: true\n---\n\n${begin}\nRead AGENTS.md at the project root and follow its shared workflow before working.\n${end}\n`;
    if (before === undefined) files.set(file, after);
    else if (before !== after) modifications.set(file, { before, after });
  }
  if (selected.includes('codex') && await exists('AGENTS.override.md')) {
    await managed('AGENTS.override.md', 'Read AGENTS.md at the project root for the shared donta workflow, alongside these project overrides.');
    warnings.push('Existing AGENTS.override.md preserved and linked to the shared workflow.');
  }
  const guide = `# Agent workflow\n\nShared context lives in AGENTS.md. Claude and Gemini adapters import it; Cursor's optional project rule asks the agent to read it. Codex discovers AGENTS.md from the project directory. Agents require their own installation, login and permission settings; donta does not launch them or configure credentials.\n\n## Start a task\n\nOpen your preferred coding agent in this project and use:\n\n> Read AGENTS.md and .agents/donta/TASK.md. My goal is: [describe it]. Inspect the relevant code, record acceptance criteria, implement the change, run appropriate checks, and leave a handoff.\n\nTASK.md is a reusable working document. Keep one task per worktree. Create a fresh copy for unrelated tasks and record its path in your prompt.\n\n## Review\n\n> Read AGENTS.md and the current git diff. Review the change against TASK.md. Report concrete bugs and missing verification with file references. Do not change code during this review unless requested.\n\n## Handoff to another agent\n\nBefore switching, ask the current agent to update HANDOFF.md. Then open another agent in the same worktree:\n\n> Read AGENTS.md, .agents/donta/TASK.md and .agents/donta/HANDOFF.md. Verify those notes against git status and the current code, then continue the next unfinished step.\n\nKeep completed check commands and results in the handoff. Record failures and anything not run. Do not put secrets or private customer data in these files; commit only notes suitable for the repository's audience.\n\n## Refresh\n\nRerun donta agents . when scripts or layout change. Setup updates only its managed instruction blocks and preserves your task and handoff notes. It does not remove adapters you deselect.\n\n## Confirm instructions loaded\n\nRestart your agent session after setup. Ask it to identify the shared workflow and applicable project instructions. Check Claude's /memory or Gemini's /memory show if context appears missing. Nested or global rules and each agent's settings can affect discovery.\n`;
  await managed('.agents/donta/README.md', guide);
  for (const [file, content] of [
    ['.agents/donta/TASK.md', '# Current task\n\nStatus: not started\n\n## Goal\n\nDescribe the requested outcome.\n\n## Scope\n\nFiles or areas to change; constraints to preserve.\n\n## Acceptance criteria\n\n- [ ] Add observable criteria for completion.\n\n## Plan\n\n- [ ] Inspect relevant code.\n- [ ] Implement.\n- [ ] Verify and review.\n\n## Results\n\nRecord actual outcomes and unresolved work.\n'],
    ['.agents/donta/HANDOFF.md', '# Agent handoff\n\nNo task has been handed off yet. Replace this template when pausing or switching agents.\n\n## Objective and status\n\n## Changes and files\n\n## Verification\n\nExact commands, results, failures and checks not run.\n\n## Remaining work\n\n## Next concrete action\n\n## Decisions and constraints\n\nKeep credentials and private data out of this document.\n'],
  ]) if (!await exists(file)) files.set(file, content);
  for (const file of [...files.keys(), ...modifications.keys()]) await safePath(root, file);
  return { root, agents: selected, manager, files, modifications, warnings };
}
