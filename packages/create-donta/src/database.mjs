export function validateDatabaseUrl(value) {
  if (!value || /[\s"'\\]/.test(value)) return 'Enter a Postgres connection URL without whitespace or unescaped quotes.';
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname) throw new Error();
  } catch { return 'Use a postgres:// or postgresql:// connection URL.'; }
}
