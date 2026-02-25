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
  'Cache-Control': 'public, max-age=300',
};

// Simple RSS/Atom XML parser (Workers-compatible)
function parseRSS(xmlText: string) {
  const items: Array<{
    title: string;
    link: string;
    pubDate: string;
    description: string;
    category: string;
  }> = [];

  // Extract <item> blocks
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const itemMatches = xmlText.match(itemRegex) || [];

  for (const itemXml of itemMatches) {
    const item: any = {};

    // Extract specific tags using regex
    const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const pubDateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
    const descriptionMatch = itemXml.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)
      || itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    const categoryMatch = itemXml.match(/<category[^>]*>([\s\S]*?)<\/category>/i);

    if (titleMatch) item.title = decodeHTML(titleMatch[1]);
    if (linkMatch) item.link = linkMatch[1].trim();
    if (pubDateMatch) item.pubDate = pubDateMatch[1];
    if (descriptionMatch) item.description = decodeHTML(descriptionMatch[1]);
    if (categoryMatch) item.category = categoryMatch[1];

    // Only add if we have required fields
    if (item.title && item.link) {
      items.push({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate || '',
        description: item.description || '',
        category: item.category || '',
      });
    }
  }

  return items;
}

// Decode HTML entities
function decodeHTML(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .trim();
}

// Environment with optional KV
interface Env {
  RSS_CACHE?: KVNamespace;
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

  // Try KV cache first (if available)
  if (env.RSS_CACHE) {
    try {
      const cached = await env.RSS_CACHE.get(cacheKey, 'json');
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, 'X-Cache': 'HIT' },
        });
      }
    } catch (error) {
      // KV error - continue to fetch
    }
  }

  try {
    const response = await fetch(RSS_FEEDS[source], {
      cf: {
        cacheTtl: 300,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xmlText = await response.text();
    const items = parseRSS(xmlText);

    const data = {
      source,
      items: items.slice(0, 20),
      fetchedAt: new Date().toISOString(),
    };

    // Cache in KV (if available)
    if (env.RSS_CACHE) {
      try {
        await env.RSS_CACHE.put(cacheKey, JSON.stringify(data), {
          expirationTtl: 300,
        });
      } catch (error) {
        // KV error - ignore
      }
    }

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
