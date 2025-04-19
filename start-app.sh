#!/bin/bash

# Store the root directory
ROOT_DIR=$(pwd)

# Check if server is already running
if lsof -i:3001 > /dev/null; then
    echo "Server is already running on port 3001"
    SERVER_RUNNING=true
else
    # Start the server in the background
    echo "Starting the server..."
    cd "$ROOT_DIR/server" && npm start &
    SERVER_PID=$!
    SERVER_RUNNING=false

    # Wait a moment for the server to start
    sleep 2
fi

# Return to the root directory and start the client
echo "Starting the client..."
cd "$ROOT_DIR" && npm run dev

# When the client is stopped, also stop the server if we started it
if [ "$SERVER_RUNNING" = false ] && [ -n "$SERVER_PID" ]; then
    echo "Stopping the server..."
    kill $SERVER_PID
fi
