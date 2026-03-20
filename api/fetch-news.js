// ── Source definitions ─────────────────────────────────────

const RSS_FEEDS = [
  { name: 'The Verge - AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'The Verge - Tech', url: 'https://www.theverge.com/rss/tech/index.xml' },
  { name: 'TechCrunch - AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'Creative Bloq', url: 'https://www.creativebloq.com/feeds/all' },
];

// ── Scoring signals ────────────────────────────────────────
const SIGNALS = {
  tool_major: {
    tools: ['figma', 'adobe firefly', 'firefly', 'adobe', 'canva', 'midjourney', 'dall-e', 'dall·e',
            'stable diffusion', 'framer', 'galileo', 'uizard', 'leonardo', 'runway',
            'microsoft designer', 'google stitch', 'stitch', 'vibe design', 'google design',
            'sketch', 'invision', 'protopie', 'spline', 'pika', 'sora', 'ideogram',
            'recraft', 'lovart', 'design ai', 'ai designer', 'nvidia', 'dlss'],
    actions: ['launch', 'releases', 'released', 'introduce', 'announce', 'unveil',
              'rolls out', 'roll out', 'ships', 'debuts', 'drops', 'just dropped',
              'launched', 'introduced', 'announced', 'new model', 'new version',
              'custom model', 'new tool', 'new feature', 'now available', 'just launched'],
    score: 22,
  },
  tool_minor: {
    tools: ['figma', 'adobe', 'firefly', 'canva', 'midjourney', 'dall-e', 'framer', 'galileo',
            'uizard', 'leonardo', 'runway', 'sketch', 'ai design', 'generative design',
            'google stitch', 'design tool', 'creative tool', 'ai art', 'ai image',
            'image generation', 'text to image', 'generative ai'],
    actions: ['update', 'adds', 'added', 'new feature', 'improves', 'expands',
              'integrates', 'plugin', 'beta', 'ai-powered', 'powered by ai', 'updated',
              'tame ai', 'using ai', 'with ai', 'ai model', 'ai tool', 'can ai'],
    score: 12,
  },
  layoffs: {
    primary: ['layoff', 'laid off', 'lay off', 'job cut', 'redundan', 'let go',
              'studio clos', 'shutter', 'shut down', 'downsiz', 'workforce reduc',
              'position eliminat', 'retrench', 'restructur', 'headcount',
              'job loss', 'firing', 'fired', 'cut jobs', 'cutting jobs'],
    context: ['design', 'designer', 'creative', 'ux', 'ui', 'agency', 'studio',
              'art director', 'illustrator', 'motion', 'graphic', 'brand',
              'visual', 'product designer', 'web designer', 'animator',
              'creative director', 'design team', 'design department'],
    score: 32,
  },
  replacement: {
    phrases: ['replac', 'ai instead of designer', 'no longer need designer',
              'designer obsolete', 'ai beats designer', 'ai beat designer',
              'ai-generated design', 'designers are cooked', 'designer is cooked',
              'designers cooked', 'ai took', 'without designer', 'ai does the design',
              'fired their designer', 'replaced their designer', 'ditched their designer',
              'designers are finished', 'end of designers', 'ai will replace designer',
              'do we need designers', 'designers becoming obsolete', 'kill design jobs',
              'no need for designers', 'designers out of work', 'ai killing design',
              'death of design', 'designers unemployed', 'vibe design'],
    score: 18,
  },
};

const SUMMARIES = {
  safe: [
    "The robots clocked out early today. Designers across the world can unclench — no major AI announcements, no layoffs, no existential crises. Enjoy it while it lasts.",
    "Surprisingly quiet on the AI front. Either the tech overlords are on vacation, or they're just charging up for something bigger. Either way, designers live to kern another day.",
    "Nothing to report. The design industry is intact, no one dropped a bombshell, and no one declared designers obsolete today. A miracle, frankly.",
  ],
  warm: [
    "A few ripples in the pond, but nothing catastrophic. Some AI news is floating around but it's not the apocalypse — just a gentle reminder that the robots are still watching.",
    "Mild heat today. There's movement in the AI design space but nothing that should make you update your LinkedIn just yet. Maybe check back tomorrow.",
    "The thermometer is rising slightly. A few headlines worth noting, but designers are still very much employed and needed. For now.",
  ],
  hot: [
    "It's getting warm in here. Some significant AI developments in the design space today — not a full meltdown, but enough to make any designer refresh their portfolio.",
    "Okay, now we're cooking. Today brought some real news that has the design community sweating. Not a crisis, but definitely a 'maybe learn some prompting' kind of day.",
    "The heat is real. Enough happened today that even the optimists are quietly opening their freelance profiles. Just in case.",
  ],
  cooked: [
    "Designers are very cooked today. Between the layoffs and the AI announcements, it's been a rough one. The good news: someone still has to tell the AI what to make. Probably.",
    "Well. It's been a day. Multiple alarm bells are ringing in the design world — new tools, job cuts, and the usual 'AI will replace you' discourse hitting new highs. Carry on, I guess.",
    "Today was not kind to the design industry. If you're a designer reading this, maybe go touch some grass and come back when the news cycle calms down. Or don't. It might not.",
  ],
  apocalypse: [
    "RIP designers. Today was a full-on disaster — major layoffs, significant AI tool launches, and enough 'AI replaces designers' stories to fill a LinkedIn feed. It was fun while it lasted.",
    "The score speaks for itself. Today delivered a near-perfect storm of bad design industry news. We had a good run, folks.",
  ],
};

// ── Fetchers ───────────────────────────────────────────────

// Simple XML tag extractor — no external parser needed
function extractTags(xml, tag) {
  const results = [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  let m;
  while ((m = re.exec(xml)) !== null) results.push(m[1].trim());
  return results;
}

function stripCDATA(str) {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

async function fetchRSS(feed) {
  const r = await fetch(feed.url, {
    headers: { 'User-Agent': 'are-designers-cooked/1.0' },
  });
  const xml = await r.text();

  const titles      = extractTags(xml, 'title').map(stripCDATA);
  const links       = extractTags(xml, 'link').map(stripCDATA);
  const descs       = extractTags(xml, 'description').map(stripCDATA);
  const pubDates    = extractTags(xml, 'pubDate').map(stripCDATA);
  const updatedDates = extractTags(xml, 'updated').map(stripCDATA);

  const articles = [];
  // Skip index 0 — it's the feed title, not an article
  for (let i = 1; i < titles.length; i++) {
    const pub = pubDates[i] || updatedDates[i] || new Date().toISOString();
    articles.push({
      title:       titles[i] || '',
      description: descs[i] || '',
      url:         links[i] || '',
      source:      feed.name,
      publishedAt: new Date(pub).toISOString(),
    });
  }
  return articles;
}

async function fetchProductHunt() {
  const tokenRes = await fetch('https://api.producthunt.com/v2/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     process.env.PRODUCT_HUNT_API_KEY,
      client_secret: process.env.PRODUCT_HUNT_API_SECRET,
      grant_type:    'client_credentials',
    }),
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  if (!token) throw new Error('Product Hunt auth failed: ' + JSON.stringify(tokenData));

  const query = `{
    posts(first: 30, order: NEWEST) {
      edges {
        node {
          name
          tagline
          url
          createdAt
        }
      }
    }
  }`;

  const r = await fetch('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  });
  const data = await r.json();
  const posts = data?.data?.posts?.edges || [];

  return posts.map(({ node }) => ({
    title:       node.name + ' — ' + node.tagline,
    description: node.tagline,
    url:         node.url,
    source:      'Product Hunt',
    publishedAt: node.createdAt,
  }));
}

// Strict keywords for RSS/GNews — must be specifically about digital design
const RELEVANCE_KEYWORDS = [
  // Specific roles
  'ux designer', 'ui designer', 'graphic designer', 'product designer',
  'web designer', 'motion designer', 'interaction designer', 'visual designer',
  'art director', 'creative director', 'brand designer', 'designer',

  // Specific disciplines
  'user experience', 'user interface', 'ux design', 'ui design',
  'graphic design', 'motion design', 'web design', 'product design',
  'interaction design', 'design system', 'design tool', 'design software',
  'wireframe', 'prototype', 'design workflow', 'design industry',

  // Named tools
  'figma', 'sketch', 'framer', 'webflow', 'canva', 'invision', 'zeplin',
  'illustrator', 'photoshop', 'indesign', 'after effects', 'protopie',
  'spline', 'principle',

  // Named AI design tools
  'midjourney', 'dall-e', 'stable diffusion', 'firefly', 'adobe firefly',
  'runway ml', 'ideogram', 'recraft', 'lovart', 'google stitch',
  'microsoft designer', 'vibe design',

  // Explicit signals
  'designers are cooked', 'designer layoff', 'design layoff',
  'ai replace designer', 'ai replacing designer', 'design jobs',
];

// Looser keywords for Product Hunt — short punchy titles need simpler matching
const PH_RELEVANCE_KEYWORDS = [
  'design', 'designer', 'figma', 'ui', 'ux', 'canva', 'framer', 'webflow',
  'sketch', 'prototype', 'wireframe', 'mockup', 'icon', 'logo', 'font',
  'typography', 'color', 'illustration', 'motion', 'animation', 'creative',
  'midjourney', 'dall-e', 'firefly', 'image gen', 'ai art', 'ai image',
  'text to image', 'generative', 'visual', 'graphic', 'brand', 'landing page',
  'component', 'asset', 'template', 'style guide', 'design system',
];

function isRelevant(article) {
  const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
  const keywords = article.source === 'Product Hunt' ? PH_RELEVANCE_KEYWORDS : RELEVANCE_KEYWORDS;
  return keywords.some(kw => text.includes(kw));
}

function matchesAny(text, keywords) {
  return keywords.some(kw => text.includes(kw));
}

function scoreArticle(article) {
  const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();

  if (matchesAny(text, SIGNALS.replacement.phrases))
    return { score: SIGNALS.replacement.score, category: 'replacement' };

  if (matchesAny(text, SIGNALS.layoffs.primary) && matchesAny(text, SIGNALS.layoffs.context))
    return { score: SIGNALS.layoffs.score, category: 'layoffs' };

  if (matchesAny(text, SIGNALS.tool_major.tools) && matchesAny(text, SIGNALS.tool_major.actions))
    return { score: SIGNALS.tool_major.score, category: 'tool_major' };

  if (matchesAny(text, SIGNALS.tool_minor.tools) && matchesAny(text, SIGNALS.tool_minor.actions))
    return { score: SIGNALS.tool_minor.score, category: 'tool_minor' };

  // Product Hunt specific — short titles need looser matching
  // If it's from PH and mentions AI + design together, score it
  if (article.source === 'Product Hunt') {
    const hasAI = ['ai', 'artificial intelligence', 'generative', 'llm', 'gpt'].some(kw => text.includes(kw));
    const hasDesign = ['design', 'designer', 'figma', 'ui', 'ux', 'creative', 'graphic',
                       'illustration', 'motion', 'prototype', 'wireframe', 'logo', 'font',
                       'brand', 'visual', 'color', 'icon', 'template'].some(kw => text.includes(kw));
    if (hasAI && hasDesign) return { score: 10, category: 'tool_minor' };
  }

  return { score: 0, category: null };
}

function analyzeHeadlines(articles) {
  const categoryCounts = {};
  const relevant = [];
  let totalScore = 0;

  articles.forEach((article, idx) => {
    const { score, category } = scoreArticle(article);
    if (score === 0) return;

    const count = categoryCounts[category] || 0;
    const effectiveScore = count >= 2 ? score * 0.3 : count === 1 ? score * 0.6 : score;
    categoryCounts[category] = count + 1;

    totalScore += effectiveScore;
    relevant.push(idx);
  });

  totalScore = Math.min(100, Math.round(totalScore));

  let band;
  if (totalScore <= 15)      band = 'safe';
  else if (totalScore <= 40) band = 'warm';
  else if (totalScore <= 65) band = 'hot';
  else if (totalScore <= 85) band = 'cooked';
  else                       band = 'apocalypse';

  const pool = SUMMARIES[band];
  const summary = pool[Math.floor(Math.random() * pool.length)];

  return { score: totalScore, summary, relevant };
}

// ── KV ────────────────────────────────────────────────────

async function kvSet(key, value) {
  const url = `${process.env.KV_REST_API_URL}/set/${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });
  return res.ok;
}

// ── Main handler ───────────────────────────────────────────

export default async function handler(req, res) {
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET && !isVercelCron) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now  = new Date();
    const from = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    // Run all sources in parallel
    const [rssResults, phResult] = await Promise.all([
      Promise.allSettled(RSS_FEEDS.map(f => fetchRSS(f))),
      fetchProductHunt().then(r => [{ status: 'fulfilled', value: r }]).catch(e => [{ status: 'rejected', reason: e }]),
    ]);

    // Collect all articles
    const seen = new Set();
    const allArticles = [];

    const addArticles = (results, label) => {
      let added = 0, skippedDate = 0, skippedDupe = 0, skippedIrrelevant = 0, failed = 0;
      for (const r of results) {
        if (r.status !== 'fulfilled') {
          console.warn(`[fetch-news] ${label} source failed:`, r.reason?.message);
          failed++;
          continue;
        }
        for (const article of r.value) {
          if (!article.url) continue;
          if (seen.has(article.url)) { skippedDupe++; continue; }
          const t = new Date(article.publishedAt).getTime();
          if (t < from.getTime()) { skippedDate++; continue; }
          if (!isRelevant(article)) { skippedIrrelevant++; continue; }
          seen.add(article.url);
          allArticles.push(article);
          added++;
        }
      }
      console.log(`[fetch-news] ${label}: +${added} articles (skipped ${skippedDate} too old, ${skippedIrrelevant} irrelevant, ${skippedDupe} dupes, ${failed} failed)`);
    };

    addArticles(rssResults, 'RSS');
    addArticles(phResult, 'ProductHunt');

    console.log(`[fetch-news] Total: ${allArticles.length} articles in window`);
    // Log first 5 titles to see what we're working with
    allArticles.slice(0, 8).forEach((a, i) =>
      console.log(`[fetch-news] Article ${i+1}: [${a.source}] ${a.title}`)
    );

    const analysis = analyzeHeadlines(allArticles);
    const relevantArticles = allArticles
      .filter((_, i) => analysis.relevant.includes(i))
      .slice(0, 6)
      .map(a => ({
        title:       a.title,
        url:         a.url,
        source:      a.source,
        publishedAt: a.publishedAt,
      }));

    const result = {
      score:     analysis.score,
      summary:   analysis.summary,
      articles:  relevantArticles,
      total:     allArticles.length,
      fetchedAt: now.toISOString(),
    };

    await kvSet('latest_result', result);

    console.log(`[fetch-news] Done. Score: ${result.score}, Total: ${result.total}, Relevant: ${relevantArticles.length}`);
    return res.status(200).json({ ok: true, result });

  } catch (err) {
    console.error('[fetch-news] Fatal error:', err);
    return res.status(500).json({ error: err.message });
  }
}
