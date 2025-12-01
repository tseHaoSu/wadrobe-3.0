# Wardrobe 3.0 👗

**Your closet, but make it digital.**

Ever stared at your closet for 20 minutes only to wear the same outfit you wore last Tuesday? Yeah, us too. Wardrobe 3.0 is here to save your mornings (and your fashion reputation).

## What is this?

Wardrobe 3.0 is a digital wardrobe that lets you:

- **Drag and drop your clothes** around like you're playing dress-up (because you are)
- **Get AI-powered styling suggestions** so you stop asking "does this go together?"
- **Organize your entire closet** without the physical labor of actually organizing your closet

Simply snap a photo of your clothing item, and our AI does the heavy lifting — extracting the image, categorizing it, and making it ready for your virtual wardrobe.

## The Magic Behind the Curtain 🪄

We use some seriously cool tech to make your clothes come alive digitally:

- **Nano Banana Pro** - For lightning-fast image processing and garment detection
- **OpenAI Vision** - Extracts and understands your clothing items from photos (yes, it knows the difference between your "going out" jeans and your "staying in" jeans)

## Project Structure

```
wardrobe-3.0/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── auth/                 # Authentication endpoints
│   │       └── [...all]/         # Better Auth handler
│   ├── dashboard/                # Your wardrobe lives here
│   ├── login/                    # Sign in page
│   ├── signup/                   # Join the club
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Styling & design tokens
├── components/
│   └── ui/                       # Reusable UI components
├── lib/
│   ├── auth.ts                   # Server-side auth config
│   ├── auth-client.ts            # Client-side auth utilities
│   ├── utils.ts                  # Helper functions
│   └── validation.ts             # Form validation
├── prisma/
│   └── schema.prisma             # Database schema
├── generated/
│   └── prisma/client/            # Generated Prisma client
├── public/                       # Static assets
└── proxy.ts                      # Route protection middleware
```

## Tech Stack

| What | Why |
|------|-----|
| **Next.js 16** | Because we like living on the edge (with Turbopack) |
| **TypeScript** | Catching bugs before they catch you |
| **Tailwind CSS v4** | Making things pretty, fast |
| **Prisma + Neon PostgreSQL** | Your data, safe in the cloud |
| **Better Auth** | Authentication that just works |
| **Nano Banana Pro** | Image processing that's bananas (in a good way) |
| **OpenAI Vision** | AI that actually sees your clothes |

## Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/wardrobe-3.0.git
   cd wardrobe-3.0
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up your environment**
   ```bash
   cp .env.example .env
   # Fill in your database and API keys
   ```

4. **Initialize the database**
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

5. **Run it**
   ```bash
   pnpm dev
   ```

6. **Open [localhost:3000](http://localhost:3000)** and start building your digital wardrobe!

## Features

- **Drag & Drop Interface** - Arrange your clothes, create outfits, feel like a fashion designer
- **Smart Categorization** - AI automatically tags your clothes (shirts, pants, that questionable Hawaiian shirt)
- **Outfit Suggestions** - Get styled by AI that's seen more outfits than your fashion-forward friend
- **Secure Authentication** - Your wardrobe is *your* wardrobe

## Coming Soon

- Outfit history tracking (prove you don't wear the same thing every day)
- Weather-based suggestions (no more freezing in a crop top)
- Social sharing (flex your fits)
- Wardrobe analytics (finally answer "do I have too many black shirts?")

## Contributing

Found a bug? Have an idea? Open an issue or submit a PR. We don't bite.

## License

Private project - All rights reserved.

---

*Built with caffeine and questionable fashion choices.*
