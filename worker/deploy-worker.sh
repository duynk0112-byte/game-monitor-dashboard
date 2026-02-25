#!/bin/bash
# deploy-worker.sh
# Deploy Cloudflare Worker với manual auth hoặc API token

echo "🚀 Deploying Global Game Monitor Worker..."

cd /root/.openclaw/workspace/game-monitor/worker

# Option 1: CLOUDFLARE_API_TOKEN
if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
  echo "📝 Using CLOUDFLARE_API_TOKEN..."
  export CLOUDFLARE_API_TOKEN
  npx wrangler deploy
  exit $?
fi

# Option 2: Manual login
echo ""
echo "⚠️  No API token found. Please run:"
echo "   npx wrangler login"
echo ""
echo "This will open a browser to authorize Cloudflare."
echo ""
echo "After login, run:"
echo "   npx wrangler deploy"
