export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing required param: q' });
  }

  const params = new URLSearchParams({
    q,
    lang: 'en',
    max: '10',
    sortby: 'publishedAt',
    token: '5c79a5bb0e1e709423f7835d3a7e6400',
  });

  try {
    const response = await fetch('https://gnews.io/api/v4/search?' + params);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
