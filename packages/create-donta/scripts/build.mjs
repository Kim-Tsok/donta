import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { basename, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const assets = fileURLToPath(new URL('../assets/', import.meta.url));
// Always rebuild so packing cannot silently ship stale runtime code.
execFileSync(process.execPath, [resolve(root, 'packages/donta/node_modules/tsdown/dist/run.mjs')], {
  cwd: resolve(root, 'packages/donta'), stdio: 'inherit',
});
await rm(assets, { recursive: true, force: true });
await mkdir(assets, { recursive: true });
const excluded = new Set(['node_modules', '.next', '.donta', '.turbo', '.git', 'next-env.d.ts']);
await cp(resolve(root, 'templates/next'), resolve(assets, 'next'), {
  recursive: true,
  filter: (source) => {
    const name = basename(source);
    return !excluded.has(name) && !name.endsWith('.tsbuildinfo') &&
      !(name.startsWith('.env') && name !== '.env.example');
  },
});
// npm omits .gitignore from tarballs; restore its name during generation.
await rename(resolve(assets, 'next/.gitignore'), resolve(assets, 'next/gitignore'));
await mkdir(resolve(assets, 'runtime'), { recursive: true });
await cp(resolve(root, 'packages/donta/dist'), resolve(assets, 'runtime/dist'), { recursive: true });
const runtime = JSON.parse(await readFile(resolve(root, 'packages/donta/package.json'), 'utf8'));
delete runtime.devDependencies;
delete runtime.scripts;
// The vendored application runtime needs neither setup assets nor prompt deps.
delete runtime.bin;
if (runtime.dependencies) {
  delete runtime.dependencies['@clack/prompts'];
  if (!Object.keys(runtime.dependencies).length) delete runtime.dependencies;
}
runtime.files = ['dist'];
await writeFile(resolve(assets, 'runtime/package.json'), JSON.stringify(runtime, null, 2) + '\n');
await cp(resolve(root, 'LICENSE'), resolve(assets, 'runtime/LICENSE'));
console.log('Prepared Next.js template and bundled donta runtime.');
