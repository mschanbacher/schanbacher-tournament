# Schanbacher Tournament Challenge

Family March Madness bracket competition, est. 2003.

## Quick Start (Local Development)

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deployment

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/schanbacher-tournament.git
git push -u origin main
```

### 2. Create Supabase Project
- Go to https://supabase.com and sign up
- Create a new project
- Go to SQL Editor and run `supabase/schema.sql`
- Then run `supabase/seed_history.sql`
- Copy your API URL and anon key from Settings > API

### 3. Deploy to Vercel
- Go to https://vercel.com and sign up with GitHub
- Import your repository
- Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Deploy

## Tech Stack
- Next.js 14 (React)
- Supabase (PostgreSQL)
- Vercel (Hosting)
