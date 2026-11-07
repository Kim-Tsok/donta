import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { planAgentSetup, parseAgents } from '../src/agents.mjs';
import { applyIntegration } from '../src/integrate.mjs';

async function fixture(t) {
  const root = await mkdtemp(resolve(tmpdir(), 'donta-agents-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(resolve(root, 'src/lib/donta'), { recursive: true });
  await mkdir(resolve(root, 'src/app'), { recursive: true });
  await writeFile(resolve(root, 'src/lib/donta/schema.ts'), '// schema');
  await writeFile(resolve(root, 'package.json'), JSON.stringify({ name: 'app', packageManager: 'pnpm@12.8.1', scripts: { typecheck: 'tsc --noEmit', build: 'next build', 'donta:migrate': 'drizzle-kit migrate', custom: 'my-tool' } }));
  return root;
}

test('shared context adapts to project and preserves existing rules and imports', async t => {
  const root = await fixture(t);
  const original = '# Team rules\n\nKeep accessibility intact.\n';
  await writeFile(resolve(root, 'AGENTS.md'), original);
  await writeFile(resolve(root, 'CLAUDE.md'), '@AGENTS.md\n');
  const plan = await planAgentSetup(root);
  assert.equal(await readFile(resolve(root, 'AGENTS.md'), 'utf8'), original);
  assert.ok(!plan.modifications.has('CLAUDE.md'));
  await applyIntegration(plan);
  const instructions = await readFile(resolve(root, 'AGENTS.md'), 'utf8');
  assert.ok(instructions.startsWith(original));
  assert.match(instructions, /src\/app\//);
  assert.match(instructions, /src\/lib\/donta\/schema.ts/);
  assert.match(instructions, /pnpm run typecheck/);
  assert.ok(!instructions.includes('pnpm run test\n'), 'do not invent missing scripts');
  assert.match(await readFile(resolve(root, 'GEMINI.md'), 'utf8'), /@\.\/AGENTS.md/);
});

test('refresh is idempotent and keeps task notes while updating script context', async t => {
  const root = await fixture(t);
  await applyIntegration(await planAgentSetup(root));
  await writeFile(resolve(root, '.agents/donta/TASK.md'), '# Real task\nKeep this work.');
  await writeFile(resolve(root, '.agents/donta/HANDOFF.md'), '# Actual handoff\nNext step.');
  const second = await planAgentSetup(root);
  assert.equal(second.files.size, 0);
  assert.equal(second.modifications.size, 0);
  const pkg = JSON.parse(await readFile(resolve(root, 'package.json')));
  pkg.scripts.lint = 'eslint .';
  await writeFile(resolve(root, 'package.json'), JSON.stringify(pkg));
  await applyIntegration(await planAgentSetup(root));
  assert.match(await readFile(resolve(root, 'AGENTS.md'), 'utf8'), /pnpm run lint/);
  assert.equal(await readFile(resolve(root, '.agents/donta/TASK.md'), 'utf8'), '# Real task\nKeep this work.');
  assert.equal(await readFile(resolve(root, '.agents/donta/HANDOFF.md'), 'utf8'), '# Actual handoff\nNext step.');
});

test('all adapters preserve overrides and support Cursor with valid frontmatter', async t => {
  const root = await fixture(t);
  await writeFile(resolve(root, 'AGENTS.override.md'), '# Codex override\n');
  await writeFile(resolve(root, 'CLAUDE.md'), '# Existing Claude instructions\n');
  await writeFile(resolve(root, 'GEMINI.md'), '# Existing Gemini instructions\n');
  await applyIntegration(await planAgentSetup(root, { agents: parseAgents('all') }));
  assert.match(await readFile(resolve(root, 'CLAUDE.md'), 'utf8'), /^# Existing Claude instructions/);
  assert.match(await readFile(resolve(root, 'GEMINI.md'), 'utf8'), /^# Existing Gemini instructions/);
  assert.match(await readFile(resolve(root, 'AGENTS.override.md'), 'utf8'), /Read AGENTS.md/);
  assert.match(await readFile(resolve(root, '.cursor/rules/donta.mdc'), 'utf8'), /^---\ndescription:.*\nalwaysApply: true\n---/);
});

test('refuses symlinks, broken markers and stale plans without overwriting work', async t => {
  const root = await fixture(t);
  const outside = await fixture(t);
  await symlink(resolve(outside, 'package.json'), resolve(root, 'AGENTS.md'));
  await assert.rejects(planAgentSetup(root), /symlink/);
  await rm(resolve(root, 'AGENTS.md'));
  await writeFile(resolve(root, 'AGENTS.md'), '<!-- BEGIN:donta-agent-workflow -->\nbroken');
  await assert.rejects(planAgentSetup(root), /Malformed/);
  await rm(resolve(root, 'AGENTS.md'));
  const plan = await planAgentSetup(root);
  await writeFile(resolve(root, 'AGENTS.md'), '# Work that arrived during preview');
  await assert.rejects(applyIntegration(plan), /appeared after preview/);
  assert.equal(await readFile(resolve(root, 'AGENTS.md'), 'utf8'), '# Work that arrived during preview');
});

test('standalone command previews, requires noninteractive consent, and runs no installs', async t => {
  const root = await fixture(t);
  const cli = new URL('../src/cli.mjs', import.meta.url).pathname;
  const before = await readdir(root);
  const run = args => spawnSync(process.execPath, [cli, 'agents', root, ...args], { encoding: 'utf8' });
  const dry = run(['--dry-run']);
  assert.equal(dry.status, 0, dry.stderr);
  assert.deepEqual(await readdir(root), before);
  assert.equal(run([]).status, 1);
  assert.equal(run(['--agents', 'unknown', '--yes']).status, 1);
  const apply = run(['--agents', 'codex,gemini', '--yes']);
  assert.equal(apply.status, 0, apply.stderr);
  await readFile(resolve(root, 'GEMINI.md'));
  await assert.rejects(readFile(resolve(root, 'CLAUDE.md')), /ENOENT/);
  await assert.rejects(readFile(resolve(root, 'node_modules')), /ENOENT/);
  assert.equal(run(['--agents', 'codex,gemini', '--yes']).status, 0);
});

test('retains the chosen manager before installation and follows later lockfiles', async t => {
  const root = await fixture(t);
  const pkg = JSON.parse(await readFile(resolve(root, 'package.json')));
  delete pkg.packageManager;
  await writeFile(resolve(root, 'package.json'), JSON.stringify(pkg));
  await applyIntegration(await planAgentSetup(root, { packageManager: 'yarn' }));
  const refreshed = await planAgentSetup(root);
  assert.equal(refreshed.manager, 'yarn');
  assert.equal(refreshed.modifications.size, 0);
  await writeFile(resolve(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9');
  const installed = await planAgentSetup(root);
  assert.equal(installed.manager, 'pnpm');
  assert.match(installed.modifications.get('AGENTS.md').after, /pnpm run build/);
});
