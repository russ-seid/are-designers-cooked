const GNEWS_KEY = '5c79a5bb0e1e709423f7835d3a7e6400';

const GNEWS_QUERIES = [
  'AI design tool released',
  'designer layoffs AI',
  'AI replace designer',
];

const SIGNALS = {
  tool_major: {
    tools: ['figma', 'adobe firefly', 'adobe', 'canva', 'midjourney', 'dall-e', 'dall·e',
            'stable diffusion', 'framer', 'galileo', 'uizard', 'leonardo', 'runway',
            'microsoft designer', 'google design', 'sketch', 'invision', 'protopie',
            'spline', 'pika', 'sora', 'ideogram', 'recraft'],
    actions: ['launch', 'releases', 'released', 'introduce', 'announce', 'unveil',
              'rolls out', 'roll out', 'ships', 'debuts', 'drops', 'just dropped'],
    score: 22,
  },
  tool_minor: {
    tools: ['figma', 'adobe', 'canva', 'midjourney', 'dall-e', 'framer', 'galileo',
            'uizard', 'leonardo', 'runway', 'sketch', 'ai design', 'generative design'],
    actions: ['update', 'adds', 'added', 'new feature', 'improves', 'expands',
              'integrates', 'plugin', 'beta', 'ai-powered', 'powered by ai'],
    score: 12,
  },
  layoffs: {
    primary: ['layoff', 'laid off', 'lay off', 'job cut', 'redundan', 'let go',
              'studio clos', 'shutter', 'shut down', 'downsiz', 'workforce reduc',
              'position eliminat', 'retrench', 'restructur', 'headcount'],
    context: ['design', 'designer', 'creative', 'ux', 'ui', 'agency', 'studio',
              'art director', 'illustrator', 'motion'],
    score: 32,
  },
  replacement: {
    phrases: ['replac', 'ai instead of designer', 'no longer need designer',
              'designer obsolete', 'ai beats designer', 'ai beat designer',
              'ai-generated design', 'ai over designer', 'ai took', 'without designer',
              'ai does the design', 'ai doing design', 'fired their designer',
              'replaced their designer', 'ditched their designer'],
    score: 18,
  },
};

const SUMMARIES = {
  safe: [
    "The robots clocked out early today. Designers across the world can unclench — no major AI announcements, no layoffs, no existential crises. Enjoy it while it lasts.",
    "Surprisingly quiet on the AI front. Either the tech overlords are on vacation, or they're just charging up for something bigger. Either way, designers live to kern another day.",
    "Nothing to report. The design industry is intact, Figma hasn't dropped a bombshell, and no one declared designers obsolete today. A miracle, frankly.",
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

export default async function handler(req, res) {
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET && !isVercelCron) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now  = new Date();
    const from = new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString();

    const fetches = await Promise.allSettled(
      GNEWS_QUERIES.map(async q => {
        const params = new URLSearchParams({ q, lang: 'en', max: '10', sortby: 'publishedAt', token: GNEWS_KEY });
        const r = await fetch('https://gnews.io/api/v4/search?' + params);
        const data = await r.json();
        return data.articles || [];
      })
    );

    const seen = new Set();
    const allArticles = [];
    for (const f of fetches) {
      if (f.status === 'fulfilled') {
        for (const article of f.value) {
          if (!seen.has(article.url)) {
            seen.add(article.url);
            const t = new Date(article.publishedAt).getTime();
            if (t >= new Date(from).getTime()) allArticles.push(article);
          }
        }
      }
    }

    const analysis = analyzeHeadlines(allArticles);
    const relevantArticles = allArticles
      .filter((_, i) => analysis.relevant.includes(i))
      .slice(0, 5)
      .map(a => ({
        title:       a.title,
        url:         a.url,
        source:      a.source?.name || '',
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

    console.log(`[fetch-news] Done. Score: ${result.score}, Articles: ${result.total}`);
    return res.status(200).json({ ok: true, result });

  } catch (err) {
    console.error('[fetch-news] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
