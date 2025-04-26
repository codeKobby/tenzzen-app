### Convex with Clerk:

TITLE: Rendering Convex Platform Logo SVG – SVG
DESCRIPTION: This SVG code snippet renders the Convex platform logo for visual identification within Clerk documentation. It requires support for inline SVG rendering in the host environment. The code does not take parameters and outputs a scalable vector image.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/integrations/overview.mdx#2025-04-23_snippet_0

LANGUAGE: SVG
CODE:

```
<svg viewBox="0 0 89 90" fill="none"><path fill="#F3B01C" d="M56.22 70.4c13.1-1.43 25.45-8.29 32.25-19.74-3.22 28.32-34.73 46.22-60.45 35.23-2.37-1.01-4.41-2.69-5.81-4.85-5.78-8.92-7.68-20.27-4.95-30.57 7.8 13.23 23.66 21.34 38.96 19.93Z"/><path fill="#8D2676" d="M16.78 42.16c-5.31 12.06-5.54 26.18.97 37.8C-5.16 63.02-4.91 26.77 17.47 10c2.07-1.55 4.53-2.47 7.11-2.61 10.61-.55 21.39 3.48 28.95 10.99-15.36.15-30.32 9.82-36.75 23.78Z"/><path fill="#EE342F" d="M60.94 22.09C53.19 11.47 41.06 4.24 27.77 4.02 53.46-7.44 85.06 11.14 88.5 38.61c.32 2.55-.1 5.15-1.25 7.45-4.8 9.58-13.7 17.01-24.1 19.76 7.62-13.89 6.68-30.86-2.21-43.73Z"/></svg>
```

---

TITLE: Configuring Convex Authentication with Clerk Issuer Domain
DESCRIPTION: Creates a Convex authentication configuration file that specifies Clerk as the authentication provider. The domain should be replaced with your specific Clerk issuer URL copied from the JWT template.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/integrations/databases/convex.mdx#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:

```
export default {
  providers: [
    {
      domain: 'https://your-issuer-url.clerk.accounts.dev/',
      applicationID: 'convex',
    },
  ],
}
```

---

TITLE: Configuring Clerk and Convex Providers in React
DESCRIPTION: Sets up the React application entry point with both Clerk and Convex providers. This configuration makes authentication globally accessible and integrates Clerk's authentication with Convex's client.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/integrations/databases/convex.mdx#2025-04-23_snippet_3

LANGUAGE: typescript
CODE:

```
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>,
)
```

---

TITLE: Accessing User Identity in Convex Queries
DESCRIPTION: Example of retrieving authenticated user information in a Convex query function. This code uses ctx.auth.getUserIdentity() to get the parsed JWT information, returning null if the client isn't authenticated.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/integrations/databases/convex.mdx#2025-04-23_snippet_4

LANGUAGE: typescript
CODE:

```
import type { UserIdentity } from 'convex/server'
import { query } from './_generated/server'

export default query(async (ctx) => {
  const user = await ctx.auth.getUserIdentity()

  if (user === null) {
    return null
  }

  return user.tokenIdentifier
})
```

---

TITLE: Setting Clerk Environment Variables
DESCRIPTION: Environment variable configuration for Clerk in a Vite-based React application. The publishable key should be retrieved from the Clerk Dashboard.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/integrations/databases/convex.mdx#2025-04-23_snippet_2

LANGUAGE: env
CODE:

```
VITE_CLERK_PUBLISHABLE_KEY={{pub_key}}
```

---

TITLE: Installing Clerk React SDK
DESCRIPTION: Commands to install the Clerk React SDK using npm, yarn, or pnpm package managers.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/integrations/databases/convex.mdx#2025-04-23_snippet_1

LANGUAGE: bash
CODE:

```
npm install @clerk/clerk-react
```

LANGUAGE: bash
CODE:

```
yarn add @clerk/clerk-react
```

LANGUAGE: bash
CODE:

```
pnpm add @clerk/clerk-react
```

---

TITLE: Creating a Responsive User Icon SVG with Theme Support
DESCRIPTION: This SVG creates a user profile icon with a circular head and body silhouette. It uses CSS variables to implement theme-based coloring, with different fill values for light and dark modes. The icon consists of two paths with unique styles that create a visually appealing user representation.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/_partials/icons/backend-sdk.mdx#2025-04-23_snippet_0

LANGUAGE: svg
CODE:

```
<svg viewBox="0 0 32 32">
  <path
    style={{ fill: 'var(--light, #6C47FF) var(--dark, #9785FF)' }}
    d="M16 21a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM25.01 27.838c.425.426.382 1.13-.118 1.465A15.925 15.925 0 0 1 16 32c-3.29 0-6.35-.994-8.893-2.697-.5-.335-.542-1.04-.117-1.465l3.654-3.654c.33-.33.843-.382 1.258-.17A8.96 8.96 0 0 0 16 25a8.961 8.961 0 0 0 4.098-.985c.416-.213.928-.161 1.258.17l3.654 3.653Z"
  />

  <path
    style={{ fill: 'var(--light, #BAB1FF) var(--dark, rgb(151 133 255 / 0.6))' }}
    d="M24.893 2.697c.5.335.542 1.04.117 1.464l-3.654 3.654c-.33.33-.843.383-1.258.17A9 9 0 0 0 7.985 20.098c.213.416.16.928-.17 1.258L4.161 25.01c-.425.425-1.13.383-1.464-.117A15.926 15.926 0 0 1 0 16C0 7.163 7.163 0 16 0c3.29 0 6.35.994 8.893 2.697Z"
  />
</svg>
```

---

TITLE: Resetting User Password with Clerk (JavaScript)
DESCRIPTION: Allows resetting a user's password using Clerk's `resetPassword` method. Accepts parameters including the new `password` and an optional `signOutOfOtherSessions` flag to log out from other sessions upon resetting. Typically used in a password-reset flow, returning a `SignIn` object with the result. Depends on the Clerk SDK and requires that the user can be authenticated or the password reset process is initiated. Inputs: password (string), signOutOfOtherSessions (optional boolean). Output: Promise resolving to a `SignIn` object.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/references/javascript/sign-in.mdx#2025-04-23_snippet_23

LANGUAGE: javascript
CODE:

```
await clerk.signIn.resetPassword({
  password: 'new-password',
})
```

---

TITLE: Displaying Email and Password Sign-In Form with Clerk in React (JSX)
DESCRIPTION: Displays a sign-in form in React for collecting the user's email and password and submitting them for authentication using Clerk. Assumes state variables and handlers such as setEmail, setPassword, and handleSubmit are defined in the parent context. Fields use controlled components to reflect current state. Intended for inclusion within a functional component; prerequisites include proper Clerk setup and corresponding handler implementations. The submitted data is expected to trigger a sign-in flow with Clerk, and any errors are handled per Clerk's documentation.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/custom-flows/email-password.mdx#2025-04-23_snippet_7

LANGUAGE: jsx
CODE:

```
<>
  <h1>Sign in</h1>
  <form onSubmit={(e) => handleSubmit(e)}>
    <div>
      <label htmlFor="email">Enter email address</label>
      <input
        onChange={(e) => setEmail(e.target.value)}
        id="email"
        name="email"
        type="email"
        value={email}
      />
    </div>
    <div>
      <label htmlFor="password">Enter password</label>
      <input
        onChange={(e) => setPassword(e.target.value)}
        id="password"
        name="password"
        type="password"
        value={password}
      />
    </div>
    <button type="submit">Sign in</button>
  </form>
</>
```

---

TITLE: Implementing Reverification for API Fetcher Function with Prebuilt UI in React
DESCRIPTION: This example shows how to use useReverification() to enhance a fetcher function that retrieves sensitive data (account balance) from an API route that requires user reverification. It demonstrates error handling for when users cancel the reverification process.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/hooks/use-reverification.mdx#2025-04-23_snippet_3

LANGUAGE: tsx
CODE:

```
import { useReverification, useUser } from '@clerk/clerk-react'
import { isClerkRuntimeError, isReverificationCancelledError } from '@clerk/clerk-react/errors'
import { useState } from 'react'

export function UpdateUserEmail() {
  const [balance, setBalance] = useState<number | null>(null)
  const accountBalance = useReverification(() => fetch('/api/balance'))

  const handleClick = async () => {
    try {
      const accountBalanceResponse = await accountBalance()

      setBalance(accountBalanceResponse.amount)
    } catch (e) {
      // Handle if user cancels the reverification process
      if (isClerkRuntimeError(e) && isReverificationCancelledError(e)) {
        console.error('User cancelled reverification', e.code)
      }

      // Handle other errors
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(e, null, 2))
    }
  }

  return (
    <div>
      <span>Your account balance is {balance ? `$${balance}` : '$******'}</span>
      <button onClick={() => handleClick()}>See account balance</button>
    </div>
  )
}
```

---

TITLE: Defining getUser Function in TypeScript
DESCRIPTION: Function signature for getUser, which takes a user ID as a string parameter and returns a Promise resolving to a User object.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/references/backend/user/get-user.mdx#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:

```
function getUser(userId: string): Promise<User>
```

---

TITLE: Initializing Clerk and Handling Email/Password Sign-In in JavaScript Web App
DESCRIPTION: Handles the client-side logic for sign-in using Clerk in a JavaScript web application. Loads Clerk, checks user authentication state, displays the user button if signed in, or attaches a submit handler to the sign-in form if not. On submission, it calls Clerk's sign-in method, handles session activation, and reloads or logs errors as needed. Requires Clerk's SDK and environment variable for the publishable key. Inputs include email and password from the form; outputs include user UI updates or error reports.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/custom-flows/email-password.mdx#2025-04-23_snippet_9

LANGUAGE: js
CODE:

```
import { Clerk } from '@clerk/clerk-js'

const pubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const clerk = new Clerk(pubKey)
await clerk.load()

if (clerk.user) {
  // Mount user button component
  document.getElementById('signed-in').innerHTML = `
    <div id="user-button"></div>
  `

  const userbuttonDiv = document.getElementById('user-button')

  clerk.mountUserButton(userbuttonDiv)
} else {
  // Handle the sign-in form
  document.getElementById('sign-in-form').addEventListener('submit', async (e) => {
    e.preventDefault()

    const formData = new FormData(e.target)
    const emailAddress = formData.get('email')
    const password = formData.get('password')

    try {
      // Start the sign-in process
      const signInAttempt = await clerk.client.signIn.create({
        identifier: emailAddress,
        password,
      })

      // If the sign-in is complete, set the user as active
      if (signInAttempt.status === 'complete') {
        await clerk.setActive({ session: signInAttempt.createdSessionId })

        location.reload()
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (error) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(error)
    }
  })
}
```

---

TITLE: Preparing Second Factor Authentication with Clerk (JavaScript)
DESCRIPTION: Begins the second factor (multi-factor authentication) process for a user using Clerk's `prepareSecondFactor` method. Only the 'phone_code' strategy is supported, requiring the user's `phoneNumberId` to send a one-time authentication code via SMS. Returns a `SignIn` object whose `secondFactorVerification` attribute contains the verification status. Dependencies: Clerk SDK must be initialized and user must have a phone number on file. Inputs: strategy ('phone_code'), phoneNumberId. Output: Promise resolving to a `SignIn` object.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/references/javascript/sign-in.mdx#2025-04-23_snippet_22

LANGUAGE: javascript
CODE:

```
const signIn = await clerk.signIn.prepareSecondFactor({
  strategy: 'phone_code',
  phoneNumberId: '123',
})
```

---

TITLE: Defining deletePhoneNumber Function in TypeScript
DESCRIPTION: Function signature for deletePhoneNumber, which takes a phoneNumberId as a string parameter and returns a Promise resolving to a PhoneNumber object.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/references/backend/phone-numbers/delete-phone-number.mdx#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:

```
function deletePhoneNumber(phoneNumberId: string): Promise<PhoneNumber>
```

---

TITLE: JavaScript Clerk Authentication Implementation
DESCRIPTION: Vanilla JavaScript implementation of email/password sign-up flow using Clerk SDK. Handles form submissions and user verification process.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/custom-flows/email-password.mdx#2025-04-23_snippet_2

LANGUAGE: javascript
CODE:

```
import { Clerk } from '@clerk/clerk-js'

const pubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const clerk = new Clerk(pubKey)
await clerk.load()

if (clerk.user) {
  document.getElementById('signed-in').innerHTML = `
    <div id="user-button"></div>
  `

  const userbuttonDiv = document.getElementById('user-button')

  clerk.mountUserButton(userbuttonDiv)
} else {
  document.getElementById('sign-up-form').addEventListener('submit', async (e) => {
    e.preventDefault()

    const formData = new FormData(e.target)
    const emailAddress = formData.get('email')
    const password = formData.get('password')

    try {
      await clerk.client.signUp.create({ emailAddress, password })
      await clerk.client.signUp.prepareEmailAddressVerification()
      document.getElementById('sign-up').setAttribute('hidden', '')
      document.getElementById('verifying').removeAttribute('hidden')
    } catch (error) {
      console.error(error)
    }
  })

  document.getElementById('verifying').addEventListener('submit', async (e) => {
    const formData = new FormData(e.target)
    const code = formData.get('code')

    try {
      const signUpAttempt = await clerk.client.signUp.attemptEmailAddressVerification({
        code,
      })
    } catch (error) {
      console.error(error)
    }
  })
}
```

---

TITLE: Rendering SVG Path Logo
DESCRIPTION: Defines an SVG viewBox with dimensions 300x300 containing a complex geometric path shape with a mint green fill color (#00DC82). The path data describes a custom shape using absolute and relative movement commands.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/_partials/icons/nuxt.mdx#2025-04-23_snippet_0

LANGUAGE: svg
CODE:

```
<svg viewBox="0 0 300 300">
  <path
    fill="#00DC82"
    d="M168 250h111c3.542 0 6.932-1.244 10-3 3.068-1.756 6.23-3.959 8-7 1.77-3.041 3.002-6.49 3-10.001-.002-3.511-1.227-6.959-3-9.998L222 91c-1.77-3.04-3.933-5.245-7-7s-7.458-3-11-3-6.933 1.245-10 3-5.23 3.96-7 7l-19 33-38-64.002c-1.772-3.04-3.932-6.243-7-7.998s-6.458-2-10-2-6.932.245-10 2c-3.068 1.755-6.228 4.958-8 7.998L2 220c-1.773 3.039-1.998 6.487-2 9.998-.002 3.511.23 6.96 2 10.001 1.77 3.04 4.932 5.244 8 7 3.068 1.756 6.458 3 10 3h70c27.737 0 47.925-12.442 62-36l34-59 18-31 55 94h-73l-18 32Zm-79-32H40l73-126 37 63-24.509 42.725C116.144 213.01 105.488 218 89 218Z"
  />
</svg>
```

### Middleware:

TITLE: Configuring Route Protection Middleware with Clerk in Nuxt (TypeScript)
DESCRIPTION: This TypeScript snippet defines a global Nuxt middleware named auth.global.ts to protect specific routes using Clerk's createRouteMatcher and useAuth utilities. The middleware checks if a user is authenticated via useAuth and determines if the current route matches protected patterns. If the user is not signed in and attempts to access a protected route, they are redirected to the sign-in page. Dependencies include Clerk for authentication, Nuxt's defineNuxtRouteMiddleware, and Nuxt navigation functions. The protected route patterns are specified in the createRouteMatcher argument, and the main parameters are the Nuxt route object (to) and the userId from useAuth.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/references/nuxt/protect-pages.mdx#2025-04-23_snippet_0

LANGUAGE: TypeScript
CODE:

```
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)'])\n\nexport default defineNuxtRouteMiddleware((to) => {\n  const { userId } = useAuth()\n\n  // If the user is not signed in, they aren't allowed to access\n  // the protected route and are redirected to the sign-in page\n  if (!userId.value && isProtectedRoute(to)) {\n    return navigateTo('/sign-in')\n  }\n})
```

---

TITLE: Implementing Clerk Middleware in Next.js (TypeScript/TSX)
DESCRIPTION: Creates and configures the Next.js middleware file (`middleware.ts`) using `clerkMiddleware` from `@clerk/nextjs/server`. This middleware is essential for managing authentication state and enabling route protection based on user authentication status. The `config` object specifies which routes the middleware should apply to, typically excluding static files and internal Next.js paths while including API routes.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/quickstarts/nextjs-pages-router.mdx#2025-04-23_snippet_5

LANGUAGE: tsx
CODE:

```
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
```

---

TITLE: Combining Clerk Middleware with `next-intl` Middleware in Next.js (JavaScript)
DESCRIPTION: Illustrates how to combine Clerk's middleware with another middleware, specifically `next-intl` for internationalization, in a Next.js application using JavaScript. The `clerkMiddleware` function returns the `intlMiddleware` after performing its authentication checks, including protecting routes matched by `createRouteMatcher`. This pattern allows multiple middleware functionalities to coexist.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/references/nextjs/clerk-middleware.mdx#2025-04-23_snippet_9

LANGUAGE: js
CODE:

````
```js {{ filename: 'middleware.ts' }}
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware'

import { AppConfig } from './utils/AppConfig'

const intlMiddleware = createMiddleware({
  locales: AppConfig.locales,
  localePrefix: AppConfig.localePrefix,
  defaultLocale: AppConfig.defaultLocale,
})

const isProtectedRoute = createRouteMatcher(['dashboard/(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()

  return intlMiddleware(req)
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
````

```

----------------------------------------

TITLE: Protecting All Routes Except Public Ones in Next.js
DESCRIPTION: Shows how to protect all routes in a Next.js application except specifically defined public routes. This middleware inverts the condition to allow access to sign-in and sign-up routes while protecting everything else.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/references/nextjs/clerk-middleware.mdx#2025-04-23_snippet_7

LANGUAGE: jsx
CODE:
```

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req) => {
if (!isPublicRoute(req)) {
await auth.protect()
}
})

export const config = {
matcher: [
// Skip Next.js internals and all static files, unless found in search params
'/((?!\_next|[^?]_\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest))._)',
// Always run for API routes
'/(api|trpc)(.\*)',
],
}

```

----------------------------------------

TITLE: Configuring clerkMiddleware TypeScript Interface
DESCRIPTION: Type definition showing all available options for the clerkMiddleware() function configuration, including authentication settings, domain configuration, security options, and organization synchronization parameters.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/_partials/clerk-middleware-options.mdx#2025-04-23_snippet_0

LANGUAGE: typescript
CODE:
```

interface ClerkMiddlewareOptions {
audience?: string | string[];
authorizedParties?: string[];
clockSkewInMs?: number;
domain?: string;
isSatellite?: boolean;
jwtKey: string;
organizationSyncOptions?: OrganizationSyncOptions;
proxyUrl?: string;
signInUrl: string;
signUpUrl: string;
publishableKey: string;
secretKey?: string;
}

```

----------------------------------------

TITLE: Using Dynamic Keys for Multi-Tenant Clerk Middleware in Next.js (TypeScript)
DESCRIPTION: Demonstrates configuring `clerkMiddleware` for a multi-tenant application by dynamically providing `publishableKey` and `secretKey` based on the incoming request. The example shows resolving the tenant from the request and returning the corresponding keys, likely fetched from an external store or environment variables. This requires setting the `CLERK_ENCRYPTION_KEY` environment variable.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/references/nextjs/clerk-middleware.mdx#2025-04-23_snippet_12

LANGUAGE: ts
CODE:
```

```ts {{ filename: 'middleware.ts' }}
import { clerkMiddleware } from "@clerk/nextjs/server";

// You would typically fetch these keys from a external store or environment variables.
const tenantKeys = {
  tenant1: { publishableKey: "pk_tenant1...", secretKey: "sk_tenant1..." },
  tenant2: { publishableKey: "pk_tenant2...", secretKey: "sk_tenant2..." },
};

export default clerkMiddleware(
  (auth, req) => {
    // Add your middleware checks
  },
  (req) => {
    // Resolve tenant based on the request
    const tenant = getTenant(req);
    return tenantKeys[tenant];
  }
);
```

```

----------------------------------------

TITLE: Configuring Middleware to Make Sign-Up Route Public in Next.js
DESCRIPTION: This middleware configuration makes specific routes public while protecting all others. It adds the sign-up route to the list of public routes using createRouteMatcher, ensuring users can access the sign-up page without authentication.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/references/nextjs/custom-sign-up-page.mdx#2025-04-23_snippet_1

LANGUAGE: tsx
CODE:
```

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// prettier-ignore
const isPublicRoute = createRouteMatcher([
'/sign-in(.*)',
'/sign-up(.*)'
])

export default clerkMiddleware(async (auth, req) => {
if (!isPublicRoute(req)) {
await auth.protect()
}
})

export const config = {
matcher: [
// Skip Next.js internals and all static files, unless found in search params
'/((?!\_next|[^?]_\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest))._)',
// Always run for API routes
'/(api|trpc)(.\*)',
],
}

```

----------------------------------------

TITLE: Implementing MFA Enforcement Middleware in Nuxt
DESCRIPTION: A Nuxt custom middleware implementation that enforces MFA by checking if users have enabled it and throwing errors when they haven't. It handles different routes and validates the custom 'isMfa' claim.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/authentication/configuration/force-mfa.mdx#2025-04-23_snippet_4

LANGUAGE: tsx
CODE:
```

import { clerkMiddleware } from '@clerk/nuxt/server'

export default clerkMiddleware(async (event) => {
const isMFARoute = event.path.startsWith('/account/manage-mfa/add')
const isSignInRoute = event.path.startsWith('/sign-in')

const { userId, sessionClaims } = event.context.auth()

// Redirect to homepage if the user is signed in and on the sign-in page
if (userId !== null && isSignInRoute) {
throw createError({
statusMessage: 'You are already signed in.',
})
}

// Redirect to MFA setup page if MFA is not enabled
if (userId !== null && !isMFARoute) {
if (sessionClaims.isMfa === undefined) {
throw createError({
statusMessage: 'You need to add the `isMfa` claim to your session token.',
})
}
if (sessionClaims.isMfa === false) {
throw createError({
statusMessage: 'You need to enable MFA for your account.',
})
}
}
})

export const config = {
matcher: [
// Skip Next.js internals and all static files, unless found in search params
'/((?!\_next|[^?]_\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest))._)',
// Always run for API routes
'/(api|trpc)(.\*)',
],
}

```

----------------------------------------

TITLE: Implementing MFA Enforcement Middleware in Astro
DESCRIPTION: An Astro middleware implementation that enforces MFA by redirecting users to the MFA setup page when they don't have it enabled. It uses route matching patterns and checks the session claims for MFA status.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/authentication/configuration/force-mfa.mdx#2025-04-23_snippet_2

LANGUAGE: tsx
CODE:
```

import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server'

const isMFARoute = createRouteMatcher(['/account/manage-mfa/add(.*)'])
const isSignInRoute = createRouteMatcher(['/sign-in(.*)'])

export const onRequest = clerkMiddleware((auth, context) => {
const { userId, sessionClaims } = auth()

// Redirect to homepage if the user is signed in and on the sign-in page
if (userId !== null && isSignInRoute(context.request)) {
return Response.redirect(new URL('/', context.request.url))
}

// Redirect to MFA setup page if MFA is not enabled
if (userId !== null && !isMFARoute(context.request)) {
if (sessionClaims.isMfa === undefined) {
console.error('You need to add the `isMfa` claim to your session token.')
}
if (sessionClaims.isMfa === false) {
return Response.redirect(new URL('/account/manage-mfa/add', context.request.url))
}
}
})

export const config = {
matcher: [
// Skip Next.js internals and all static files, unless found in search params
'/((?!\_next|[^?]_\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest))._)',
// Always run for API routes
'/(api|trpc)(.\*)',
],
}

```

----------------------------------------

TITLE: Protecting Routes with auth.protect()
DESCRIPTION: Example of protecting routes using auth.protect() method. This middleware implementation automatically redirects unauthenticated users to the sign-in route when they try to access protected routes.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/references/nextjs/clerk-middleware.mdx#2025-04-23_snippet_2

LANGUAGE: tsx
CODE:
```

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)'])

export default clerkMiddleware(async (auth, req) => {
if (isProtectedRoute(req)) await auth.protect()
})

export const config = {
matcher: [
// Skip Next.js internals and all static files, unless found in search params
'/((?!\_next|[^?]_\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest))._)',
// Always run for API routes
'/(api|trpc)(.\*)',
],
}

```

----------------------------------------

TITLE: Authentication-based Route Protection
DESCRIPTION: Implementation of route protection based on user authentication status using clerkMiddleware and createRouteMatcher.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/references/astro/clerk-middleware.mdx#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```

import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)'])

export const onRequest = clerkMiddleware((auth, context) => {
const { redirectToSignIn, userId } = auth()

if (!userId && isProtectedRoute(context.request)) {
// Add custom logic to run before redirecting

    return redirectToSignIn()

}
})

```

----------------------------------------

TITLE: Enabling Debug Mode for Clerk Middleware in Next.js (TypeScript)
DESCRIPTION: Demonstrates how to enable debugging for Clerk middleware in a Next.js application using TypeScript. By passing `{ debug: true }` as an option to `clerkMiddleware()`, detailed logs are printed to the terminal, aiding in troubleshooting authentication issues. The example also shows the basic structure of a `middleware.ts` file with Clerk integration and a matcher configuration.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/references/nextjs/clerk-middleware.mdx#2025-04-23_snippet_8

LANGUAGE: tsx
CODE:
```

```tsx {{ filename: 'middleware.ts', mark: [[4, 7]] }}
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware(
  (auth, req) => {
    // Add your middleware checks
  },
  { debug: true }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
```

```

----------------------------------------

TITLE: Implementing Middleware for Route-Level RBAC Protection
DESCRIPTION: Middleware that intercepts requests to admin routes and checks if the user has the required role. If not, it redirects them to the home page. This provides protection at the route level.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/references/nextjs/basic-rbac.mdx#2025-04-23_snippet_5

LANGUAGE: typescript
CODE:
```

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
// Protect all routes starting with `/admin`
if (isAdminRoute(req) && (await auth()).sessionClaims?.metadata?.role !== 'admin') {
const url = new URL('/', req.url)
return NextResponse.redirect(url)
}
})

export const config = {
matcher: [
// Skip Next.js internals and all static files, unless found in search params
'/((?!\_next|[^?]_\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest))._)',
// Always run for API routes
'/(api|trpc)(.\*)',
],
}

```

----------------------------------------

TITLE: Configuring Middleware for Public Sign-In Routes in Next.js
DESCRIPTION: This middleware setup creates a public route matcher for sign-in paths while protecting all other routes. It includes configuration for paths that should bypass Next.js internals and static files.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/references/nextjs/custom-sign-in-or-up-page.mdx#2025-04-23_snippet_1

LANGUAGE: tsx
CODE:
```

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)']

export default clerkMiddleware(async (auth, req) => {
if (!isPublicRoute(req)) {
await auth.protect()
}
})

export const config = {
matcher: [
// Skip Next.js internals and all static files, unless found in search params
'/((?!\_next|[^?]_\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest))._)',
// Always run for API routes
'/(api|trpc)(.\*)',
],
}

```

----------------------------------------

TITLE: Implementing Clerk Proxy in Next.js Middleware
DESCRIPTION: Next.js middleware configuration for proxying requests to Clerk's Frontend API. It includes the middleware function and export configuration for matching routes.
SOURCE: https://github.com/clerk/clerk-docs/blob/main/docs/advanced-usage/using-proxies.mdx#2025-04-23_snippet_2

LANGUAGE: typescript
CODE:
```

import { NextResponse } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware((auth, req) => {
if (req.nextUrl.pathname.match('\_\_clerk')) {
const proxyHeaders = new Headers(req.headers)
proxyHeaders.set('Clerk-Proxy-Url', process.env.NEXT_PUBLIC_CLERK_PROXY_URL || '')
proxyHeaders.set('Clerk-Secret-Key', process.env.CLERK_SECRET_KEY || '')
if (req.ip) {
proxyHeaders.set('X-Forwarded-For', req.ip)
} else {
proxyHeaders.set('X-Forwarded-For', req.headers.get('X-Forwarded-For') || '')
}

    const proxyUrl = new URL(req.url)
    proxyUrl.host = 'frontend-api.clerk.dev'
    proxyUrl.port = '443'
    proxyUrl.protocol = 'https'
    proxyUrl.pathname = proxyUrl.pathname.replace('/__clerk', '')

    return NextResponse.rewrite(proxyUrl, {
      request: {
        headers: proxyHeaders,
      },
    })

}
})

export const config = {
matcher: [
// Skip Next.js internals and all static files, unless found in search params
'/((?!\_next|[^?]_\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest))._)',
// Always run for API routes AND anything passed through the proxy
'/(api|trpc|\_\_clerk)(.\*)',
],
}

```

```
