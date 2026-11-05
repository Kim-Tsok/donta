import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const generator = new URL('../../create-donta/', import.meta.url);
const destination = new URL('../.cli/', import.meta.url);
// The generator builder compiles the database runtime before snapshotting it.
execFileSync(process.execPath, [fileURLToPath(new URL('scripts/build.mjs', generator))], { stdio: 'inherit' });
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
for (const folder of ['src', 'assets', 'docs']) {
  await cp(new URL(folder, generator), new URL(folder, destination), { recursive: true });
}
const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
await writeFile(new URL('package.json', destination), JSON.stringify({ type: 'module', version }) + '\n');
console.log('Prepared donta command and bundled setup assets.');
