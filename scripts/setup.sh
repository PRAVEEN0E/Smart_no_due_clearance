#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "Smart No Due Clearance - Setup Script"
echo "========================================"
echo ""
echo "Step 1: Installing server dependencies..."
cd server
npm install
echo ""
echo "Step 2: Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi
echo ""
echo "Step 3: Generating Prisma client..."
npx prisma generate
echo ""
echo "Step 4: Installing client dependencies..."
cd ../client
npm install
echo ""
echo "Done! Run 'npm start' from the root to launch."
