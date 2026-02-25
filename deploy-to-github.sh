#!/bin/bash
# deploy-to-github.sh
# Dùng GitHub API để tạo repo và push code

# ===== CONFIG =====
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
GITHUB_USERNAME="${GITHUB_USERNAME:-}"
REPO_NAME="global-game-monitor"

# Validate
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Thiết GITHUB_TOKEN biến môi trường:"
  echo "   export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxx"
  exit 1
fi

if [ -z "$GITHUB_USERNAME" ]; then
  echo "❌ Thiết GITHUB_USERNAME:"
  echo "   export GITHUB_USERNAME=your-github-username"
  exit 1
fi

echo "🚀 Deploying $REPO_NAME cho $GITHUB_USERNAME..."

# ===== 1. CREATE REPOSITORY =====
echo ""
echo "📁 Creating repository..."
CREATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$REPO_NAME\",
    \"description\": \"Global gaming news dashboard with Cloudflare Workers backend\",
    \"private\": false,
    \"auto_init\": false
  }" \
  https://api.github.com/user/repos)

REPO_EXISTS=$(echo "$CREATE_RESPONSE" | grep -q "already exists" && echo "true" || echo "false")

if [ "$REPO_EXISTS" = "true" ]; then
  echo "⚠️  Repository đã tồn tại"
else
  echo "✅ Repository đã tạo"
fi

# Get clone URL (with token auth)
CLONE_URL="https://x-access-token:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# ===== 2. ADD REMOTE =====
echo ""
echo "📡 Adding remote..."
cd /root/.openclaw/workspace/game-monitor

git remote remove origin 2>/dev/null || true
git remote add origin "$CLONE_URL"

# ===== 3. PUSH CODE =====
echo ""
echo "⬆️  Pushing code to GitHub..."

# Push master branch
git push -u origin master

# ===== 4. SHOW INFO =====
echo ""
echo "✅ Deploy hoàn tất!"
echo ""
echo "📍 Repository URL:"
echo "   https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
echo "📝 Next steps:"
echo "   1. cd worker && npx wrangler deploy"
echo "   2. Deploy frontend lên Vercel/Netlify"
echo ""
echo "🎯 Current branch: master"
echo "   (Có thể đổi sang main: git branch -M main)"
