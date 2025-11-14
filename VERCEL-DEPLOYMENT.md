# Vercel Deployment Guide

This guide will help you deploy both the frontend and backend to Vercel with automatic GitHub deployments.

## Prerequisites

1. GitHub account with your repository
2. Vercel account (sign up at [vercel.com](https://vercel.com))
3. MongoDB database (MongoDB Atlas recommended)
4. All environment variables ready

## Deployment Structure

```
gasless-airdrop/
├── backend/          # Backend API (deployed as serverless functions)
│   ├── api/
│   │   └── index.js  # Vercel serverless function entry point
│   └── vercel.json   # Backend Vercel configuration
└── frontend/         # React frontend
    └── vercel.json   # Frontend Vercel configuration
```

## Step 1: Deploy Backend API

### 1.1 Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Select the repository containing your code

### 1.2 Configure Backend Project

**Project Settings:**
- **Framework Preset**: Other
- **Root Directory**: `gasless-airdrop/backend`
- **Build Command**: (leave empty - not needed for serverless)
- **Output Directory**: (leave empty)
- **Install Command**: `npm install`

### 1.3 Add Environment Variables

Add these environment variables in Vercel dashboard:

```env
# Server Configuration
NODE_ENV=production
PORT=3001

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# Shardeum Network Configuration
RPC_URL=https://api.shardeum.org
CHAIN_ID=8118
BLOCK_EXPLORER=https://explorer.shardeum.org

# Backend Wallet
PRIVATE_KEY=your_private_key_without_0x_prefix

# Token Configuration
TOKEN_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
TOKEN_DECIMALS=18

# Security
API_SECRET_KEY=your_random_secret_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5

# Admin
ADMIN_WALLET_ADDRESS=your_admin_wallet_address

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 1.4 Deploy Backend

1. Click **"Deploy"**
2. Wait for deployment to complete
3. Note the deployment URL (e.g., `https://your-backend.vercel.app`)

### 1.5 Test Backend

Visit: `https://your-backend.vercel.app/health`

You should see:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Step 2: Deploy Frontend

### 2.1 Create New Vercel Project for Frontend

1. In Vercel Dashboard, click **"Add New Project"** again
2. Select the same GitHub repository
3. This time, configure it for the frontend

### 2.2 Configure Frontend Project

**Project Settings:**
- **Framework Preset**: Create React App
- **Root Directory**: `gasless-airdrop/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### 2.3 Add Frontend Environment Variables

Add these environment variables:

```env
REACT_APP_API_URL=https://your-backend.vercel.app/api
REACT_APP_CHAIN_ID=8118
REACT_APP_CHAIN_NAME=Shardeum
REACT_APP_RPC_URL=https://api.shardeum.org
REACT_APP_BLOCK_EXPLORER=https://explorer.shardeum.org
REACT_APP_CURRENCY_SYMBOL=SHM
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

**Important**: Replace `your-backend.vercel.app` with your actual backend URL from Step 1.4

### 2.4 Deploy Frontend

1. Click **"Deploy"**
2. Wait for deployment to complete
3. Note the frontend URL (e.g., `https://your-frontend.vercel.app`)

### 2.5 Update Backend CORS

1. Go back to your backend project in Vercel
2. Update the `FRONTEND_URL` environment variable with your frontend URL
3. Redeploy the backend (Vercel will auto-redeploy on next push, or click "Redeploy")

## Step 3: Configure Automatic Deployments

### 3.1 GitHub Integration

Vercel automatically connects to GitHub. Every push to your main branch will trigger a new deployment.

**For Backend:**
- Push to `main` branch → Backend auto-deploys
- Vercel watches the `gasless-airdrop/backend` directory

**For Frontend:**
- Push to `main` branch → Frontend auto-deploys
- Vercel watches the `gasless-airdrop/frontend` directory

### 3.2 Branch Deployments

- **Production**: Deploys from `main` branch
- **Preview**: Deploys from other branches (for testing)

## Step 4: Import CSV Data

After deployment, you need to import your CSV data:

### Option 1: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
cd gasless-airdrop/backend
vercel link

# Run import script
vercel env pull .env.local
npm run import-csv
```

### Option 2: Using Vercel Functions

Create a one-time import function or use MongoDB directly.

## Step 5: Custom Domains (Optional)

### 5.1 Add Custom Domain to Backend

1. Go to backend project settings
2. Navigate to **Domains**
3. Add your custom domain (e.g., `api.yourdomain.com`)
4. Follow DNS configuration instructions

### 5.2 Add Custom Domain to Frontend

1. Go to frontend project settings
2. Navigate to **Domains**
3. Add your custom domain (e.g., `yourdomain.com`)
4. Follow DNS configuration instructions

## Environment Variables Reference

### Backend Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `PRIVATE_KEY` | Backend wallet private key | Yes |
| `API_SECRET_KEY` | Admin API secret key | Yes |
| `RPC_URL` | Shardeum RPC endpoint | Yes |
| `CHAIN_ID` | Shardeum chain ID (8118) | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `TOKEN_CONTRACT_ADDRESS` | Token contract address | No |
| `TOKEN_DECIMALS` | Token decimals | No |
| `ADMIN_WALLET_ADDRESS` | Admin wallet address | No |

### Frontend Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API URL | Yes |
| `REACT_APP_CHAIN_ID` | Shardeum chain ID | Yes |
| `REACT_APP_RPC_URL` | Shardeum RPC URL | Yes |
| `REACT_APP_BLOCK_EXPLORER` | Block explorer URL | Yes |
| `REACT_APP_CURRENCY_SYMBOL` | Currency symbol (SHM) | Yes |
| `REACT_APP_RECAPTCHA_SITE_KEY` | reCAPTCHA site key | No |

## Troubleshooting

### Backend Issues

**Problem**: Functions timeout
- **Solution**: Increase `maxDuration` in `vercel.json` (max 60s for Pro, 10s for Hobby)

**Problem**: Database connection fails
- **Solution**: Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Vercel)

**Problem**: CORS errors
- **Solution**: Update `FRONTEND_URL` in backend environment variables

### Frontend Issues

**Problem**: API calls fail
- **Solution**: Check `REACT_APP_API_URL` points to correct backend URL

**Problem**: Build fails
- **Solution**: Check all environment variables are set correctly

## Monitoring

### Vercel Analytics

1. Enable Vercel Analytics in project settings
2. Monitor function execution times
3. Check error logs in Vercel dashboard

### Logs

- View real-time logs in Vercel dashboard
- Filter by function name
- Export logs for analysis

## Cost Considerations

### Vercel Free Tier

- **Functions**: 100GB-hours/month
- **Bandwidth**: 100GB/month
- **Builds**: Unlimited
- **Domains**: Custom domains supported

### Vercel Pro Tier

- **Functions**: 1000GB-hours/month
- **Bandwidth**: 1TB/month
- **Advanced features**: Analytics, password protection, etc.

## Security Best Practices

1. **Never commit `.env` files** - Use Vercel environment variables
2. **Use strong `API_SECRET_KEY`** - Generate random string
3. **Restrict MongoDB access** - Use IP whitelist in MongoDB Atlas
4. **Enable Vercel password protection** - For staging environments
5. **Use HTTPS** - Vercel provides SSL automatically

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Discord](https://vercel.com/discord)
- Check logs in Vercel dashboard for errors

---

**Ready to deploy?** Follow the steps above and your app will be live with automatic deployments! 🚀

