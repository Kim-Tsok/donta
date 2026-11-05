import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { planIntegration, applyIntegration } from '../src/integrate.mjs';

async function fixture(t, app = 'app') {
  const root = await mkdtemp(resolve(tmpdir(), 'donta-integrate-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(resolve(root, app), { recursive: true });
  await writeFile(resolve(root, 'package.json'), JSON.stringify({ name: 'existing', dependencies: { next: '^16.3.8', react: '^19.3.0', 'react-dom': '^19.3.0' }, scripts: { dev: 'next dev --port 4000' } }));
  await writeFile(resolve(root, 'tsconfig.json'), '{}');
  await writeFile(resolve(root, app, 'page.tsx'), 'export default function Page() { return <h1>My existing app</h1> }');
  return root;
}

test('root and src App Router integrations preserve app files, env, scripts and dependencies', async t => {
  for (const app of ['app', 'src/app']) {
    const root = await fixture(t, app);
    await writeFile(resolve(root, '.env.local'), 'DATABASE_URL="postgres://example"\nBETTER_AUTH_SECRET="existing-secret"\n');
    const page = await readFile(resolve(root, app, 'page.tsx'), 'utf8');
    const before = await readdir(root);
    const plan = await planIntegration(root);
    assert.deepEqual(await readdir(root), before, 'planning must not write');
    assert.equal(plan.warnings.length, 1);
    await applyIntegration(plan);
    const pkg = JSON.parse(await readFile(resolve(root, 'package.json')));
    assert.equal(pkg.scripts.dev, 'next dev --port 4000');
    assert.equal(pkg.dependencies.next, '^16.3.8');
    assert.equal(pkg.dependencies.donta, 'file:./vendor/donta');
    assert.equal(pkg.scripts['donta:migrate'], 'drizzle-kit migrate --config=donta.config.ts');
    assert.equal(await readFile(resolve(root, app, 'page.tsx'), 'utf8'), page);
    const env = await readFile(resolve(root, '.env.local'), 'utf8');
    assert.match(env, /existing-secret/);
    assert.equal((env.match(/BETTER_AUTH_SECRET=/g) || []).length, 1);
    const route = await readFile(resolve(root, app, 'api/auth/[...all]/route.ts'), 'utf8');
    assert.match(route, /\.\.\/\.\.\/\.\.\/\.\.\/lib\/donta\/auth/);
    assert.ok(!route.includes('@/'));
    await readFile(resolve(root, 'drizzle-donta/0000_init.sql'));
    await assert.rejects(planIntegration(root), /already installed|already exists/);
  }
});

test('conflicts and unsupported projects leave files unchanged', async t => {
  for (const file of ['lib/donta/db.ts', 'donta.config.ts', 'drizzle.config.ts', 'app/api/auth/route.ts']) {
    const root = await fixture(t);
    await mkdir(resolve(root, file, '..'), { recursive: true });
    await writeFile(resolve(root, file), 'existing configuration');
    const pkg = await readFile(resolve(root, 'package.json'), 'utf8');
    await assert.rejects(planIntegration(root), /already exists|Found/);
    assert.equal(await readFile(resolve(root, 'package.json'), 'utf8'), pkg);
    assert.equal(await readFile(resolve(root, file), 'utf8'), 'existing configuration');
  }
});

test('rejects symlink paths and stale previews', async t => {
  const root = await fixture(t);
  const outside = await fixture(t);
  await symlink(outside, resolve(root, 'lib'), 'dir');
  await assert.rejects(planIntegration(root), /symlink/);
  await rm(resolve(root, 'lib'));
  const plan = await planIntegration(root);
  await writeFile(resolve(root, 'package.json'), '{"changed":true}');
  await assert.rejects(applyIntegration(plan), /changed after preview/);
  await assert.rejects(readFile(resolve(root, 'donta.config.ts')), /ENOENT/);
});

test('CLI dry run writes nothing and noninteractive integration requires --yes', async t => {
  const root = await fixture(t);
  const cli = new URL('../src/cli.mjs', import.meta.url).pathname;
  const before = await readdir(root);
  const dry = spawnSync(process.execPath, [cli, 'add', root, '--dry-run'], { encoding: 'utf8' });
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /No files changed/);
  assert.deepEqual(await readdir(root), before);
  const unconfirmed = spawnSync(process.execPath, [cli, '--add', root, '--skip-install'], { encoding: 'utf8' });
  assert.equal(unconfirmed.status, 1);
  assert.deepEqual(await readdir(root), before);
  const applied = spawnSync(process.execPath, [cli, 'add', root, '--yes', '--skip-install'], { encoding: 'utf8' });
  assert.equal(applied.status, 0, applied.stderr);
  await readFile(resolve(root, 'DONTA_SETUP.md'));
});

test('Neon setup validates URLs and keeps credentials out of preview fields', async t => {
  const root = await fixture(t);
  const databaseUrl = 'postgresql://user:private-password@ep-example.neon.tech/db?sslmode=require';
  const plan = await planIntegration(root, { databaseUrl });
  assert.ok(plan.modifications.get('.env.local').after.includes(databaseUrl));
  assert.ok(![...plan.files.keys(), ...plan.warnings].join('\n').includes('private-password'));
  await applyIntegration(plan);
  const env = await readFile(resolve(root, '.env.local'), 'utf8');
  assert.match(env, /DATABASE_URL="postgresql:/);
  await assert.rejects(planIntegration(await fixture(t), { databaseUrl: 'https://example.com' }), /postgres/);
  const configured = await fixture(t);
  await writeFile(resolve(configured, '.env.local'), 'DATABASE_URL="postgresql://keep:me@example.com/db"\n');
  await assert.rejects(planIntegration(configured, { databaseUrl }), /already configured/);
});

test('unsupported router and JavaScript projects fail before writes', async t => {
  const root = await fixture(t);
  await rm(resolve(root, 'tsconfig.json'));
  await assert.rejects(planIntegration(root), /TypeScript/);
  await writeFile(resolve(root, 'tsconfig.json'), '{}');
  await rm(resolve(root, 'app'), { recursive: true });
  await mkdir(resolve(root, 'pages'));
  await assert.rejects(planIntegration(root), /App Router/);
  assert.ok(!(await readdir(root)).includes('vendor'));
});
