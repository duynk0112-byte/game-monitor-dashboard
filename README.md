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

## 🚀 Deployment

### Worker Backend (Cloudflare) ✅

```bash
cd worker
npm install
npx wrangler deploy
```

**URL:** https://global-game-monitor-worker.duy-nk0112.workers.dev

---

### Frontend (Next.js)

**Option A: GitHub Actions (Automatic on push)**

Workflow: `.github/workflows/deploy-to-vercel.yml`

Khi bạn push code vào nhánh `master`, deploy tự động sẽ chạy!

**Trigger workflow:**
```bash
cd /root/.openclaw/workspace/game-monitor
git commit --allow-empty -m "Trigger Vercel deploy workflow"
git push origin master
```

Kết quả sau khi push:
- ✅ Frontend deployed successfully
- 📍 URL: https://game-monitor.vercel.app
- 📊 Worker: https://global-game-monitor-worker.duy-nk0112.workers.dev

**Option B: Deploy thủ công từ GitHub**
```bash
npx vercel deploy --prod --yes --token=YOUR_TOKEN
```

---

## 🔗 URLs

| Service | URL |
|----------|-----|
| Worker | https://global-game-monitor-worker.duy-nk0112.workers.dev |
| Frontend | https://game-monitor.vercel.app |
| GitHub | https://github.com/duynk0112-byte/game-monitor-dashboard |

---

## 📋 Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Cloudflare Workers |
| Frontend | Next.js 15 |
| Runtime | 16ms startup |
| RSS Sources | 12 feeds |

---

**Lưu ý:** Push bất kỳ thay đổi để trigger deploy tự động!
