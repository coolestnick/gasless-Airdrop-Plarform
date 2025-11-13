# Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Setup Backend (2 minutes)

```bash
# Navigate to backend
cd gasless-airdrop/backend

# Install dependencies
npm install

# IMPORTANT: Edit .env file and add your private key
# Open .env and replace: PRIVATE_KEY=your_private_key_without_0x_prefix
nano .env  # or use your preferred editor

# Import eligible users from CSV
npm run import-csv

# Start backend server
npm run dev
```

**Backend will be running at**: `http://localhost:3001`

### Step 2: Setup Frontend (2 minutes)

```bash
# Open a new terminal
# Navigate to frontend
cd gasless-airdrop/frontend

# Install dependencies
npm install

# Start frontend
npm start
```

**Frontend will open at**: `http://localhost:3000`

### Step 3: Fund Your Backend Wallet (1 minute)

1. Get your backend wallet address:
```bash
cd backend
node -e "const {ethers} = require('ethers'); const w = new ethers.Wallet('YOUR_PRIVATE_KEY'); console.log('Wallet Address:', w.address)"
```

2. Send SHM tokens to this address (enough to cover all airdrops + gas)
   - Example: For 11,648 users, send ~6,000,000 SHM

3. Verify balance:
```bash
curl http://localhost:3001/api/stats
```

### Step 4: Test the System ✅

1. Open `http://localhost:3000` in your browser
2. Click "Connect Wallet"
3. Connect with MetaMask
4. If your wallet is in the CSV, you'll see your allocation
5. Click "Claim Airdrop"
6. Sign the message (no gas required!)
7. Tokens will be sent to your wallet!

---

## 🔧 Common Issues

### Issue: "MetaMask not detected"
**Solution**: Install MetaMask from https://metamask.io/download/

### Issue: "Wrong network"
**Solution**: Click "Switch Network" button in the app

### Issue: "Backend wallet balance is 0"
**Solution**: Fund your backend wallet with SHM tokens

### Issue: "Wallet not eligible"
**Solution**: Make sure the wallet address exists in the CSV file

---

## 📊 Monitoring

### Check Statistics
```bash
curl http://localhost:3001/api/stats
```

### View Recent Claims
```bash
curl http://localhost:3001/api/recent-claims?limit=10
```

### Check Specific Wallet
```bash
curl http://localhost:3001/api/claim-status/0xYourWalletAddress
```

---

## 🎯 Next Steps

1. **Customize Token Allocation**: Edit `backend/scripts/importCSV.js`
2. **Update Branding**: Modify `frontend/src/App.js` and `App.css`
3. **Deploy to Production**: See README.md for deployment instructions
4. **Add Admin Dashboard**: Create protected routes for admin tasks

---

## 📝 Important Notes

- **Never commit your `.env` file** to version control
- **Backup your private key** securely
- **Monitor backend wallet balance** regularly
- **Set up proper logging** in production
- **Use HTTPS** in production

---

## 🆘 Need Help?

1. Check the full README.md for detailed documentation
2. Review the logs in `backend/logs/`
3. Verify MongoDB connection
4. Check that all services are running

---

**That's it! You're ready to run a gasless airdrop! 🎉**
