# Context7 MCP Server Setup

## Overview

Context7 MCP has been successfully installed and configured in this project. It provides up-to-date documentation and code examples for libraries directly in your AI coding assistant.

## Configuration

The MCP server is configured in `blackbox_mcp_settings.json`:

```json
{
  "mcpServers": {
    "github.com/upstash/context7-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp"
      ],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Available Tools

Context7 MCP provides two main tools:

### 1. resolve-library-id
Resolves a general library name into a Context7-compatible library ID.

**Parameters:**
- `libraryName` (required): The name of the library to search for

**Example Usage:**
```
resolve-library-id with libraryName: "next.js"
```

### 2. get-library-docs
Fetches documentation for a library using a Context7-compatible library ID.

**Parameters:**
- `context7CompatibleLibraryID` (required): Exact Context7-compatible library ID (e.g., `/mongodb/docs`, `/vercel/next.js`)
- `topic` (optional): Focus the docs on a specific topic (e.g., "routing", "hooks")
- `tokens` (optional, default 5000): Max number of tokens to return

**Example Usage:**
```
get-library-docs with context7CompatibleLibraryID: "/vercel/next.js", topic: "routing"
```

## How to Use

### In Your Prompts

Simply add "use context7" to your prompts:

```
Create a Next.js middleware that checks for a valid JWT in cookies
and redirects unauthenticated users to `/login`. use context7
```

### With Library IDs

If you know the exact library ID, specify it directly:

```
Implement basic authentication with Supabase. use library /supabase/supabase for API and docs.
```

## Demonstration Examples

### Example 1: Getting Next.js Documentation

**Prompt:**
```
Show me how to implement dynamic routes in Next.js 14. use context7
```

The Context7 MCP will:
1. Resolve "Next.js" to `/vercel/next.js`
2. Fetch up-to-date documentation about dynamic routes
3. Provide current code examples from the official docs

### Example 2: Getting React Documentation

**Prompt:**
```
Explain React hooks with examples. use library /facebook/react
```

The Context7 MCP will:
1. Use the provided library ID `/facebook/react`
2. Fetch documentation about React hooks
3. Return current examples and best practices

### Example 3: Getting Convex Documentation

**Prompt:**
```
How do I set up real-time queries in Convex? use context7
```

The Context7 MCP will:
1. Resolve "Convex" to the appropriate library ID
2. Fetch documentation about real-time queries
3. Provide up-to-date code examples

## Benefits

✅ **Up-to-date Information**: Get current documentation, not outdated training data
✅ **No Hallucinations**: Real API references from official sources
✅ **Version-Specific**: Documentation matches the actual library version
✅ **Time-Saving**: No need to switch tabs or search manually

## Optional: API Key Setup

For higher rate limits and access to private repositories, you can add an API key:

1. Create an account at [context7.com/dashboard](https://context7.com/dashboard)
2. Get your API key
3. Update the configuration:

```json
{
  "mcpServers": {
    "github.com/upstash/context7-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp",
        "--api-key",
        "YOUR_API_KEY"
      ],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Troubleshooting

### Module Not Found Errors
If you encounter `ERR_MODULE_NOT_FOUND`, try using `bunx` instead of `npx`:

```json
{
  "command": "bunx",
  "args": ["-y", "@upstash/context7-mcp"]
}
```

### ESM Resolution Issues
For errors like `Error: Cannot find module`, try adding the `--experimental-vm-modules` flag:

```json
{
  "args": ["-y", "--node-options=--experimental-vm-modules", "@upstash/context7-mcp"]
}
```

## Resources

- [Context7 Website](https://context7.com)
- [GitHub Repository](https://github.com/upstash/context7-mcp)
- [NPM Package](https://www.npmjs.com/package/@upstash/context7-mcp)
- [Documentation](https://context7.com/docs)

## Testing the Setup

To verify the MCP server is working correctly, try these test prompts in your AI assistant:

1. **Test Library Resolution:**
   ```
   What is the Context7 library ID for React? use context7
   ```

2. **Test Documentation Retrieval:**
   ```
   Show me the latest Next.js App Router documentation. use context7
   ```

3. **Test Specific Topics:**
   ```
   How do I use Convex mutations? use library /get-convex/convex
   ```

## Integration with This Project

This project uses several libraries that Context7 can provide documentation for:

- **Next.js** (`/vercel/next.js`): For app routing, middleware, and server components
- **React** (`/facebook/react`): For hooks, components, and state management
- **Convex** (`/get-convex/convex`): For real-time database operations
- **Tailwind CSS** (`/tailwindlabs/tailwindcss`): For styling
- **Clerk** (if available): For authentication

When working on features, simply add "use context7" to your prompts to get the most current documentation and examples.
