# Better Auth Setup Guide

A comprehensive guide for setting up Better Auth in Next.js applications. This document covers installation, configuration, data structures, and optimization tips.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Data Structures](#data-structures)
4. [Server Configuration](#server-configuration)
5. [Client Configuration](#client-configuration)
6. [API Route Handler](#api-route-handler)
7. [Route Protection](#route-protection)
8. [OAuth Providers](#oauth-providers)
9. [Usage Examples](#usage-examples)
10. [Optimization Tips](#optimization-tips)
11. [Troubleshooting](#troubleshooting)

---

## Overview

Better Auth is a modern, type-safe authentication library for JavaScript/TypeScript applications. It provides:

- Email/Password authentication
- OAuth providers (Google, GitHub, etc.)
- Session management
- Database adapters (Prisma, Drizzle, etc.)
- Built-in security features

**Official Documentation**: https://www.better-auth.com/docs

---

## Installation

### 1. Install Better Auth Package

```bash
# Using pnpm (recommended)
pnpm add better-auth

# Using npm
npm install better-auth

# Using yarn
yarn add better-auth
```

### 2. Install Database Adapter (Prisma Example)

```bash
pnpm add -D prisma
pnpm add @prisma/client
```

### 3. Environment Variables

Create a `.env` file with these required variables:

```env
# Better Auth Configuration
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32

# Database (Neon PostgreSQL example)
DATABASE_URL="postgresql://user:password@host-pooler.region.aws.neon.tech/db?sslmode=require"
DIRECT_URL="postgresql://user:password@host.region.aws.neon.tech/db?sslmode=require"

# Public URL for client-side
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Important Notes:**
- `BETTER_AUTH_SECRET` must be at least 32 characters for security
- For Neon DB: `DATABASE_URL` uses pooled connection (-pooler), `DIRECT_URL` uses direct connection
- Generate a secure secret: `openssl rand -base64 32`

---

## Data Structures

Better Auth requires specific database tables. Here's the complete Prisma schema:

### Core Tables (Required)

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma/client"  # Recommended for isolation
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  # For migrations
}

// ============================================
// BETTER AUTH REQUIRED TABLES
// ============================================

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Required relations for Better Auth
  accounts      Account[]
  sessions      Session[]

  // Your custom relations go here
  // profile       UserProfile?
}

model Account {
  id                    String    @id @default(cuid())
  accountId             String    // External provider's account ID
  providerId            String    // "credential", "google", "github", etc.
  userId                String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?   // For email/password auth (hashed)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([providerId, accountId])
}

model Session {
  id           String   @id @default(cuid())
  token        String   @unique  // Required: session token
  sessionToken String?  @unique  // Optional: for compatibility
  userId       String
  expiresAt    DateTime
  ipAddress    String?           // Optional: security tracking
  userAgent    String?           // Optional: security tracking
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id         String   @id @default(cuid())
  identifier String   // Email or other identifier
  value      String   // Verification token/code
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([identifier, value])
}
```

### Field Explanations

#### User Table
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | Unique identifier (cuid recommended) |
| `name` | String | No | User's display name |
| `email` | String | Yes | Unique email address |
| `emailVerified` | Boolean | Yes | Email verification status |
| `image` | String | No | Profile picture URL |
| `createdAt` | DateTime | Yes | Account creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |

#### Account Table
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | Unique identifier |
| `accountId` | String | Yes | Provider's user ID |
| `providerId` | String | Yes | Auth provider name ("credential", "google") |
| `userId` | String | Yes | Foreign key to User |
| `accessToken` | String | No | OAuth access token |
| `refreshToken` | String | No | OAuth refresh token |
| `password` | String | No | Hashed password (email/password auth) |

#### Session Table
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | Unique identifier |
| `token` | String | Yes | Session token (stored in cookie) |
| `userId` | String | Yes | Foreign key to User |
| `expiresAt` | DateTime | Yes | Session expiration time |
| `ipAddress` | String | No | Client IP for security tracking |
| `userAgent` | String | No | Browser info for security |

#### Verification Table
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | Unique identifier |
| `identifier` | String | Yes | Email or phone to verify |
| `value` | String | Yes | Verification token |
| `expiresAt` | DateTime | Yes | Token expiration time |

---

## Server Configuration

Create `lib/auth.ts` for server-side authentication:

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/generated/prisma/client";

// Use DIRECT_URL for server-side operations (avoids connection pooling issues)
const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL,
});

export const auth = betterAuth({
  // Database configuration
  database: prismaAdapter(prisma, {
    provider: "postgresql",  // or "mysql", "sqlite"
  }),

  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    // Optional: customize password requirements
    // minPasswordLength: 8,
  },

  // Optional: OAuth providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    // Add more providers as needed
    // github: { ... },
    // discord: { ... },
  },

  // Optional: Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 days in seconds
    updateAge: 60 * 60 * 24,      // Update session every 24 hours
  },

  // Optional: Advanced options
  // trustedOrigins: ["https://yourdomain.com"],
  // rateLimit: { ... },
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `database` | Adapter | Required | Database adapter (Prisma, Drizzle) |
| `emailAndPassword.enabled` | boolean | false | Enable email/password auth |
| `socialProviders` | object | {} | OAuth provider configurations |
| `session.expiresIn` | number | 604800 | Session lifetime in seconds |
| `session.updateAge` | number | 86400 | Session refresh interval |
| `trustedOrigins` | string[] | [] | Allowed CORS origins |

---

## Client Configuration

Create `lib/auth-client.ts` for client-side authentication:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Export commonly used functions
export const { signIn, signUp, signOut, useSession } = authClient;

// Helper for OAuth sign-in
export const signInWithGoogle = async () => {
  return authClient.signIn.social({
    provider: "google",
    callbackURL: "/dashboard",  // Redirect after success
  });
};

// Helper for email/password sign-in
export const signInWithEmail = async (email: string, password: string) => {
  return authClient.signIn.email({
    email,
    password,
  });
};

// Helper for email/password sign-up
export const signUpWithEmail = async (
  email: string,
  password: string,
  name?: string
) => {
  return authClient.signUp.email({
    email,
    password,
    name,
  });
};
```

---

## API Route Handler

Create `app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

This single file creates all authentication endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-in/email` | POST | Email/password sign in |
| `/api/auth/sign-up/email` | POST | Email/password sign up |
| `/api/auth/sign-out` | POST | Sign out current session |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/callback/:provider` | GET | OAuth callback handler |

---

## Route Protection

### Next.js 15+ (proxy.ts)

Create `proxy.ts` in project root:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Get session token from cookies
  const sessionToken = request.cookies.get("better-auth.session_token");
  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = ["/dashboard", "/settings", "/profile"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  const authPages = ["/login", "/signup"];
  if (authPages.includes(pathname) && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
```

### Next.js 14 and earlier (middleware.ts)

For older Next.js versions, name the file `middleware.ts` instead of `proxy.ts` and rename the function to `middleware`.

---

## OAuth Providers

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth Client ID
5. Configure OAuth consent screen
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

```typescript
// In lib/auth.ts
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  },
},
```

### GitHub OAuth Setup

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set callback URL: `http://localhost:3000/api/auth/callback/github`

```typescript
socialProviders: {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID as string,
    clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
  },
},
```

---

## Usage Examples

### Using Session in Server Components

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

### Using Session in Client Components

```typescript
"use client";

import { useSession, signOut } from "@/lib/auth-client";

export function UserMenu() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;

  if (!session) {
    return <a href="/login">Sign In</a>;
  }

  return (
    <div>
      <span>{session.user.name}</span>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Login Form Example

```typescript
"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Sign in failed");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
```

---

## Optimization Tips

### 1. Use DIRECT_URL for Server Operations

```typescript
// lib/auth.ts
const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL,  // Bypasses connection pooler
});
```

Connection poolers can cause issues with session management. Use direct connections for auth operations.

### 2. Implement Proper Error Handling

```typescript
try {
  const result = await signIn.email({ email, password });

  if (result.error) {
    // Handle specific error codes
    switch (result.error.code) {
      case "INVALID_CREDENTIALS":
        setError("Invalid email or password");
        break;
      case "EMAIL_NOT_VERIFIED":
        setError("Please verify your email first");
        break;
      default:
        setError(result.error.message);
    }
  }
} catch (err) {
  setError("Network error. Please try again.");
}
```

### 3. Add Loading States

Always show loading indicators during auth operations to improve UX:

```typescript
const [loading, setLoading] = useState(false);

const handleSignIn = async () => {
  setLoading(true);
  try {
    await signIn.email({ email, password });
  } finally {
    setLoading(false);
  }
};
```

### 4. Use Session Caching

Better Auth caches sessions automatically. Avoid unnecessary session checks:

```typescript
// GOOD: Check session once per page
const { data: session } = useSession();

// BAD: Don't fetch session in every component
// Each component calling useSession() shares the same cached data
```

### 5. Optimize Database Indexes

Add indexes for frequently queried fields:

```prisma
model Session {
  // ... fields
  @@index([userId])        // For user lookups
  @@index([expiresAt])     // For cleanup jobs
}

model Account {
  // ... fields
  @@index([userId])        // For user account lookups
}
```

### 6. Configure Session Lifetime Appropriately

```typescript
export const auth = betterAuth({
  session: {
    expiresIn: 60 * 60 * 24 * 7,     // 7 days for web apps
    // expiresIn: 60 * 60 * 24 * 30, // 30 days for mobile apps
    updateAge: 60 * 60 * 24,         // Refresh daily
  },
});
```

### 7. Implement Refresh After Auth State Changes

```typescript
import { useRouter } from "next/navigation";

const router = useRouter();

// After successful sign in/out
router.refresh();  // Refreshes server components with new auth state
```

### 8. Use Type-Safe Session Access

```typescript
// Define session type for type safety
interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

const { data: session } = useSession();
const user = session?.user as SessionUser | undefined;
```

### 9. Handle Session Expiration Gracefully

```typescript
const { data: session, isPending, error } = useSession();

if (error?.code === "SESSION_EXPIRED") {
  // Redirect to login with message
  router.push("/login?expired=true");
}
```

### 10. Secure Cookie Configuration (Production)

Better Auth handles this automatically, but ensure your deployment:
- Uses HTTPS in production
- Has correct `BETTER_AUTH_URL` matching your domain
- Sets `trustedOrigins` if using multiple domains

---

## Troubleshooting

### Common Issues

#### 1. "Session token not found" Error

**Cause**: Cookie not being set or read correctly.

**Solution**:
- Ensure `BETTER_AUTH_URL` matches your actual URL
- Check that cookies are enabled in browser
- Verify HTTPS in production

#### 2. "Invalid credentials" Despite Correct Password

**Cause**: Account might not exist or password mismatch.

**Solution**:
- Check if user exists in database
- Verify `providerId` is "credential" for email/password accounts
- Ensure password is being hashed correctly

#### 3. OAuth Redirect Errors

**Cause**: Callback URL mismatch.

**Solution**:
- Verify callback URL in provider console matches exactly
- Include port number in development: `http://localhost:3000/api/auth/callback/google`

#### 4. Prisma Connection Pool Exhaustion

**Cause**: Too many connections from serverless functions.

**Solution**:
- Use connection pooler URL for queries (`DATABASE_URL`)
- Use direct URL for auth operations (`DIRECT_URL`)
- Configure Prisma connection pool limits

#### 5. "Module not found" for Prisma Client

**Cause**: Generated client not found.

**Solution**:
```bash
pnpm prisma generate
```

Ensure your import matches the output path:
```typescript
import { PrismaClient } from "@/generated/prisma/client";
```

### Debug Mode

Enable debug logging:

```typescript
export const auth = betterAuth({
  // ... config
  debug: process.env.NODE_ENV === "development",
});
```

---

## File Structure Reference

```
project/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts      # Better Auth API handler
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── signup/
│   │   └── page.tsx              # Signup page
│   └── dashboard/
│       └── page.tsx              # Protected page
├── lib/
│   ├── auth.ts                   # Server-side auth config
│   └── auth-client.ts            # Client-side auth utilities
├── prisma/
│   └── schema.prisma             # Database schema
├── generated/
│   └── prisma/
│       └── client/               # Generated Prisma client
├── proxy.ts                      # Route protection (Next.js 15+)
├── .env                          # Environment variables
└── .env.example                  # Environment template
```

---

## Quick Start Checklist

- [ ] Install `better-auth` package
- [ ] Install and configure Prisma
- [ ] Create database schema with required tables
- [ ] Run `pnpm prisma generate` and `pnpm prisma db push`
- [ ] Create `lib/auth.ts` with server config
- [ ] Create `lib/auth-client.ts` with client config
- [ ] Create `app/api/auth/[...all]/route.ts`
- [ ] Create `proxy.ts` for route protection
- [ ] Set environment variables in `.env`
- [ ] Create login and signup pages
- [ ] Test authentication flow

---

## Resources

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Authentication](https://nextjs.org/docs/authentication)

---

*Last Updated: December 2025*
