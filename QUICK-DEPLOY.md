# Quick Vercel Deployment Guide

## 🚀 Fast Deployment (5 minutes)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Setup Vercel deployment"
git push origin main
```

### Step 2: Deploy Backend

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Configure Backend:**
   - **Root Directory**: `gasless-airdrop/backend`
   - **Framework**: Other
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
4. Add environment variables (see below)
5. Click **Deploy**
6. Copy the deployment URL (e.g., `https://your-backend.vercel.app`)

### Step 3: Deploy Frontend

1. Go to [vercel.com/new](https://vercel.com/new) again
2. Import the same GitHub repository
3. **Configure Frontend:**
   - **Root Directory**: `gasless-airdrop/frontend`
   - **Framework**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. Add environment variables (see below)
5. Click **Deploy**
6. Copy the frontend URL (e.g., `https://your-frontend.vercel.app`)

### Step 4: Update Environment Variables

**Backend:**
- Go to backend project → Settings → Environment Variables
- Update `FRONTEND_URL` with your frontend URL
- Redeploy

**Frontend:**
- Go to frontend project → Settings → Environment Variables
- Update `REACT_APP_API_URL` with `https://your-backend.vercel.app/api`
- Redeploy

## 📋 Environment Variables Checklist

### Backend Variables

```env
MONGODB_URI=mongodb+srv://...
PRIVATE_KEY=your_private_key
API_SECRET_KEY=your_secret_key
RPC_URL=https://api.shardeum.org
CHAIN_ID=8118
BLOCK_EXPLORER=https://explorer.shardeum.org
FRONTEND_URL=https://your-frontend.vercel.app
TOKEN_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
TOKEN_DECIMALS=18
ADMIN_WALLET_ADDRESS=your_admin_address
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
```

### Frontend Variables

```env
REACT_APP_API_URL=https://your-backend.vercel.app/api
REACT_APP_CHAIN_ID=8118
REACT_APP_CHAIN_NAME=Shardeum
REACT_APP_RPC_URL=https://api.shardeum.org
REACT_APP_BLOCK_EXPLORER=https://explorer.shardeum.org
REACT_APP_CURRENCY_SYMBOL=SHM
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_key
```

## ✅ Automatic Deployments

Once set up, every push to `main` branch automatically deploys:
- ✅ Backend auto-deploys
- ✅ Frontend auto-deploys
- ✅ Preview deployments for PRs

## 🔧 Troubleshooting

**Backend not working?**
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0`)
- Check environment variables are set
- View logs in Vercel dashboard

**Frontend can't connect to backend?**
- Check `REACT_APP_API_URL` is correct
- Check backend CORS settings
- Check browser console for errors

**Need help?**
- See full guide: `VERCEL-DEPLOYMENT.md`
- Check Vercel logs in dashboard
- Verify environment variables

---

**That's it!** Your app is now live with automatic deployments! 🎉

