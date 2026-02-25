# 🚀 Auto Deploy - GitHub API

Script này tự động:
1. Tạo repository trên GitHub
2. Cấu hình git remote
3. Push code lên

## 📝 Cách dùng

```bash
cd /root/.openclaw/workspace/game-monitor

# 1. Get GitHub Token
# Vào: https://github.com/settings/tokens
# Scopes: repo (full control)
# Copy token

# 2. Chạy script
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxx
./auto-deploy.sh
```

## ✅ Script sẽ làm gì?

| Bước | Action |
|------|--------|
| 1 | POST `/user/repos` - Tạo repo mới |
| 2 | Trích username từ response |
| 3 | `git remote add origin` với SSH URL |
| 4 | `git push -u origin master` |

## 🎯 Kết quả

```
✅ Repository created by: YOUR_USERNAME
✅ Remote: git@github.com:YOUR_USERNAME/global-game-monitor.git
⬆️ Pushing to GitHub...
```

## 📋 Lợi ích

- ✅ Không cần biết username trước
- ✅ Script tự động phát hiện owner
- ✅ Dùng SSH key đã tạo
- ✅ Repo public ngay lập tức

---

**Chỉ cần:** `export GITHUB_TOKEN=...` và chạy!
