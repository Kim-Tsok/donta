import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, writeFile, rm, symlink, stat, chmod, link } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { planIntegration, applyIntegration, safePath } from '../src/integrate.mjs';

test('rejects paths outside the project before filesystem access', async () => {
  for (const file of ['../secret', '/tmp/secret', 'lib/../../secret', 'lib\\secret', './secret']) {
    await assert.rejects(safePath('/tmp/project', file), /inside the project/);
  }
});

test('restricts an existing env file before adding a secret', { skip: process.platform === 'win32' }, async t => {
  const root = await fixture(t);
  const env = resolve(root, '.env.local');
  await writeFile(env, 'MY_SETTING=keep\n');
  await chmod(env, 0o644);
  await applyIntegration(await planIntegration(root));
  assert.equal((await stat(env)).mode & 0o777, 0o600);
  assert.match(await readFile(env, 'utf8'), /^MY_SETTING=keep\n/);
  assert.match(await readFile(env, 'utf8'), /BETTER_AUTH_SECRET=/);
});

test('refuses hard-linked environment files without exposing a generated secret', async t => {
  const root = await fixture(t);
  const outside = await fixture(t);
  const original = 'KEEP=private\n';
  await writeFile(resolve(outside, 'env'), original);
  await link(resolve(outside, 'env'), resolve(root, '.env.local'));
  const manifest = await readFile(resolve(root, 'package.json'), 'utf8');
  await assert.rejects(applyIntegration(await planIntegration(root)), /regular file/);
  assert.equal(await readFile(resolve(outside, 'env'), 'utf8'), original);
  assert.equal(await readFile(resolve(root, 'package.json'), 'utf8'), manifest);
  await assert.rejects(readFile(resolve(root, 'donta.config.ts')), /ENOENT/);
});

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
    assert.ok(plan.warnings.some(warning => warning.includes('existing DATABASE_URL')));
    await applyIntegration(plan);
    const pkg = JSON.parse(await readFile(resolve(root, 'package.json')));
    assert.equal(pkg.scripts.dev, 'next dev --port 4000');
    assert.equal(pkg.dependencies.next, '^16.3.8');
    assert.equal(pkg.dependencies.donta, 'file:./vendor/donta');
    assert.equal(pkg.overrides['@esbuild-kit/core-utils'].esbuild, '^0.25.12');
    assert.equal(pkg.overrides['better-auth'].zod, '^4.6.6');
    assert.equal(pkg.pnpm.overrides['@esbuild-kit/core-utils>esbuild'], '^0.25.12');
    assert.equal(pkg.resolutions['@esbuild-kit/core-utils/esbuild'], '^0.25.12');
    const workspace = JSON.parse(await readFile(resolve(root, 'pnpm-workspace.yaml'), 'utf8'));
    assert.equal(workspace.overrides['better-auth>zod'], '^4.6.6');
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

test('security overrides preserve existing pins and reject conflicts before writes', async t => {
  const root = await fixture(t);
  const path = resolve(root, 'package.json');
  const pkg = JSON.parse(await readFile(path, 'utf8'));
  pkg.overrides = { unrelated: '1.2.3', 'better-call': '1.4.0' };
  await writeFile(path, JSON.stringify(pkg));
  const planned = JSON.parse((await planIntegration(root)).modifications.get('package.json').after);
  assert.equal(planned.overrides.unrelated, '1.2.3');
  assert.deepEqual(planned.overrides['better-call'], { '.': '1.4.0', zod: '^4.6.6' });
  pkg.overrides['@esbuild-kit/core-utils'] = { esbuild: '0.18.20' };
  const before = JSON.stringify(pkg);
  await writeFile(path, before);
  await assert.rejects(planIntegration(root), /Conflicting dependency override/);
  assert.equal(await readFile(path, 'utf8'), before);
  await assert.rejects(readFile(resolve(root, 'donta.config.ts')), /ENOENT/);
});

test('integration keeps an existing parent workspace in control', async t => {
  const parent = await fixture(t);
  const root = resolve(parent, 'apps/existing');
  await mkdir(resolve(root, 'app'), { recursive: true });
  await writeFile(resolve(root, 'package.json'), await readFile(resolve(parent, 'package.json')));
  await writeFile(resolve(root, 'tsconfig.json'), '{}');
  const workspace = 'packages:\n  - apps/*\n';
  await writeFile(resolve(parent, 'pnpm-workspace.yaml'), workspace);
  const plan = await planIntegration(root);
  assert.equal(plan.files.has('pnpm-workspace.yaml'), false);
  assert.ok(plan.warnings.some(warning => warning.includes('workspace root')));
  await applyIntegration(plan);
  assert.equal(await readFile(resolve(parent, 'pnpm-workspace.yaml'), 'utf8'), workspace);
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
