#!/bin/bash

# VibeKraft Project Seeder Runner
# Runs the project seeding script for the specified user

set -e

USER_EMAIL="${1:-thando@soimagine.co.za}"

echo "🌱 VibeKraft Project Seeder"
echo "=========================="
echo "Target user: $USER_EMAIL"
echo ""

# Check if the database is accessible
echo "🔍 Checking database connection..."
if ! npx prisma db push --accept-data-loss > /dev/null 2>&1; then
    echo "❌ Database connection failed. Please check your DATABASE_URL."
    exit 1
fi
echo "✅ Database connection successful"

# Run the seeding script
echo ""
echo "🚀 Starting project seeding..."
npx tsx scripts/seed-projects-for-user.ts "$USER_EMAIL"

echo ""
echo "🎉 Project seeding completed!"
echo ""
echo "Next steps:"
echo "1. Check the database for created projects and workspaces"
echo "2. Log in as $USER_EMAIL to see the projects"
echo "3. Create Pyodide workspaces from the projects"
echo "4. Start coding with the seed project templates!"
