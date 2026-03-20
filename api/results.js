async function kvGet(key) {
  const url = `${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.result ?? null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    let result = await kvGet('latest_result');

    if (!result) {
      console.log('[results] Cache empty, triggering fresh fetch...');
      const base = process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000';
      const fetchRes = await fetch(`${base}/api/fetch-news`, {
        headers: { 'x-cron-secret': process.env.CRON_SECRET || '' },
      });
      const fetchData = await fetchRes.json();
      result = fetchData.result || null;
    }

    if (!result) {
      return res.status(503).json({ error: 'No results available yet. Try again in a moment.' });
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error('[results] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
