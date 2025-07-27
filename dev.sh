#!/bin/bash

# Start the React development server in the background
npm start &
REACT_PID=$!

# Wait for React to start (usually takes a few seconds)
echo "Starting React development server..."
sleep 5

# Start Electron
echo "Starting Electron..."
npm run electron-dev

# Clean up: kill React dev server when Electron exits
kill $REACT_PID
