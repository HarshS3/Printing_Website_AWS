#!/bin/bash
# Run this on the EC2 instance to deploy the app

set -e

echo "Installing dependencies..."
dnf install -y nodejs git

echo "Cloning app..."
# Replace with your actual repo
# git clone https://github.com/yourrepo/printshop.git /app
# Or copy files manually to /app

cd /app/backend

echo "Installing backend packages..."
npm install

echo "Setting up environment..."
cat > .env << EOF
DB_HOST=${DB_HOST}
DB_USER=admin
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=appdb
PORT=3000
EOF

echo "Building frontend..."
cd /app/frontend
npm install
REACT_APP_API_URL=http://${ALB_DNS} npm run build

echo "Serving frontend from backend (copy build)..."
cp -r build ../backend/public

echo "Starting server..."
cd /app/backend
node server.js > server.log 2>&1 &
SERVER_PID=$!

echo "Waiting for server to be healthy..."
for i in {1..60}; do
  if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server is healthy!"
    break
  fi
  echo "Attempt $i/60: waiting for server to respond..."
  sleep 2
done

echo "Done! App running on port 3000 (PID: $SERVER_PID)"
