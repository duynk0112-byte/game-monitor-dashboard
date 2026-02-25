#!/bin/bash
# auto-deploy.sh
# Tự động tạo repo GitHub và push code

# ===== CONFIG =====
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Thiết GITHUB_TOKEN:"
  echo "   export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxx"
  exit 1
fi

REPO_NAME="global-game-monitor"

echo "🚀 Starting auto deploy..."

# ===== 1. CREATE REPOSITORY VIA API =====
echo ""
echo "📁 Creating repository on GitHub..."

CREATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$REPO_NAME\",
    \"description\": \"Global gaming news dashboard with Cloudflare Workers backend\",
    \"private\": false
  }" \
  https://api.github.com/user/repos)

# Extract repo owner and clone URL
REPO_OWNER=$(echo "$CREATE_RESPONSE" | grep -oP '"owner":.*"login":\s*"\K([^"]+)"' | sed 's/.*"\([^"]*\)".*/\1/' || echo "")

if [ -z "$REPO_OWNER" ]; then
  echo "❌ Failed to create repository"
  exit 1
fi

echo "✅ Repository created by: $REPO_OWNER"

# ===== 2. CONFIGURE GIT REMOTE =====
echo ""
echo "📡 Setting up git remote..."

cd /root/.openclaw/workspace/game-monitor

# Remove old remotes
git remote remove origin 2>/dev/null || true

# Add SSH remote
CLONE_URL="git@github.com:$REPO_OWNER/$REPO_NAME.git"
git remote add origin "$CLONE_URL"

echo "✅ Remote: $CLONE_URL"

# ===== 3. PUSH CODE =====
echo ""
echo "⬆️  Pushing to GitHub..."

git push -u origin master

# ===== 4. RESULT =====
echo ""
echo "✅ ===== DEPLOY COMPLETE ====="
echo ""
echo "📍 Repository URL:"
echo "   https://github.com/$REPO_OWNER/$REPO_NAME"
echo ""
echo "📊 Git Remote:"
git remote -v
echo ""
echo "🎯 Next: Deploy Cloudflare Worker"
echo "   cd worker && npx wrangler deploy"
