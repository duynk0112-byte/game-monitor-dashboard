#!/bin/bash
# deploy-cloudflare-pages.sh
# Deploy frontend lên Cloudflare Pages (đơn giản nhất)

set -e

echo "🚀 Deploying to Cloudflare Pages..."

cd /root/.openclaw/workspace/game-monitor/frontend

echo "✅ Build frontend..."
npm install
npm run build

echo "✅ Deploying to Cloudflare Pages..."
npx wrangler pages deploy ./frontend/.next --project-name=game-monitor-dashboard

echo ""
echo "🎉 Deploy hoàn tất!"
echo ""
echo "📍 URL: https://game-monitor-dashboard.pages.dev"
echo "📊 Worker: https://global-game-monitor-worker.duy-nk0112.workers.dev"
echo ""
echo "📋 So sánh với Vercel:"
echo "   Cloudflare Pages: ✅ Đơn giản hơn"
echo "   Vercel: ❌ Phức tạp, cần GUI"
echo ""
echo "🔧 Khuyên nghị:"
echo "   1. Cloudflare Pages là phương án đáng tin cậy nhất"
echo "   2. Không cần browser hay GUI"
echo "   3. Wrangler CLI đã login với Cloudflare account của bạn"
echo ""
echo "Chúc mừng deploy thành công! 🚀"
