import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createProject } from '../src/create.mjs';

async function fixture(t) {
  const cwd = await mkdtemp(resolve(tmpdir(), 'donta-test-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  return cwd;
}

test('generates standalone apps with migrations, runtime and unique secrets', async (t) => {
  const cwd = await fixture(t);
  await createProject('first-app', { cwd });
  await createProject('second-app', { cwd });
  const dir = resolve(cwd, 'first-app');
  const pkg = JSON.parse(await readFile(resolve(dir, 'package.json')));
  assert.equal(pkg.name, 'first-app');
  assert.equal(pkg.dependencies.donta, 'file:./vendor/donta');
  assert.ok(!JSON.stringify(pkg).includes('workspace:'));
  await readFile(resolve(dir, 'vendor/donta/dist/db.mjs'));
  await readFile(resolve(dir, 'drizzle/0000_init.sql'));
  await readFile(resolve(dir, '.gitignore'));
  const env = await readFile(resolve(dir, '.env.local'), 'utf8');
  assert.match(env, /BETTER_AUTH_SECRET="[A-Za-z0-9+/=]{44}"/);
  assert.notEqual(env, await readFile(resolve(cwd, 'second-app/.env.local'), 'utf8'));
  assert.ok(!(await readdir(dir)).includes('node_modules'));
  assert.ok(!(await readdir(dir)).includes('.next'));
});

test('preserves existing projects and rejects invalid names', async (t) => {
  const cwd = await fixture(t);
  await mkdir(resolve(cwd, 'existing'));
  await writeFile(resolve(cwd, 'existing/keep.txt'), 'preserve me');
  await assert.rejects(createProject('existing', { cwd }), /not empty/);
  assert.equal(await readFile(resolve(cwd, 'existing/keep.txt'), 'utf8'), 'preserve me');
  await assert.rejects(createProject('Bad Name', { cwd }), /directory name/);
});

test('CLI handles help, invalid options and noninteractive invocation', async () => {
  const cli = new URL('../src/cli.mjs', import.meta.url);
  for (const args of [['--help'], ['--version']]) {
    assert.equal(spawnSync(process.execPath, [cli.pathname, ...args]).status, 0);
  }
  for (const args of [[], ['app', '--package-manager', 'invalid'], ['--unknown'], ['one', 'two']]) {
    assert.equal(spawnSync(process.execPath, [cli.pathname, ...args], { stdio: 'pipe' }).status, 1);
  }
});

test('create subcommand generates an app and rejects conflicting modes', async t => {
  const cwd = await fixture(t);
  const cli = new URL('../src/cli.mjs', import.meta.url).pathname;
  const created = spawnSync(process.execPath, [cli, 'create', 'command-app', '--skip-install'], { cwd, encoding: 'utf8' });
  assert.equal(created.status, 0, created.stderr);
  await readFile(resolve(cwd, 'command-app/package.json'));
  const conflict = spawnSync(process.execPath, [cli, 'create', 'conflict-app', '--add', '--skip-install'], { cwd, encoding: 'utf8' });
  assert.equal(conflict.status, 1);
  assert.match(conflict.stderr, /either donta create or donta add/);
  const help = spawnSync(process.execPath, [cli, 'help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /npx donta-cli@latest create/);
});
