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

## 🚀 Deploy

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

## ⬆️ Auto Deploy lên GitHub

**Cách 1: Auto (không cần username)**

```bash
cd /root/.openclaw/workspace/game-monitor

export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxx
./auto-deploy.sh
```

Xem chi tiết: [AUTO_DEPLOY.md](./AUTO_DEPLOY.md)

**Cách 2: SSH (cần username)**

```bash
# 1. Thay YOUR_USERNAME trong remote
git remote set-url origin git@github.com:YOUR_USERNAME/global-game-monitor.git

# 2. Push
git push -u origin master
```

---

**Khuyên nghị:** Dùng **Auto Deploy** - nhanh hơn, tự động hơn!
