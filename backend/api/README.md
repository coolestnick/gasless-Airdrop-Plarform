# Vercel Serverless API

This directory contains the Vercel serverless function entry point.

## Structure

- `index.js` - Main serverless function that wraps the Express app
- Routes are imported from `../routes/`
- All Express middleware and routes work as normal

## How It Works

1. Vercel calls `api/index.js` for all `/api/*` requests
2. The function initializes database and wallet service (cached)
3. Express app handles the request
4. Response is returned to Vercel

## Environment Variables

All environment variables should be set in Vercel dashboard:
- Project Settings → Environment Variables

## Testing Locally

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev
```

This will simulate the Vercel serverless environment locally.

