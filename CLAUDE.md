# Wardrobe 3.0 - Setup Documentation

This document provides a complete guide for setting up the Wardrobe 3.0 application with authentication.

## Tech Stack

- **Framework**: Next.js 16.0.6 (App Router with Turbopack)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Database**: Neon PostgreSQL (Serverless)
- **ORM**: Prisma 6.19.0
- **Authentication**: Better Auth 1.4.4
- **Package Manager**: pnpm
- **UI Components**: Lucide React icons, class-variance-authority, clsx, tailwind-merge

## Prerequisites

- Node.js 20.x or higher
- pnpm installed globally (`npm install -g pnpm`)
- A Neon PostgreSQL database account (https://neon.tech)

## Initial Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Install Better Auth

Follow the official Better Auth installation guide: https://www.better-auth.com/docs/installation

```bash
# Install Better Auth and Prisma adapter
pnpm add better-auth

# Install Prisma for database ORM
pnpm add -D prisma @prisma/client
```

### 3. Database Setup (Neon PostgreSQL)

#### Create Prisma Schema

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

#### Configure Environment Variables

Create/update `.env` file:

```env
# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here

# Neon Database URLs
# Pooled connection for queries (with -pooler suffix)
DATABASE_URL="postgresql://user:password@host-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Direct connection for migrations (without -pooler)
DIRECT_URL="postgresql://user:password@host.region.aws.neon.tech/neondb?sslmode=require"
```

**Important**:
- `DATABASE_URL` should use the pooled connection (with `-pooler` in hostname)
- `DIRECT_URL` should use the direct connection (without `-pooler`)
- Get both URLs from your Neon dashboard

#### Generate Prisma Client and Push Schema

```bash
# Generate Prisma client
pnpm prisma generate

# Push schema to database (for development)
pnpm prisma db push

# Or create and run migrations (for production)
pnpm prisma migrate dev --name init
```

### 4. Better Auth Configuration

#### Server-side Auth Setup

Create `lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
});
```

**Reference**: https://www.better-auth.com/docs/installation#configure-better-auth

#### Client-side Auth Setup

Create `lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

#### API Route Handler

Create `app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

This creates all necessary auth endpoints:
- `/api/auth/sign-in`
- `/api/auth/sign-up`
- `/api/auth/sign-out`
- `/api/auth/session`
- etc.

**Reference**: https://www.better-auth.com/docs/installation#api-handler

### 5. Route Protection (Next.js 16)

Create `proxy.ts` (Next.js 16 uses `proxy.ts` instead of `middleware.ts`):

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("better-auth.session_token");
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth pages with active session
  const authPages = ["/login", "/signup"];
  if (authPages.includes(pathname) && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
```

**Note**: Next.js 16 requires `proxy.ts` instead of `middleware.ts`

## Project Structure

```
Wardrobe 3.0/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts          # Better Auth API handler
│   ├── dashboard/
│   │   └── page.tsx                  # Protected dashboard page
│   ├── login/
│   │   └── page.tsx                  # Login page
│   ├── signup/
│   │   └── page.tsx                  # Signup page
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Homepage
│   └── globals.css                   # Global styles
├── lib/
│   ├── auth.ts                       # Server-side auth config
│   └── auth-client.ts                # Client-side auth utilities
├── prisma/
│   └── schema.prisma                 # Database schema
├── generated/
│   └── prisma/
│       └── client/                   # Generated Prisma client
├── proxy.ts                          # Route protection (Next.js 16)
├── .env                              # Environment variables (not in git)
├── .env.example                      # Environment variables template
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── tailwind.config.ts
```

## Authentication Pages

### Login Page (`app/login/page.tsx`)

- Email and password inputs
- Form validation
- Error handling
- Redirect to dashboard on success
- Link to signup page

### Signup Page (`app/signup/page.tsx`)

- Name, email, password, and confirm password inputs
- Client-side validation (password length, matching passwords)
- Error handling
- Redirect to dashboard on success
- Link to login page

### Dashboard Page (`app/dashboard/page.tsx`)

- Protected route (requires authentication)
- Displays user information
- Stats cards (placeholder for future features)
- Quick action buttons
- Sign out functionality

## Running the Application

### Development

```bash
pnpm dev
```

The app will be available at http://localhost:3000

### Build

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Linting

```bash
pnpm lint
```

## Database Management

### Generate Prisma Client

After any schema changes:

```bash
pnpm prisma generate
```

### Push Schema Changes (Development)

```bash
pnpm prisma db push
```

### Create Migration (Production)

```bash
pnpm prisma migrate dev --name your_migration_name
```

### View Database in Prisma Studio

```bash
pnpm prisma studio
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BETTER_AUTH_URL` | Application URL | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Secret key for session encryption | Generate using `openssl rand -base64 32` |
| `DATABASE_URL` | Neon pooled connection string | `postgresql://user:pass@host-pooler.neon.tech/db` |
| `DIRECT_URL` | Neon direct connection string | `postgresql://user:pass@host.neon.tech/db` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Public app URL for client-side | `http://localhost:3000` |

## Better Auth Features

### Current Implementation

- ✅ Email/Password Authentication
- ✅ Session Management
- ✅ Prisma Adapter
- ✅ PostgreSQL Support
- ✅ Route Protection

### Available Features (Not Yet Implemented)

Better Auth supports many additional features:

- OAuth Providers (Google, GitHub, etc.)
- Magic Link Authentication
- Two-Factor Authentication (2FA)
- Email Verification
- Password Reset
- User Roles & Permissions
- Account Linking

**Reference**: https://www.better-auth.com/docs/concepts/authentication-methods

## Troubleshooting

### Prisma Version Conflict

If you encounter ES Module errors with Prisma 7.x:

```bash
pnpm remove prisma @prisma/client
pnpm add -D prisma@^6.0.0 @prisma/client@^6.0.0
pnpm prisma generate
```

### Better Auth Peer Dependency Warning

Better Auth currently supports Next.js 14-15. It works with Next.js 16 but shows a peer dependency warning. This is expected and doesn't affect functionality.

### Middleware Deprecation Warning

Next.js 16 requires using `proxy.ts` instead of `middleware.ts`. Make sure you're using `proxy.ts`.

### Database Connection Issues

1. Verify your Neon database is active
2. Check that `DATABASE_URL` uses the pooled connection (`-pooler`)
3. Check that `DIRECT_URL` uses the direct connection (no `-pooler`)
4. Ensure `sslmode=require` is in both connection strings

## Design System

### CSS & Styling Philosophy

This project uses a **design token system** defined in `app/globals.css` with Tailwind CSS v4. Always follow these guidelines:

### 1. Color System - Use Semantic Tokens

**NEVER** use hardcoded colors like `blue-600`, `gray-900`, `red-500`. **ALWAYS** use semantic color tokens that adapt to light/dark modes automatically.

#### Available Color Tokens:

**Background & Surfaces:**
- `bg-background` - Main background color
- `bg-card` - Card/surface background
- `bg-popover` - Popover background
- `text-foreground` - Main text color
- `text-card-foreground` - Text on cards
- `text-popover-foreground` - Text in popovers

**Interactive Elements:**
- `bg-primary` - Primary action buttons
- `text-primary-foreground` - Text on primary buttons
- `hover:bg-primary/90` - Primary button hover state
- `bg-secondary` - Secondary buttons
- `text-secondary-foreground` - Text on secondary buttons
- `hover:bg-secondary/80` - Secondary button hover state

**Status & Feedback:**
- `bg-destructive` - Destructive actions (delete, sign out)
- `text-destructive-foreground` - Text on destructive buttons
- `text-destructive` - Error text
- `bg-accent` - Accent highlights
- `text-accent-foreground` - Text on accent backgrounds

**Muted & Subtle:**
- `bg-muted` - Muted backgrounds
- `text-muted-foreground` - Subtle text, labels, descriptions

**Borders & Inputs:**
- `border-border` - All borders
- `border-input` - Input field borders
- `focus:ring-ring` - Focus ring color

#### ❌ WRONG Examples:
```tsx
// DON'T use hardcoded colors
<div className="bg-gray-50">
<button className="bg-blue-600 text-white">
<p className="text-gray-600">
<div className="border-gray-300">
```

#### ✅ CORRECT Examples:
```tsx
// DO use semantic tokens
<div className="bg-background">
<button className="bg-primary text-primary-foreground">
<p className="text-muted-foreground">
<div className="border-border">
```

### 2. Typography

**Fonts:**
- `font-sans` - Poppins (default for UI)
- `font-serif` - Lora (for special headings)
- `font-mono` - Fira Code (for code)

**Text Colors:**
- Main content: `text-foreground` or `text-card-foreground`
- Labels/descriptions: `text-muted-foreground`
- Links: `text-primary hover:text-primary/80`

### 3. Spacing & Layout

Use Tailwind's default spacing scale (based on `--spacing: 0.25rem`):
- `p-4`, `p-6`, `p-8` for padding
- `gap-4`, `gap-6`, `gap-8` for flex/grid gaps
- `mb-2`, `mb-4`, `mb-8` for margins

### 4. Shadows

The design system includes custom shadows with offset:
- `shadow-sm` - Subtle shadow for buttons
- `shadow-lg` - Card shadows
- `shadow-xl` - Modal/popover shadows

### 5. Border Radius

Use consistent border radius:
- `rounded-lg` - Standard for buttons, inputs (8px)
- `rounded-xl` - Cards and containers (12px)
- `rounded-full` - Circular elements

### 6. Component Patterns

#### Buttons:
```tsx
// Primary button
<button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-lg transition shadow-sm">

// Secondary button
<button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold py-3 px-4 rounded-lg border border-border transition shadow-sm">

// Destructive button
<button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold py-3 px-4 rounded-lg transition shadow-sm">
```

#### Input Fields:
```tsx
<input className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition" />
```

#### Cards:
```tsx
<div className="bg-card rounded-xl shadow-lg border border-border p-6">
  <h3 className="text-xl font-semibold text-card-foreground mb-2">Title</h3>
  <p className="text-muted-foreground">Description</p>
</div>
```

#### Links:
```tsx
<Link href="/path" className="text-primary hover:text-primary/80 font-semibold">
  Link Text
</Link>
```

### 7. Dark Mode Support

All color tokens automatically adapt to dark mode through CSS variables. **NEVER** manually handle dark mode with conditional classes.

#### ❌ WRONG:
```tsx
<div className="bg-white dark:bg-gray-900">
```

#### ✅ CORRECT:
```tsx
<div className="bg-card">
```

### 8. Page Structure Template

All pages should follow this structure:

```tsx
export default function PageName() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-xl shadow-lg border border-border p-6">
          <h1 className="text-2xl font-bold text-card-foreground">Title</h1>
          <p className="text-muted-foreground">Description</p>
        </div>
      </main>
    </div>
  );
}
```

### 9. Consistency Rules

1. **Always use semantic tokens** - Never hardcode colors
2. **Use consistent spacing** - Stick to the spacing scale
3. **Follow component patterns** - Don't create new button/input styles
4. **Maintain hierarchy** - Use `text-card-foreground` for headings, `text-muted-foreground` for descriptions
5. **Add shadows consistently** - `shadow-sm` for buttons, `shadow-lg` for cards

## Coding Standards

### TypeScript Best Practices

1. **No `any` Types**: NEVER use the `any` type. Always create proper types or interfaces for objects.
   ```typescript
   // ❌ WRONG - Don't use any
   catch (err: any) {
     console.log(err.message);
   }

   // ✅ CORRECT - Use unknown and type narrowing
   catch (err: unknown) {
     if (err instanceof Error) {
       console.log(err.message);
     }
   }

   // ✅ CORRECT - Create specific error types
   interface ApiError {
     message: string;
     code?: string;
   }

   catch (err: unknown) {
     const error = err as ApiError;
     console.log(error.message);
   }
   ```

2. **Define Types/Interfaces**: Always define types or interfaces for objects, function parameters, and return values.
   ```typescript
   // ✅ CORRECT
   interface UserData {
     email: string;
     password: string;
     name?: string;
   }

   async function createUser(data: UserData): Promise<User> {
     // implementation
   }
   ```

3. **Use Type Inference**: Let TypeScript infer types when they're obvious, but be explicit when needed for clarity.

## Security Best Practices

1. **Environment Variables**: Never commit `.env` to version control
2. **Secret Keys**: Generate strong secrets using `openssl rand -base64 32`
3. **HTTPS**: Use HTTPS in production
4. **Password Policy**: Enforce minimum password length (currently 8 characters)
5. **Session Management**: Better Auth handles secure session cookies automatically
6. **SQL Injection**: Prisma provides protection against SQL injection
7. **XSS Protection**: React provides XSS protection by default

## Next Steps

### Recommended Enhancements

1. **Email Verification**: Add email verification for new users
2. **Password Reset**: Implement forgot password functionality
3. **OAuth Providers**: Add Google/GitHub sign-in
4. **User Profile**: Create user profile edit page
5. **Account Settings**: Add account management features
6. **2FA**: Implement two-factor authentication
7. **Rate Limiting**: Add rate limiting to auth endpoints
8. **Logging**: Implement audit logging for auth events

### Application Features to Build

1. **Wardrobe Management**: Add/edit/delete clothing items
2. **Categories**: Organize items by category
3. **Outfits**: Create and save outfit combinations
4. **Analytics**: Track wear frequency and favorite items
5. **Image Upload**: Add photo support for clothing items
6. **Search & Filter**: Find items quickly
7. **Sharing**: Share outfits with friends

## Useful Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Generate Prisma client
pnpm prisma generate

# Push schema to database
pnpm prisma db push

# Open Prisma Studio
pnpm prisma studio

# Create migration
pnpm prisma migrate dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## Resources

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

Private project - All rights reserved

## Contributors

- Development started: December 2025
- Primary developer: [Your Name]

---

**Last Updated**: December 1, 2025
**Version**: 0.1.0
