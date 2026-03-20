// On-demand fetch + score. No caching, no Upstash.
// Accepts ?date=YYYY-MM-DD (defaults to today)
// When Reddit is added, pass the same date to fetchReddit()

const RSS_FEEDS = [
  // AI focused
  { name: 'The Verge - AI',    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
  { name: 'The Verge - Tech',  url: 'https://www.theverge.com/rss/tech/index.xml' },
  { name: 'TechCrunch - AI',   url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  // Design focused
  { name: 'Creative Bloq',     url: 'https://www.creativebloq.com/feeds/all' },
  { name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/' },
  { name: 'UX Collective',     url: 'https://uxdesign.cc/feed' },
  { name: 'Design Shack',      url: 'https://designshack.net/feed/' },
  // AI tools news
  { name: 'VentureBeat AI',    url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'Ars Technica',      url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
];

// ── Three categories that count ───────────────────────────

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

// ── Three categories that count ───────────────────────────
//
// CAT 1: AI tools that improve design process
// CAT 2: Vibe-coding tools
// CAT 3: Design/creative layoffs
// CAT 4: AI replacing creative roles broadly

const DESIGN_AI_TOOLS = [
  // Design-specific AI tools
  'figma', 'adobe firefly', 'firefly', 'adobe', 'canva', 'framer',
  'sketch', 'webflow', 'protopie', 'spline', 'invision', 'zeplin',
  'midjourney', 'dall-e', 'dall·e', 'stable diffusion', 'ideogram',
  'recraft', 'lovart', 'leonardo ai', 'runway', 'pika', 'sora',
  'microsoft designer', 'google stitch', 'adobe express',
  'uizard', 'galileo ai', 'magician', 'diagram',
  // New design AI tools
  'gamma', 'relume', 'creatie', 'coframe', 'attention insight',
  'khroma', 'fontjoy', 'remove.bg', 'clipdrop',
  // AI video — threatens motion designers
  'kling', 'hailuo', 'luma dream machine', 'dream machine',
  // General AI when in design context
  'gemini', 'chatgpt', 'claude',

  // Vibe-coding / AI UI builders
  'v0', 'bolt', 'lovable', 'cursor', 'replit', 'github copilot',
  'vibe coding', 'vibe-coding', 'vibe design', 'vibe-design',
  'no-code', 'ai builder', 'ai website builder', 'ai ui',
  'ai frontend', 'ai layout', 'ai component',
  // More vibe-coding tools
  'tempo', 'windsurf', 'devin', 'vercel v0',
  'supabase', 'ai code editor',
];

const DESIGN_AI_ACTIONS = [
  // Launches
  'launch', 'launches', 'released', 'releases', 'announces', 'announced',
  'unveiled', 'unveils', 'ships', 'debuts', 'drops', 'just dropped',
  'rolls out', 'now available', 'just launched', 'introduces', 'introduced',
  // Updates
  'adds', 'added', 'new feature', 'new model', 'new version', 'update',
  'updated', 'improves', 'expands', 'beta', 'ai-powered', 'powered by ai',
  // General AI + design
  'generate', 'generated', 'generative', 'ai-generated',
  // Loose but real
  'new ', 'custom model', 'tame ai', 'using ai', 'with ai', 'can ai',
  'ai tool', 'ai model', 'ai feature', 'ai update', 'ai plugin',
  'ai integration', 'ai workflow', 'for designers', 'for creatives',
  // Catches "says X is here", "could open", "is a no-code"
  'says', 'is here', 'could ', 'is a ', 'will ', 'has ', 'here to',
  'open ', 'change ', 'transform', 'disrupt', 'replace', 'kill ',
];

const LAYOFF_WORDS = [
  'layoff', 'laid off', 'lay off', 'job cut', 'job loss', 'redundan',
  'let go', 'studio clos', 'shutter', 'shut down', 'downsiz',
  'workforce reduc', 'position eliminat', 'retrench', 'restructur',
  'fired', 'cut jobs', 'cutting jobs', 'headcount reduc',
  'rif', 'reduction in force', 'position eliminated', 'tech layoff',
  'mass layoff', 'layoffs hit',
];

const DESIGN_CONTEXT = [
  'designer', 'design team', 'design studio', 'design agency',
  'creative team', 'creative studio', 'creative agency',
  'ux', 'ui ', 'art director', 'creative director',
  'illustrator', 'motion designer', 'graphic designer',
  'product designer', 'web designer', 'brand designer',
  // Broader creative roles
  'animator', 'photographer', 'videographer', 'cinematographer',
  'visual artist', 'concept artist', 'game artist', '3d artist',
  'creative professional', 'creative worker', 'creative industry',
  'creative job', 'creative role', 'creative position',
];

const REPLACEMENT_PHRASES = [
  'replace designer', 'replacing designer', 'replaced by ai',
  'ai replace', 'no longer need designer', 'designer obsolete',
  'ai beats designer', 'designers are cooked', 'designers cooked',
  'fired their designer', 'ditched their designer', 'ai took',
  'end of designers', 'death of design', 'designers unemployed',
  'designers out of work', 'ai instead of designer',
  // Broader creative replacement
  'replace illustrator', 'replace animator', 'replace artist',
  'replace photographer', 'replace creative', 'replacing artists',
  'replacing illustrators', 'replacing animators',
  'ai replaces creative', 'ai replacing creative',
  'no longer need artist', 'artists out of work',
  'illustrators losing jobs', 'artists losing jobs',
];

function matchesAny(text, keywords) {
  return keywords.some(kw => text.includes(kw));
}

function isRelevant(article) {
  const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();

  // Always let through: explicit replacement phrases
  if (matchesAny(text, REPLACEMENT_PHRASES)) return true;

  // CAT 3: layoffs with design context
  if (matchesAny(text, LAYOFF_WORDS) && matchesAny(text, DESIGN_CONTEXT)) return true;

  // CAT 1 & 2: named tool + any action or AI word
  if (matchesAny(text, DESIGN_AI_TOOLS) && matchesAny(text, DESIGN_AI_ACTIONS)) return true;

  // Product Hunt: must be a named tool, not just "design" in passing
  if (article.source === 'Product Hunt') {
    return matchesAny(text, DESIGN_AI_TOOLS);
  }

  return false;
}

// ── Scoring ────────────────────────────────────────────────
function scoreArticle(article) {
  const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();

  // Explicit replacement — highest signal
  if (matchesAny(text, REPLACEMENT_PHRASES))
    return { score: 20, category: 'replacement' };

  // Layoffs with design context
  if (matchesAny(text, LAYOFF_WORDS) && matchesAny(text, DESIGN_CONTEXT))
    return { score: 32, category: 'layoffs' };

  // Major named tool launch — tool + strong action
  const strongActions = ['launch', 'launches', 'released', 'releases', 'announced',
    'announces', 'unveiled', 'unveils', 'ships', 'debuts', 'drops', 'now available',
    'just launched', 'just dropped', 'rolls out'];
  if (matchesAny(text, DESIGN_AI_TOOLS) && matchesAny(text, strongActions))
    return { score: 22, category: 'tool_major' };

  // Minor update or vibe-coding mention
  if (matchesAny(text, DESIGN_AI_TOOLS) && matchesAny(text, DESIGN_AI_ACTIONS))
    return { score: 12, category: 'tool_minor' };

  // Product Hunt — named tool present, assume launch
  if (article.source === 'Product Hunt' && matchesAny(text, DESIGN_AI_TOOLS))
    return { score: 10, category: 'tool_minor' };

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

// ── Fetchers ───────────────────────────────────────────────
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
  const r = await fetch(feed.url, { headers: { 'User-Agent': 'are-designers-cooked/1.0' } });
  const xml = await r.text();
  const titles       = extractTags(xml, 'title').map(stripCDATA);
  const links        = extractTags(xml, 'link').map(stripCDATA);
  const descs        = extractTags(xml, 'description').map(stripCDATA);
  const pubDates     = extractTags(xml, 'pubDate').map(stripCDATA);
  const updatedDates = extractTags(xml, 'updated').map(stripCDATA);
  const articles = [];
  for (let i = 1; i < titles.length; i++) {
    const title = titles[i] || '';
    // Skip feed-level titles (no link, or title matches feed name, or too short)
    if (!links[i] || title.length < 15) continue;
    const pub = pubDates[i] || updatedDates[i] || new Date().toISOString();
    articles.push({
      title,
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
  if (!token) throw new Error('Product Hunt auth failed');

  const query = `{
    posts(first: 30, order: NEWEST) {
      edges { node { name tagline url createdAt } }
    }
  }`;

  const r = await fetch('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

// ── Date helpers ───────────────────────────────────────────
function getDateWindow(dateParam) {
  // dateParam: 'YYYY-MM-DD' or null (defaults to today)
  const now = new Date();

  if (!dateParam) {
    // Today: last 36h to account for RSS publication delays
    return {
      from: new Date(now.getTime() - 36 * 60 * 60 * 1000),
      to:   now,
      label: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    };
  }

  // Specific date: full day in UTC
  const start = new Date(dateParam + 'T00:00:00Z');
  const end   = new Date(dateParam + 'T23:59:59Z');
  return {
    from:  start,
    to:    end,
    label: start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };
}

// ── Main handler ───────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const dateParam = req.query.date || null; // e.g. '2026-03-20'
  const window = getDateWindow(dateParam);

  try {
    const [rssResults, phResult] = await Promise.all([
      Promise.allSettled(RSS_FEEDS.map(f => fetchRSS(f))),
      fetchProductHunt()
        .then(r  => [{ status: 'fulfilled', value: r }])
        .catch(e => [{ status: 'rejected',  reason: e }]),
    ]);

    const seen = new Set();
    const allArticles = [];

    const addArticles = (results, label) => {
      let added = 0, skippedDate = 0, skippedIrrelevant = 0, failed = 0;
      for (const r of results) {
        if (r.status !== 'fulfilled') { failed++; continue; }
        for (const article of r.value) {
          if (!article.url || seen.has(article.url)) continue;
          const t = new Date(article.publishedAt).getTime();
          if (t < window.from.getTime() || t > window.to.getTime()) { skippedDate++; continue; }
          if (!isRelevant(article)) {
            skippedIrrelevant++;
            // Log borderline articles so we can tune the filter
            const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
            const hasTool = DESIGN_AI_TOOLS.some(kw => text.includes(kw));
            if (hasTool) console.log(`[results] NEAR-MISS [${label}]: ${article.title}`);
            continue;
          }
          seen.add(article.url);
          allArticles.push(article);
          added++;
        }
      }
      console.log(`[results] ${label}: +${added} (skipped ${skippedDate} out of range, ${skippedIrrelevant} irrelevant, ${failed} failed)`);
    };

    addArticles(rssResults, 'RSS');
    addArticles(phResult,   'ProductHunt');

    console.log(`[results] Total: ${allArticles.length} for ${window.label}`);
    allArticles.forEach((a, i) => console.log(`[results] Article ${i+1}: [${a.source}] ${a.title}`));

    const analysis = analyzeHeadlines(allArticles);
    const relevantArticles = allArticles
      .filter((_, i) => analysis.relevant.includes(i))
      .slice(0, 6)
      .map(a => ({ title: a.title, url: a.url, source: a.source, publishedAt: a.publishedAt }));

    return res.status(200).json({
      score:     analysis.score,
      summary:   analysis.summary,
      articles:  relevantArticles,
      total:     allArticles.length,
      date:      dateParam || new Date().toISOString().split('T')[0],
      label:     window.label,
      fetchedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[results] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
