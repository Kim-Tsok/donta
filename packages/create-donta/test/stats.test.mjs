import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchDownloadStats, formatDownloadStats } from '../src/stats.mjs';

const result = (name, count) => ({ ok: true, json: async () => ({ package: name, downloads: count, start: '2026-10-30', end: '2026-11-05' }) });

test('reads both npm packages and labels downloads without claiming users or command usage', async () => {
  const urls = [];
  const stats = await fetchDownloadStats('last-week', { fetcher: async (url, options) => {
    urls.push(url);
    assert.equal(options.headers.accept, 'application/json');
    assert.ok(options.signal instanceof AbortSignal);
    return result(url.endsWith('/donta-cli') ? 'donta-cli' : 'create-donta', 12);
  } });
  assert.equal(urls.length, 2);
  assert.ok(urls.every(url => url.startsWith('https://api.npmjs.org/downloads/point/last-week/')));
  assert.deepEqual(stats.packages.map(item => item.downloads), [12, 12]);
  assert.match(formatDownloadStats(stats), /not unique users or CLI executions/);
  assert.match(formatDownloadStats(stats), /not collected/);
});

test('partial failures remain unavailable rather than being counted as zero', async () => {
  const stats = await fetchDownloadStats('last-month', { fetcher: async url => url.endsWith('/donta-cli') ? result('donta-cli', 0) : { ok: false, status: 503 } });
  assert.equal(stats.packages[0].downloads, 0);
  assert.equal(stats.packages[1].downloads, null);
  assert.match(formatDownloadStats(stats), /create-donta: unavailable/);
  assert.match(stats.packages[1].error, /HTTP 503/);
});

test('rejects bad periods before making requests and validates response data', async () => {
  let calls = 0;
  await assert.rejects(fetchDownloadStats('invalid', { fetcher: async () => { calls++; } }), /Period must/);
  assert.equal(calls, 0);
  for (const count of [-1, '12', 1.2]) {
    const stats = await fetchDownloadStats('last-day', { fetcher: async url => result(url.split('/').pop(), count) });
    assert.ok(stats.packages.every(item => item.downloads === null));
  }
  const wrong = await fetchDownloadStats('last-day', { fetcher: async () => result('another-package', 20) });
  assert.ok(wrong.packages.every(item => item.downloads === null));
});

test('timeouts return a clear unavailable status', async () => {
  const stats = await fetchDownloadStats('last-week', { fetcher: async () => { throw new DOMException('timeout', 'TimeoutError'); } });
  assert.ok(stats.packages.every(item => item.downloads === null && item.error.includes('timed out')));
});

test('CLI JSON output is scriptable and partial failures set a nonzero exit code', async () => {
  const { spawnSync } = await import('node:child_process');
  const cli = new URL('../src/cli.mjs', import.meta.url).pathname;
  const mock = partial => `globalThis.fetch = async url => url.endsWith('/create-donta') && ${partial} ? { ok: false, status: 503 } : { ok: true, json: async () => ({ package: url.split('/').pop(), downloads: 7, start: '2026-10-30', end: '2026-11-05' }) };`;
  for (const partial of [false, true]) {
    const preload = 'data:text/javascript,' + encodeURIComponent(mock(partial));
    const run = spawnSync(process.execPath, ['--import', preload, cli, 'stats', '--json'], { encoding: 'utf8' });
    assert.equal(run.status, partial ? 1 : 0, run.stderr);
    const data = JSON.parse(run.stdout);
    assert.equal(data.packages[0].downloads, 7);
    assert.equal(data.packages[1].downloads, partial ? null : 7);
  }
  const bad = spawnSync(process.execPath, [cli, 'stats', '--period', 'invalid'], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /Period must/);
});
