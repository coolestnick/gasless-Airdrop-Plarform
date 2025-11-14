# Vercel Deployment - Files Created

## 📁 Files Created for Vercel Deployment

### Backend Files
1. **`backend/vercel.json`** - Vercel configuration for backend API
2. **`backend/api/index.js`** - Serverless function entry point (wraps Express app)
3. **`backend/api/README.md`** - Documentation for the API directory

### Frontend Files
1. **`frontend/vercel.json`** - Vercel configuration for React frontend

### Root Files
1. **`.vercelignore`** - Files to ignore during deployment
2. **`VERCEL-DEPLOYMENT.md`** - Complete deployment guide
3. **`QUICK-DEPLOY.md`** - Quick 5-minute deployment guide
4. **`deploy-vercel.sh`** - Automated deployment script
5. **`.github/workflows/vercel-deploy.yml`** - GitHub Actions workflow (optional)

## 🚀 Quick Start

### Option 1: Vercel Dashboard (Recommended)
1. Follow `QUICK-DEPLOY.md` for step-by-step instructions
2. Deploy backend first, then frontend
3. Update environment variables
4. Done! Auto-deploys on every GitHub push

### Option 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy backend
cd gasless-airdrop/backend
vercel --prod

# Deploy frontend
cd ../frontend
vercel --prod
```

### Option 3: Automated Script
```bash
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

## 📋 What Changed

### Backend
- ✅ Created serverless function wrapper (`api/index.js`)
- ✅ Updated database connection for serverless
- ✅ Configured Vercel routes and functions
- ✅ Set function timeout to 30 seconds

### Frontend
- ✅ Configured for Create React App
- ✅ Set build output directory
- ✅ Configured SPA routing

## 🔧 Key Features

1. **Automatic Deployments**
   - Every push to `main` branch triggers deployment
   - Preview deployments for pull requests

2. **Serverless Functions**
   - Backend runs as serverless functions
   - Auto-scales based on traffic
   - Pay only for what you use

3. **Environment Variables**
   - Secure storage in Vercel dashboard
   - Different values for production/preview
   - Easy to update without code changes

4. **Custom Domains**
   - Add custom domains in Vercel dashboard
   - Automatic SSL certificates
   - DNS configuration guide included

## 📚 Documentation

- **Quick Start**: `QUICK-DEPLOY.md`
- **Full Guide**: `VERCEL-DEPLOYMENT.md`
- **API Docs**: `backend/api/README.md`

## ⚠️ Important Notes

1. **MongoDB Atlas**: 
   - Whitelist `0.0.0.0/0` in MongoDB Atlas for Vercel IPs
   - Or use MongoDB Atlas Vercel integration

2. **Environment Variables**:
   - Must be set in Vercel dashboard
   - Update `FRONTEND_URL` in backend after frontend deploys
   - Update `REACT_APP_API_URL` in frontend with backend URL

3. **CSV Import**:
   - Run import script locally or via Vercel CLI
   - Or use MongoDB directly

4. **Function Limits**:
   - Free tier: 10s timeout, 50MB memory
   - Pro tier: 60s timeout, 1024MB memory
   - Current config: 30s timeout, 1024MB memory (Pro tier)

## 🎯 Next Steps

1. Push code to GitHub
2. Deploy backend to Vercel
3. Deploy frontend to Vercel
4. Update environment variables
5. Import CSV data
6. Test the deployment

## ✅ Success Checklist

- [ ] Backend deployed and health check works
- [ ] Frontend deployed and loads correctly
- [ ] Environment variables set correctly
- [ ] Frontend can connect to backend API
- [ ] MongoDB connection working
- [ ] CSV data imported
- [ ] Automatic deployments working

---

**Ready to deploy?** Start with `QUICK-DEPLOY.md`! 🚀

