#!/bin/bash
# push-existing-repo.sh
# Push code vào repository đã tồn tại

GITHUB_TOKEN="${GITHUB_TOKEN:-}"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Thiết GITHUB_TOKEN"
  exit 1
fi

echo "🔍 Finding owner of global-game-monitor..."

# Lấy username của owner repo
USERNAME=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/global-game-monitor \
  | grep -oP '"owner":.*"login":\s*"\K[^"]*"' \
  | sed 's/.*"\([^"]*\)".*/\1/')

if [ -z "$USERNAME" ]; then
  echo "❌ Không thể tìm username của global-game-monitor"
  exit 1
fi

echo "✅ Owner username: $USERNAME"

cd /root/.openclaw/workspace/game-monitor

# Cấu hình remote
git remote remove origin 2>/dev/null || true
git remote add origin git@github.com:$USERNAME/global-game-monitor.git

echo "⬆️  Pushing to git@github.com:$USERNAME/global-game-monitor.git..."

git push -u origin master

echo ""
echo "✅ Push hoàn tất!"
echo ""
echo "📍 Repository URL:"
echo "   https://github.com/$USERNAME/global-game-monitor"
