# 🚀 Vercel 部署指南

由于服务器环境限制，无法直接在服务器上运行 Vercel 部署。需要你在本地环境中执行以下步骤：

## 方法 1: 使用 Vercel CLI（推荐）

### 步骤 1: 安装 Vercel CLI
```bash
npm install -g vercel
```

### 步骤 2: 登录 Vercel
```bash
vercel login
```
这将打开浏览器，让你授权 Vercel 账户。

### 步骤 3: 部署
```bash
cd /path/to/game-monitor/frontend
npm run build
npx vercel --prod --yes
```

## 方法 2: 使用 GitHub 集成

1. 将项目代码推送到 GitHub（已完成）
2. 在 GitHub 上添加 Vercel 为仓库
3. 进入项目 Settings → Integrations → Add → Vercel
4. 按照 Vercel 的指示完成部署

## 方法 3: 手动部署到其他平台

- **Netlify**: `npm run build && netlify deploy --prod`
- **Cloudflare Pages**: `npm run build && npx wrangler pages deploy`

## 当前状态

✅ **Worker 已部署**: https://global-game-monitor-worker.duy-nk0112.workers.dev

✅ **Frontend 已构建**: `.next` 文件夹已生成

⏸️ **前端部署**: 需要本地环境操作

## 前端 URL

部署后访问：
```
https://game-monitor.vercel.app  # 或类似
```

## Worker 环境变量

前端已配置：
```env
NEXT_PUBLIC_WORKER_URL=https://global-game-monitor-worker.duy-nk0112.workers.dev
```

---

**建议**: 使用方法 1（Vercel CLI），这是最简单的方式。
