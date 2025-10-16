#!/bin/bash

# Kill any existing server
pkill -f "tsx server/index.ts" || true
sleep 1

# Start server in background
echo "Starting server..."
cd /Users/madhukarashok/Documents/my-app
DATABASE_URL="file:$(pwd)/dev.db" AUTH_MODE=stub PORT=3002 npx tsx server/index.ts > /tmp/server-test.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Check if server is running
if ! ps -p $SERVER_PID > /dev/null; then
    echo "Server failed to start. Log:"
    cat /tmp/server-test.log
    exit 1
fi

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:3002/health

# Test dev login endpoint
echo -e "\n\nTesting dev login endpoint..."
curl -s -X POST http://localhost:3002/api/dev/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test1234!"}'

echo -e "\n\nServer log:"
tail -20 /tmp/server-test.log

# Keep server running or kill it
read -p "Keep server running? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    kill $SERVER_PID
fi

