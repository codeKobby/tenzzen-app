# Project Setup Guide

## Quick Reinstall

If you need to clean reinstall the project while preserving path aliases:

1. Run `reinit.bat` (Windows) or `reinit.sh` (Unix)
2. Wait for the installation and verification process to complete
3. Run `pnpm dev` to start the development server

## What the Reinstall Script Does

The reinstall script:
- Cleans up all installation files and caches
- Removes node_modules and build artifacts
- Verifies Node.js version matches .nvmrc
- Reinstalls all dependencies
- Rebuilds the project
- Tests path alias configuration

## Path Aliases

This project uses the following path aliases for cleaner imports:

```typescript
// Instead of relative imports like:
import { Button } from "../../../components/ui/button"

// You can use:
import { Button } from "@/components/ui/button"
```

Available aliases:
- `@/components/*` - UI components
- `@/lib/*` - Utility functions and libraries
- `@/hooks/*` - React hooks
- `@/types/*` - TypeScript types
- `@/actions/*` - Server actions

## Troubleshooting

If you encounter path alias issues:

1. Verify `tsconfig.json` and `jsconfig.json` are present and correctly configured
2. Run `node test-paths.js` to check path alias configuration
3. Ensure dependencies are correctly installed with `pnpm install`
4. Clear TypeScript cache with `del tsconfig.tsbuildinfo` (Windows) or `rm tsconfig.tsbuildinfo` (Unix)

If problems persist, try:
1. Delete node_modules and the lock file
2. Run `pnpm install` again
3. Restart your development server