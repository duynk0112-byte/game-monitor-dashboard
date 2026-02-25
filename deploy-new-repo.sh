#!/bin/bash
# deploy-new-repo.sh
# Deploy với tên repo mới để tránh conflict

GITHUB_TOKEN="${GITHUB_TOKEN:-}"
REPO_NAME="${REPO_NAME:-global-game-monitor-simple}"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Thiết GITHUB_TOKEN"
  exit 1
fi

echo "🚀 Deploying to: $REPO_NAME..."

# Create repo
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$REPO_NAME\",
    \"description\": \"Global gaming news dashboard\",
    \"private\": false
  }" \
  https://api.github.com/user/repos

# Get username from response
REPO_OWNER=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user | grep -oP '"login":\s*"\K[^"]*"' || echo "")

if [ -z "$REPO_OWNER" ]; then
  echo "❌ Failed to get username"
  exit 1
fi

cd /root/.openclaw/workspace/game-monitor

git remote remove origin 2>/dev/null || true
git remote add origin git@github.com:$REPO_OWNER/$REPO_NAME.git

echo "⬆️  Pushing..."
git push -u origin master

echo "✅ Done!"
echo "📍 https://github.com/$REPO_OWNER/$REPO_NAME"
