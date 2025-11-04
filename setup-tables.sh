#!/bin/bash

# Script to create missing SaaS tables in PostgreSQL
# Run this if you're getting "Cannot read properties of undefined (reading 'findMany')" errors

echo "Creating missing SaaS tables in PostgreSQL..."

# Check if we have DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL environment variable not set. Using default..."
    DATABASE_URL="postgresql://postgres:password@localhost:5432/anchorview"
fi

# Execute the SQL file
psql "$DATABASE_URL" -f create-missing-tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Tables created successfully!"
    echo "You can now run: npm run dev"
else
    echo "❌ Error creating tables. Check your PostgreSQL connection."
    echo "Make sure PostgreSQL is running and DATABASE_URL is correct."
fi