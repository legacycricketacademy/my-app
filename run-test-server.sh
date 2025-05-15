#!/bin/bash

# This script runs the standalone test registration server
# It uses the same DATABASE_URL from the main application

echo "Starting standalone registration server..."
echo "---------------------------------------------"
echo "This server will run on port 3000"
echo "Press Ctrl+C to stop the server"
echo ""

# Export the DATABASE_URL from the environment or .env file
if [ -f .env ]; then
  export $(grep DATABASE_URL .env | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  echo "Make sure either:"
  echo "1. The .env file contains DATABASE_URL=postgresql://..."
  echo "2. You export DATABASE_URL in your shell before running this script"
  exit 1
fi

# Run the server
node test-server.js