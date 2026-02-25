# 🌍 Global Game Monitor

## Project Overview

```
global-game-monitor/
│
├── 📁 README.md                 # Documentation
│
├── 📁 worker/                   # Cloudflare Workers Backend
│   ├── 📁 src/
│   │   └── 📄 index.ts     # RSS Proxy + KV Cache (254 lines)
│   ├── 📄 package.json          # Dependencies: itty-router
│   ├── 📄 wrangler.toml        # Deploy config
│   └── 📄 .gitignore
│
└── 📁 frontend/                  # Next.js 15 Frontend
    ├── 📁 app/
    │   ├── 📄 globals.css       # Tailwind + Dark theme
    │   ├── 📄 layout.tsx       # Root layout
    │   └── 📄 page.tsx         # Main dashboard (203 lines)
    ├── 📄 package.json          # Dependencies: Next.js 15, React 19
    ├── 📄 next.config.ts       # Worker URL config
    ├── 📄 tsconfig.json        # TypeScript config
    ├── 📄 postcss.config.js    # Tailwind CSS
    ├── 📄 .env.example         # Worker URL template
    └── 📄 .gitignore
```

## 📡 RSS Feeds (9 Sources)

| Icon | Name | URL | Category |
|------|------|-----|----------|
| 🎮 | Kotaku | kotaku.com/rss | Gaming News |
| 🔥 | IGN | feeds.ign.com/ign/news | Gaming News |
| 💻 | PC Gamer | pcgamer.com/rss/news | PC Gaming |
| 📐 | Polygon | polygon.com/rss/index.xml | Gaming Culture |
| 🎯 | GameSpot | gamespot.com/feeds/news | Gaming News |
| 🕹️ | IndieDB | indiedb.com/rss | Indie Games |
| 🐱 | Itch.io | itch.io/feed | Indie Games |
| 🔫 | Rock Paper Shotgun | rockpapershotgun.com/feeds/news | Indie/Alt |
| ⚡ | TechCrunch Gaming | techcrunch.com/category/gaming/feed | Tech Gaming |

## 🎯 Features

### Backend (Cloudflare Worker)
- ✅ 9 RSS feeds proxy
- ✅ KV Cache (5 min TTL)
- ✅ CORS headers
- ✅ Rate limiting via CF cache
- ✅ Health check endpoint
- ✅ No API keys required

### Frontend (Next.js 15)
- ✅ Real-time RSS fetching
- ✅ Auto-refresh every 5 minutes
- ✅ Dark theme (#0a0a0a background)
- ✅ Responsive design
- ✅ Source tab switching
- ✅ News cards with hover effects
- ✅ Time-ago display
- ✅ Cache size indicator

## 🚀 Deploy Commands

```bash
# Backend
cd worker
npm install
npm run dev         # http://localhost:8787
npx wrangler deploy   # Deploy to Cloudflare

# Frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev         # http://localhost:3000
npm run build        # Production build
```

## 📝 Configuration

### Environment Variables (.env.local)
```env
NEXT_PUBLIC_WORKER_URL=http://localhost:8787
# Or deployed worker:
# NEXT_PUBLIC_WORKER_URL=https://global-game-monitor-worker.your-name.workers.dev
```

## 🎨 Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Cloudflare Workers, itty-router, KV Storage
- **Icons:** Lucide React
- **Deploy:** Wrangler CLI, Vercel (frontend)

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/feeds/:source` | GET | Fetch RSS from specific source |
| `/api/feeds` | GET | List all available sources |
| `/api/health` | GET | Worker status & source count |

---

**Project Size:** 9 files, ~2,500 lines of code
**Cache Strategy:** 5-minute KV cache with CDN fallback
**Deployment:** Free tier Cloudflare Workers (100k req/day)
