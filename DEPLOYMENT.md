# Production Deployment Guide

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Backend wallet funded with sufficient SHM
- [ ] CSV data imported to database
- [ ] All tests passing
- [ ] Rate limits configured appropriately
- [ ] Logging set up and tested
- [ ] Security headers enabled
- [ ] CORS configured for production domain
- [ ] SSL/HTTPS certificates ready
- [ ] Backup strategy in place
- [ ] Monitoring tools configured

## Backend Deployment (Railway)

### Step 1: Prepare Repository

```bash
# Ensure .gitignore is properly configured
cd backend
cat .gitignore

# Create production build if needed
npm install --production
```

### Step 2: Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway will auto-detect Node.js

### Step 3: Configure Environment Variables

In Railway dashboard, add these variables:

```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://contactnikhil2002_db_user:CZdj9v0NfU8vN24N@test.iphvonu.mongodb.net/?appName=Test
RPC_URL=https://api.shardeum.org
CHAIN_ID=8118
BLOCK_EXPLORER=https://explorer.shardeum.org
PRIVATE_KEY=your_private_key_here
TOKEN_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
TOKEN_DECIMALS=18
API_SECRET_KEY=your_strong_secret_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
ADMIN_WALLET_ADDRESS=your_admin_address
FRONTEND_URL=https://your-frontend-domain.com
```

### Step 4: Deploy

```bash
# Railway will automatically deploy when you push to main
git push origin main

# Or use Railway CLI
railway login
railway link
railway up
```

### Step 5: Import CSV to Production

```bash
# Connect to Railway shell
railway shell

# Run import script
npm run import-csv
```

### Step 6: Get Production URL

Railway will provide a URL like: `https://your-app.up.railway.app`

## Frontend Deployment (Vercel)

### Step 1: Prepare for Production

```bash
cd frontend

# Update .env for production
REACT_APP_API_URL=https://your-backend.up.railway.app/api
REACT_APP_CHAIN_ID=8118
REACT_APP_CHAIN_NAME=Shardeum
REACT_APP_RPC_URL=https://api.shardeum.org
REACT_APP_BLOCK_EXPLORER=https://explorer.shardeum.org
REACT_APP_CURRENCY_SYMBOL=SHM
```

### Step 2: Deploy to Vercel

1. Go to [Vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Import Project"
4. Select your repository
5. Configure:
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

### Step 3: Add Environment Variables

In Vercel dashboard, add the same variables from `.env`

### Step 4: Deploy

```bash
# Vercel will auto-deploy on push
git push origin main

# Or use Vercel CLI
npm i -g vercel
vercel login
vercel
vercel --prod
```

## Alternative: Heroku Deployment

### Backend on Heroku

```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login
heroku login

# Create app
cd backend
heroku create your-airdrop-backend

# Add MongoDB (if not using external)
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set PRIVATE_KEY=your_key
# ... set all other variables

# Deploy
git push heroku main

# Run CSV import
heroku run npm run import-csv

# View logs
heroku logs --tail
```

### Frontend on Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
netlify deploy --prod
```

## Database Considerations

### MongoDB Atlas (Recommended)

1. Use MongoDB Atlas for production
2. Enable:
   - IP Whitelist (add your deployment IP)
   - Database encryption
   - Automatic backups
   - Monitoring

### Backup Strategy

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="./backups/backup_$DATE"

# Compress
tar -czf "./backups/backup_$DATE.tar.gz" "./backups/backup_$DATE"
rm -rf "./backups/backup_$DATE"

# Upload to cloud storage (S3, etc.)
# aws s3 cp "./backups/backup_$DATE.tar.gz" s3://your-bucket/
```

Schedule with cron:
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

## Security Hardening

### Backend Security

1. **Use HTTPS Only**
```javascript
// In production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

2. **Rate Limiting** - Already implemented

3. **Helmet Headers** - Already implemented

4. **CORS Whitelist**
```javascript
app.use(cors({
  origin: ['https://your-frontend.com', 'https://www.your-frontend.com'],
  credentials: true
}));
```

5. **Environment Variables**
   - Never commit .env files
   - Use secrets management (Railway/Heroku config vars)
   - Rotate keys regularly

### Frontend Security

1. **Content Security Policy**

Add to `public/index.html`:
```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';">
```

2. **HTTPS Only**
   - Vercel/Netlify provide automatic HTTPS

3. **Environment Variables**
   - Don't expose sensitive keys in frontend
   - Only use `REACT_APP_` prefixed variables

## Monitoring & Logging

### Backend Monitoring

1. **Log Management**
   - Use LogDNA, Papertrail, or Datadog
   - Set up alerts for errors

2. **Uptime Monitoring**
   - Use UptimeRobot or Pingdom
   - Monitor `/health` endpoint

3. **Performance Monitoring**
   - Use New Relic or AppDynamics
   - Monitor response times

### Database Monitoring

- MongoDB Atlas has built-in monitoring
- Set up alerts for:
  - High CPU usage
  - Low disk space
  - Slow queries
  - Connection errors

### Wallet Monitoring

**CRITICAL**: Monitor backend wallet balance

Create alert script:
```javascript
// scripts/checkBalance.js
const walletService = require('./services/walletService');
const logger = require('./utils/logger');

async function checkBalance() {
  await walletService.initialize();
  const balance = await walletService.getFormattedBalance();

  const threshold = 1000; // Alert if less than 1000 SHM

  if (parseFloat(balance) < threshold) {
    logger.error(`⚠️ LOW BALANCE ALERT: ${balance} SHM`);
    // Send email/SMS alert
  }
}

checkBalance();
```

Schedule with cron:
```bash
# Check every hour
0 * * * * node /path/to/checkBalance.js
```

## Performance Optimization

### Backend

1. **Database Indexing** - Already implemented

2. **Response Caching**
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

// Cache stats endpoint
router.get('/stats', async (req, res) => {
  const cached = cache.get('stats');
  if (cached) return res.json(cached);

  const stats = await EligibleUser.getStats();
  cache.set('stats', stats);
  res.json(stats);
});
```

3. **Connection Pooling** - MongoDB driver handles this

### Frontend

1. **Code Splitting** - Already handled by Create React App

2. **Image Optimization** - Use WebP format

3. **CDN** - Vercel/Netlify use CDN automatically

## Scaling Considerations

### Horizontal Scaling

If you expect high traffic:

1. **Load Balancer**
   - Use Railway/Heroku built-in load balancing
   - Or AWS ELB/ALB

2. **Multiple Backend Instances**
   - Scale to multiple containers
   - Ensure shared session state

3. **Database Scaling**
   - MongoDB Atlas auto-scaling
   - Consider read replicas

### Queue System (for high volume)

Implement job queue for claim processing:

```javascript
// Using Bull or BeeQueue
const Queue = require('bull');
const claimQueue = new Queue('claims');

// Producer (API endpoint)
router.post('/claim', async (req, res) => {
  await claimQueue.add({
    walletAddress,
    signature
  });
  res.json({ success: true, message: 'Claim queued' });
});

// Consumer (worker)
claimQueue.process(async (job) => {
  const { walletAddress, signature } = job.data;
  // Process claim
});
```

## Cost Estimation

### Monthly Costs (estimated)

- **Railway/Heroku**: $5-25/month (depending on usage)
- **MongoDB Atlas**: $0-9/month (free tier or shared cluster)
- **Vercel/Netlify**: $0 (free for hobby projects)
- **Domain**: $10-15/year

### Gas Costs

- **Per claim**: ~21,000 gas × gas price
- **Total for 11,648 users**: ~244,608,000 gas
- **At 1 Gwei**: 0.244 SHM total gas cost
- **Budget recommendation**: Add 50% buffer

### Token Costs

Based on allocation logic:
- **Total allocation**: ~5,824,000 SHM
- **Plus gas**: ~245 SHM
- **Total needed**: ~5,825,000 SHM

## Post-Deployment

### 1. Smoke Testing

```bash
# Test health
curl https://your-backend.com/health

# Test eligibility
curl -X POST https://your-backend.com/api/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x..."}'
```

### 2. Monitor Logs

```bash
# Railway
railway logs

# Heroku
heroku logs --tail
```

### 3. Test Full Flow

1. Visit production URL
2. Connect wallet
3. Check eligibility
4. Process test claim
5. Verify transaction on explorer

### 4. Set Up Alerts

- Uptime alerts
- Error rate alerts
- Balance alerts
- Performance alerts

## Maintenance

### Regular Tasks

- **Daily**: Check backend wallet balance
- **Daily**: Review error logs
- **Weekly**: Check claim statistics
- **Weekly**: Database backup verification
- **Monthly**: Security audit
- **Monthly**: Dependency updates

### Emergency Procedures

**If backend wallet is compromised:**
1. Immediately rotate private key
2. Deploy with new key
3. Investigate breach
4. Notify users if needed

**If database is compromised:**
1. Restore from backup
2. Change database credentials
3. Investigate breach
4. Check for data integrity

**If too many failed claims:**
1. Check backend logs
2. Verify wallet balance
3. Check RPC endpoint status
4. Temporarily pause if needed

## Rollback Procedure

```bash
# Railway
railway rollback

# Heroku
heroku releases
heroku rollback v123

# Vercel
vercel rollback
```

## Support & Documentation

After deployment, create:

1. **User Guide**: How to claim
2. **FAQ**: Common questions
3. **Support Email**: For user issues
4. **Status Page**: System status

---

**Good luck with your deployment! 🚀**
