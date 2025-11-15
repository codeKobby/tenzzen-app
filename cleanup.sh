#!/bin/bash

# Exit on error
set -e

# Print commands before executing
set -x

# Remove node_modules directory
echo "Removing node_modules directory..."
rm -rf node_modules

# Remove pnpm-lock.yaml file
echo "Removing pnpm-lock.yaml file..."
rm -f pnpm-lock.yaml

# Clean pnpm cache
echo "Cleaning pnpm cache..."
pnpm store prune

# Install dependencies
echo "Installing dependencies..."
pnpm install --no-frozen-lockfile

# Build the application
echo "Building the application..."
pnpm run build

echo "Cleanup completed successfully!"
