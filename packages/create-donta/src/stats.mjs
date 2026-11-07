export const PACKAGES = ['donta-cli', 'create-donta'];
export const PERIODS = ['last-day', 'last-week', 'last-month'];

export async function fetchDownloadStats(period = 'last-week', { fetcher = fetch, timeoutMs = 8000 } = {}) {
  if (!PERIODS.includes(period)) throw new Error('Period must be last-day, last-week or last-month.');
  const packages = await Promise.all(PACKAGES.map(async name => {
    try {
      const response = await fetcher(`https://api.npmjs.org/downloads/point/${period}/${name}`, {
        headers: { accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status === 404) throw new Error('No npm download report is available yet (HTTP 404); recently published packages can take time to appear');
      if (!response.ok) throw new Error(`npm API returned HTTP ${response.status}`);
      const data = await response.json();
      const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
      if (data.package !== name || !Number.isSafeInteger(data.downloads) || data.downloads < 0 || !date(data.start) || !date(data.end) || data.end < data.start) {
        throw new Error('npm API returned an unexpected response');
      }
      return { package: name, downloads: data.downloads, start: data.start, end: data.end };
    } catch (error) {
      return { package: name, downloads: null, error: ['TimeoutError', 'AbortError'].includes(error?.name) ? 'npm API request timed out' : error instanceof Error ? error.message : 'npm API request failed' };
    }
  }));
  return {
    source: 'https://api.npmjs.org/downloads/point/', period, packages,
    note: 'Downloads are registry downloads, not unique users or CLI executions. New-project versus existing-project usage is not collected. Counts can lag recent releases.',
  };
}

export function formatDownloadStats(stats) {
  return [
    `donta · npm downloads (${stats.period})`, '',
    ...stats.packages.map(item => item.downloads === null
      ? `${item.package}: unavailable — ${item.error}`
      : `${item.package}: ${item.downloads.toLocaleString('en-US')} downloads (${item.start} to ${item.end})`),
    '', stats.note,
  ].join('\n');
}
