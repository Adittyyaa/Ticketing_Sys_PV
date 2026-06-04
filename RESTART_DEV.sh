#!/bin/bash

echo "🔄 Stopping dev server..."
pkill -f "next dev" || true

echo "🧹 Clearing caches..."
rm -rf .next
rm -rf node_modules/.cache

echo "🚀 Starting fresh dev server..."
npm run dev

echo "✅ Dev server started!"
echo ""
echo "📝 Next steps:"
echo "1. Go to http://localhost:3000"
echo "2. Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows) to hard refresh"
echo "3. Click Menu (☰) button"
echo "4. You should see 'Account Details' option now"
