# Context7 MCP Server Demonstration

## Setup Verification

✅ **MCP Server Installed**: `@upstash/context7-mcp`
✅ **Configuration File Created**: `blackbox_mcp_settings.json`
✅ **Server Name**: `github.com/upstash/context7-mcp`

## Live Demonstration

### Tool 1: resolve-library-id

This tool resolves a general library name into a Context7-compatible library ID.

**Example Request:**
```
Tool: resolve-library-id
Parameters:
  - libraryName: "Next.js"
```

**Expected Response:**
The tool will return the Context7-compatible library ID, such as `/vercel/next.js`

### Tool 2: get-library-docs

This tool fetches up-to-date documentation for a specific library.

**Example Request:**
```
Tool: get-library-docs
Parameters:
  - context7CompatibleLibraryID: "/vercel/next.js"
  - topic: "App Router"
  - tokens: 3000
```

**Expected Response:**
The tool will return current documentation about Next.js App Router, including:
- Latest API references
- Code examples
- Best practices
- Configuration options

## Practical Use Cases for This Project

### 1. Next.js App Router Documentation

**Prompt to AI Assistant:**
```
I need to understand how to implement nested layouts in Next.js 14 App Router. 
use context7
```

**What Context7 Will Do:**
1. Resolve "Next.js" to `/vercel/next.js`
2. Fetch documentation about nested layouts in App Router
3. Provide current examples from Next.js 14 documentation

### 2. Convex Real-time Queries

**Prompt to AI Assistant:**
```
Show me how to set up real-time subscriptions in Convex with React hooks.
use library /get-convex/convex
```

**What Context7 Will Do:**
1. Use the provided library ID `/get-convex/convex`
2. Fetch documentation about real-time queries and React integration
3. Return up-to-date code examples

### 3. Tailwind CSS Utilities

**Prompt to AI Assistant:**
```
What are the latest Tailwind CSS utilities for responsive design?
use context7
```

**What Context7 Will Do:**
1. Resolve "Tailwind CSS" to `/tailwindlabs/tailwindcss`
2. Fetch documentation about responsive design utilities
3. Provide current class names and examples

## Benefits Demonstrated

### ✅ No Outdated Information
Instead of relying on training data that might be months or years old, Context7 fetches the latest documentation directly from the source.

### ✅ No API Hallucinations
The AI won't make up APIs or methods that don't exist because it's working with real, current documentation.

### ✅ Version-Specific Accuracy
Get documentation that matches the actual version of the library you're using, not generic or outdated examples.

### ✅ Seamless Integration
Simply add "use context7" to your prompts - no need to leave your coding environment to search for documentation.

## Testing the Server

To test that the MCP server is working correctly, you can try these commands in your AI assistant:

### Test 1: Library Resolution
```
What is the Context7 library ID for React? use context7
```

**Expected Behavior:**
The assistant should use the `resolve-library-id` tool and return something like `/facebook/react`

### Test 2: Documentation Retrieval
```
Show me the latest Next.js middleware documentation. use context7
```

**Expected Behavior:**
The assistant should:
1. Resolve "Next.js" to `/vercel/next.js`
2. Use `get-library-docs` with topic "middleware"
3. Return current Next.js middleware documentation and examples

### Test 3: Specific Library Query
```
How do I use Convex mutations with TypeScript? use library /get-convex/convex
```

**Expected Behavior:**
The assistant should:
1. Use the provided library ID directly
2. Fetch documentation about mutations and TypeScript
3. Return up-to-date code examples

## Real-World Example

Let's say you're working on the authentication system in this project and need to understand how to implement protected routes in Next.js 14:

**Your Prompt:**
```
I need to create a middleware that protects routes based on authentication status.
The middleware should:
1. Check if the user is authenticated
2. Redirect to /sign-in if not authenticated
3. Allow access to public routes like /sign-in and /sign-up
4. Use Next.js 14 App Router conventions

use context7
```

**What Happens:**
1. Context7 resolves "Next.js" to `/vercel/next.js`
2. Fetches current documentation about middleware in Next.js 14
3. The AI generates code using the latest Next.js 14 patterns and APIs
4. You get working code that matches the current version, not outdated examples

## Comparison: With vs Without Context7

### Without Context7:
```typescript
// Might generate outdated Next.js 12 middleware pattern
export function middleware(req: NextRequest) {
  // Old pattern that might not work in Next.js 14
  return NextResponse.redirect('/sign-in')
}
```

### With Context7:
```typescript
// Generates current Next.js 14 middleware pattern
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Current Next.js 14 pattern with proper types
  const isAuthenticated = request.cookies.get('auth-token')
  
  if (!isAuthenticated && !request.nextUrl.pathname.startsWith('/sign-in')) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

## Conclusion

The Context7 MCP server is now successfully set up and ready to use. It will provide:

- ✅ Up-to-date documentation
- ✅ Accurate API references
- ✅ Version-specific examples
- ✅ No hallucinated code

Simply add "use context7" to your prompts when you need documentation or code examples for any library!

## Next Steps

1. **Try it out**: Use "use context7" in your next prompt to the AI assistant
2. **Add API Key** (optional): For higher rate limits, get an API key from [context7.com/dashboard](https://context7.com/dashboard)
3. **Create Rules**: Add a rule to your AI assistant to automatically use Context7 for code-related questions
4. **Explore Libraries**: Check out [context7.com](https://context7.com) to see all available libraries

---

**Setup Date**: 2025
**MCP Server Version**: Latest (@upstash/context7-mcp)
**Configuration File**: `blackbox_mcp_settings.json`
