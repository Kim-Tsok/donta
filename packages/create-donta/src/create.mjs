import { cp, mkdir, readFile, readdir, realpath, rename, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { validateDatabaseUrl } from './database.mjs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const assets = fileURLToPath(new URL('../assets/', import.meta.url));

export function projectName(target) {
  const name = basename(resolve(target));
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name) || name.length > 214 || ['node_modules', 'favicon.ico'].includes(name)) {
    throw new Error('Use a directory name with lowercase letters, numbers, dots, hyphens or underscores, starting with a letter or number.');
  }
  return name;
}

export async function createProject(target, { cwd = process.cwd(), databaseUrl } = {}) {
  if (databaseUrl && validateDatabaseUrl(databaseUrl)) throw new Error(validateDatabaseUrl(databaseUrl));
  const destination = resolve(cwd, target);
  const name = projectName(destination);
  // Check assets before creating anything in the user's directory.
  await readdir(resolve(assets, 'next'));
  const entries = await readdir(destination).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  if (entries.length) throw new Error(`Directory ${destination} is not empty. Choose a new or empty directory.`);
  await mkdir(destination, { recursive: true });
  // An empty directory symlink must not allow copying back into our own assets.
  const actual = await realpath(destination);
  if (actual === assets || actual.startsWith(assets + '/')) throw new Error('Choose a destination outside the generator assets.');
  await cp(resolve(assets, 'next'), destination, { recursive: true });
  await rename(resolve(destination, 'gitignore'), resolve(destination, '.gitignore'));
  await mkdir(resolve(destination, 'vendor'), { recursive: true });
  await cp(resolve(assets, 'runtime'), resolve(destination, 'vendor/donta'), { recursive: true });
  const manifestPath = resolve(destination, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.name = name;
  // A local package keeps the result usable before donta is published to npm.
  manifest.dependencies.donta = 'file:./vendor/donta';
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(resolve(destination, '.env.local'), `# Generated for this project. Keep this file private.\nBETTER_AUTH_SECRET="${randomBytes(32).toString('base64')}"\nBETTER_AUTH_URL="http://localhost:3000"\n${databaseUrl ? `DATABASE_URL="${databaseUrl}"` : '# DATABASE_URL="your Neon connection string"'}\n`, { mode: 0o600, flag: 'wx' });
  return { destination, name };
}
