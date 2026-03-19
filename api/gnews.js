export default async function handler(req, res) {
  const { q, from, to } = req.query;

  console.log('GNews proxy called with:', { q, from, to });

  if (!q || !from || !to) {
    console.error('Missing params:', { q, from, to });
    return res.status(400).json({ error: 'Missing required params: q, from, to' });
  }

  const params = new URLSearchParams({
    q,
    lang: 'en',
    max: '5',
    from,
    to,
    sortby: 'publishedAt',
    token: '5c79a5bb0e1e709423f7835d3a7e6400',
  });

  const gnewsUrl = 'https://gnews.io/api/v4/search?' + params;
  console.log('Fetching GNews:', gnewsUrl);

  try {
    const response = await fetch(gnewsUrl);
    const data = await response.json();
    console.log('GNews responded:', response.status, JSON.stringify(data).slice(0, 200));
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('GNews fetch failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
