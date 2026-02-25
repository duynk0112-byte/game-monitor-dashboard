# Global Game Monitor

Global gaming news dashboard với Cloudflare Workers backend.

## 📁 Cấu trúc

```
game-monitor/
├── worker/              # Cloudflare Worker (backend)
│   ├── src/index.ts     # Main logic
│   ├── wrangler.toml     # Deploy config
│   └── package.json
└── frontend/            # Next.js App
    ├── app/             # Pages & components
    ├── package.json
    ├── next.config.ts
    └── tsconfig.json
```

## 🚀 Deploy

### 1. Deploy Cloudflare Worker

```bash
cd worker
npm install
npx wrangler deploy
```

### 2. Deploy Frontend

```bash
cd frontend
npm install
npm run build
# Deploy to Vercel/Netlify/Cloudflare Pages
```

## 🔧 Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_WORKER_URL=https://your-worker.workers.dev
```

## 📡 RSS Feeds

- Kotaku, IGN, PC Gamer, Polygon
- GameSpot, Rock Paper Shotgun, Eurogamer
- IndieDB, Itch.io (indie games)

## ✨ Features

- ✅ Cloudflare KV cache (5 min TTL)
- ✅ CORS handled tự động
- ✅ Auto refresh mỗi 5 phút
- ✅ Dark theme mặc định
- ✅ Responsive mobile/desktop

## 💡 Commands

```bash
# Worker dev
cd worker && npm run dev

# Frontend dev  
cd frontend && npm run dev

# Build
cd frontend && npm run build
```
