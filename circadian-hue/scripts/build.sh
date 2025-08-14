#!/usr/bin/env bash
set -e
echo "Building client..."
npm run build:client
echo "Building server..."
npm run build:server
