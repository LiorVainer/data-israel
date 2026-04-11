#!/bin/bash
echo "=== Git State ==="
echo "Branch: $(git branch --show-current 2>/dev/null)"
echo ""
echo "Last 5 commits:"
git log --oneline -5 2>/dev/null
echo ""
echo "Modified files:"
git diff --name-only HEAD 2>/dev/null
echo ""
echo "Staged files:"
git diff --cached --name-only 2>/dev/null
