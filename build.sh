#!/bin/bash

# Exit on error
set -e

# Print commands before executing
set -x

# Install dependencies
echo "Installing dependencies..."
pnpm install --no-frozen-lockfile

# Build the Next.js application
echo "Building Next.js application..."
pnpm run build

echo "Build completed successfully!"
