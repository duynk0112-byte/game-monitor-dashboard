# Deploy Frontend to Cloudflare Pages

## 📝 Phương án thay thế

Thay vì GitHub Actions không hoạt động, ta dùng Cloudflare Pages.

## 🚀 Cách deploy

### 步骤 1: Build Frontend

```bash
cd /root/.openclaw/workspace/game-monitor/frontend
npm install
npm run build
```

### 步骤 2: Deploy lên Cloudflare Pages

```bash
npx wrangler pages deploy ./frontend/.next --project-name=game-monitor-dashboard
```

Hoặc deploy root:

```bash
npx wrangler pages deploy . --project-name=game-monitor-dashboard
```

### 步骤 3: Cập nhật frontend configuration

Sau khi deploy thành công, bạn cần cập nhật `.env.local`:

```env
NEXT_PUBLIC_WORKER_URL=https://game-monitor-dashboard.pages.dev
```

---

## ✅ Ưu điểm Cloudflare Pages

- ✅ Không cần GUI - Chạy hoàn toàn từ CLI
- ✅ Tự động backup với Cloudflare
- ✅ Tốc độ cao với CDN toàn cầu
- ✅ Free tier - Không giới hạn băng thông
- ✅ Build đơn giản - Không cần config phức tạp

## 📍 URL sau khi deploy

```
Frontend:  https://game-monitor-dashboard.pages.dev
Backend:   https://global-game-monitor-worker.duy-nk0112.workers.dev
GitHub:      https://github.com/duynk0112-byte/game-monitor-dashboard
```

---

**Chúc mừng deploy thành công!** 🎊

Hướng dẫn chi tiết: Xem [DEPLOY_STATUS.md](./worker/DEPLOY_STATUS.md)
