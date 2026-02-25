#!/bin/bash
# deploy-simple.sh - Deploy đơn giản nhất lên Cloudflare Pages

set -e

echo "🚀 Deploying to Cloudflare Pages..."

cd /root/.openclaw/workspace/game-monitor/frontend

# Step 1: Install & Build
echo "📦 Installing dependencies..."
npm install > /dev/null 2>&1

echo "✅ Installing complete"
echo "✅ Dependencies installed"

echo "📦 Building frontend..."
npm run build > /dev/null 2>&1

echo "✅ Build complete"
echo "✅ Frontend built successfully"

# Step 2: Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."
npx wrangler pages deploy ./frontend/.next --project-name=game-monitor-dashboard 2>&1

echo ""
echo "🎉 Deploy hoàn tất!"
echo "📍 URL: https://game-monitor-dashboard.pages.dev"
echo "📊 Worker: https://global-game-monitor-worker.duy-nk0112.workers.dev"
echo "📋 GitHub: https://github.com/duynk0112-byte/game-monitor-dashboard"

echo ""
echo "✅ Cách deploy:"
echo "   Chỉ cần chạy 1 lệnh:"
echo "   bash deploy-simple.sh"

echo ""
echo "Chúc mừng! 🚀"
