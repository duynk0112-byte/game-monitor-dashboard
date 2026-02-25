# Deploy Cloudflare Worker - Full Guide

由于服务器环境限制，无法直接部署。以下是详细部署步骤。

## 📋 Prerequisites

- Cloudflare account (https://dash.cloudflare.com/sign-up)
- Node.js installed (已安装 ✓)
- Wrangler CLI (已安装 ✓)

---

## 🔧 Step 1: Login to Cloudflare

在你的本地机器上：

```bash
cd /root/.openclaw/workspace/game-monitor/worker

npx wrangler login
```

这将打开浏览器窗口，让你授权Wrangler访问你的Cloudflare账户。

---

## 🗄️ Step 2: Create KV Namespace

```bash
# 创建 KV namespace
npx wrangler kv namespace create RSS_CACHE
```

输出示例：
```
🌀 Creating namespace with title "global-game-monitor-worker-RSS_CACHE"
✨ Success!
Add the following to your configuration file in your kv_namespaces binding:
  { "binding": "RSS_CACHE", "id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

**复制 namespace ID** (xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)

---

## 📝 Step 3: Update Configuration

编辑 `wrangler.jsonc`，添加 KV namespace ID：

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "global-game-monitor-worker",
  "main": "src/index.ts",
  "compatibility_date": "2026-02-25",
  "compatibility_flags": ["nodejs_compat_v2"],
  "vars": {
    "ENVIRONMENT": "production"
  },
  "kv_namespaces": [
    {
      "binding": "RSS_CACHE",
      "id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  // Paste ID here
    }
  ]
}
```

---

## 🚀 Step 4: Deploy Worker

```bash
# Test deploy (dry run)
npx wrangler deploy --dry-run

# Deploy to Cloudflare
npx wrangler deploy
```

输出示例：
```
⛅️ wrangler 4.68.1
───────────────────
Total Upload: 4.36 KiB / gzip: 2.24 KiB
Uploaded global-game-monitor-worker (1.31 sec)
Deployed global-game-monitor-worker
   https://global-game-monitor-worker.your-account.workers.dev
```

---

## ✅ Step 5: Test Worker

```bash
# Test health endpoint
curl https://global-game-monitor-worker.your-account.workers.dev/api/health

# Test specific feed
curl https://global-game-monitor-worker.your-account.workers.dev/api/feeds/kotaku
```

---

## 🎯 Deploy Frontend

### 1. Update Frontend Environment

编辑 `frontend/.env.local`：

```env
NEXT_PUBLIC_WORKER_URL=https://global-game-monitor-worker.your-account.workers.dev
```

### 2. Build and Deploy

```bash
cd /root/.openclaw/workspace/game-monitor/frontend

npm install
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod
```

---

## 📊 Final URLs

部署完成后，你会得到：

| Service | URL |
|----------|-----|
| Worker | `https://global-game-monitor-worker.YOUR_SUBDOMAIN.workers.dev` |
| Frontend | `https://game-monitor.vercel.app` (Vercel) |
| GitHub | `https://github.com/duynk0112-byte/game-monitor-dashboard` |

---

## 🔄 Maintenance Commands

```bash
# View live logs
npx wrangler tail

# Deploy to production
npx wrangler deploy

# Rollback to previous version
npx wrangler rollback

# View recent versions
npx wrangler versions list
```

---

**需要在本地执行这些步骤，因为需要浏览器登录 Cloudflare。**
