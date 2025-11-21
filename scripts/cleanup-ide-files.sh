# Quick Start Script - Remove .idea from Git

# This script removes the .idea folder from git tracking
# while keeping it in .gitignore

echo "Removing .idea folder from git tracking..."
git rm -r --cached .idea 2>/dev/null || echo ".idea already not tracked"

echo "Verifying .gitignore includes .idea..."
grep -q "^.idea/" .gitignore || echo ".idea/" >> .gitignore

echo "✅ Done! .idea is now properly gitignored"
echo "Remember to commit these changes:"
echo "  git commit -m 'Remove IDE files from tracking'"
