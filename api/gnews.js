export default async function handler(req, res) {
  const { q, from, to } = req.query;

  const params = new URLSearchParams({
    q,
    lang: 'en',
    max: '5',
    from,
    to,
    sortby: 'publishedAt',
    token: '5c79a5bb0e1e709423f7835d3a7e6400',
  });

  const response = await fetch('https://gnews.io/api/v4/search?' + params);
  const data = await response.json();

  res.status(response.status).json(data);
}
