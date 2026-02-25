// worker/src/index.ts - Cloudflare Worker backend
import { Router } from 'itty-router';

const router = Router();

// RSS Feeds list
const RSS_FEEDS = {
  // Main Gaming News
  gamespot: 'https://www.gamespot.com/feeds/news/',
  kotaku: 'https://kotaku.com/rss',
  pcgamer: 'https://www.pcgamer.com/rss/news',
  ign: 'https://feeds.ign.com/ign/news',
  rockpapershotgun: 'https://www.rockpapershotgun.com/feeds/news',
  eurogamer: 'https://www.eurogamer.net/news/feed',
  polygon: 'https://polygon.com/rss/index.xml',

  // Indie Games
  indiedb: 'https://indiedb.com/rss',
  itch: 'https://itch.io/feed',
  indieRetro: 'https://indie-retro-news.com/feed',
  alphaBeta: 'https://alphabeta-gamer.com/feed',

  // Tech Gaming
  techcrunch: 'https://techcrunch.com/category/gaming/feed',
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=300', // 5 min cache
};

// Parse RSS to JSON
async function parseRSS(xmlText: string) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');
  const items = Array.from(xml.querySelectorAll('item')).map(item => {
    const title = item.querySelector('title')?.textContent || '';
    const link = item.querySelector('link')?.textContent || '';
    const pubDate = item.querySelector('pubDate')?.textContent || '';
    const description = item.querySelector('description')?.textContent || '';
    const category = item.querySelector('category')?.textContent || '';

    return { title, link, pubDate, description, category };
  });

  return items;
}

// Cache with KV
interface Env {
  RSS_CACHE: KVNamespace;
}

// GET /api/feeds/:source
router.get('/api/feeds/:source', async (request, env) => {
  const source = request.params?.source as keyof typeof RSS_FEEDS;

  if (!source || !RSS_FEEDS[source]) {
    return new Response(JSON.stringify({ error: 'Invalid feed source' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const cacheKey = `rss:${source}`;
  const cached = await env.RSS_CACHE.get(cacheKey, 'json');

  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { ...corsHeaders, 'X-Cache': 'HIT' },
    });
  }

  try {
    const response = await fetch(RSS_FEEDS[source], {
      cf: {
        cacheTtl: 300, // 5 min CDN cache
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xmlText = await response.text();
    const items = await parseRSS(xmlText);

    const data = {
      source,
      items: items.slice(0, 20), // Limit 20 items
      fetchedAt: new Date().toISOString(),
    };

    // Cache for 5 minutes
    await env.RSS_CACHE.put(cacheKey, JSON.stringify(data), {
      expirationTtl: 300,
    });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'X-Cache': 'MISS' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

// GET /api/feeds (all sources)
router.get('/api/feeds', async (request, env) => {
  const sources = Object.keys(RSS_FEEDS).map(key => ({
    id: key,
    name: key,
    url: RSS_FEEDS[key as string],
  }));

  return new Response(JSON.stringify(sources), {
    headers: corsHeaders,
  });
});

// GET /api/health
router.get('/api/health', () => {
  return new Response(JSON.stringify({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    sources: Object.keys(RSS_FEEDS).length 
  }), {
    headers: corsHeaders,
  });
});

// Handle CORS preflight
router.options('*', () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
});

// 404
router.all('*', () => {
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: corsHeaders,
  });
});

// Export for Cloudflare Workers
export default {
  fetch: (request: Request, env: Env) => {
    return router.handle(request, env).catch((err) => {
      return new Response(JSON.stringify({ error: 'Internal Error' }), {
        status: 500,
        headers: corsHeaders,
      });
    });
  },
};
