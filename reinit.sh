#!/bin/bash

# Remove installation and build files
rm -rf node_modules
rm -rf .next
rm -rf .vercel

# Remove lockfile
rm -f pnpm-lock.yaml

# Clean pnpm store for this project
pnpm store prune

# Reinstall dependencies
pnpm install

# Build the project
pnpm build