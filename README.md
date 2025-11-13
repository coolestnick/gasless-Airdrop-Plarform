# Gasless Airdrop System for Shardeum

A complete gasless airdrop claims system where users can claim tokens without paying gas fees. All transactions and gas fees are paid from a backend wallet.

## Features

- **Gasless Claims**: Users don't pay any gas fees
- **Secure Authentication**: Signature-based verification
- **Rate Limiting**: Protection against spam and abuse
- **Modern UI**: Professional, responsive design
- **Real-time Stats**: Live tracking of claims and distributions
- **Transaction History**: Full audit trail of all claims
- **MetaMask Integration**: Seamless wallet connection
- **Automatic Network Switching**: Prompts users to switch to Shardeum
- **MongoDB Storage**: Scalable database for eligibility data
- **RESTful API**: Clean, documented endpoints

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Ethers.js v6
- Winston (logging)
- Express Rate Limit
- Helmet (security)
- Joi (validation)

### Frontend
- React 19
- Ethers.js v6
- React Hot Toast (notifications)
- Modern CSS with animations

### Blockchain
- **Network**: Shardeum
- **Chain ID**: 8118
- **RPC URL**: https://api.shardeum.org
- **Explorer**: https://explorer.shardeum.org

## Project Structure

```
gasless-airdrop/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── EligibleUser.js      # User eligibility schema
│   │   └── Transaction.js       # Transaction history schema
│   ├── services/
│   │   └── walletService.js     # Blockchain interaction service
│   ├── middleware/
│   │   ├── validation.js        # Request validation
│   │   ├── rateLimiter.js       # Rate limiting
│   │   └── errorHandler.js      # Error handling
│   ├── routes/
│   │   └── airdrop.js           # API routes
│   ├── scripts/
│   │   └── importCSV.js         # CSV import script
│   ├── utils/
│   │   └── logger.js            # Winston logger
│   ├── .env                     # Environment variables
│   ├── .env.example             # Environment template
│   ├── server.js                # Main server file
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js           # API service
│   │   ├── utils/
│   │   │   └── web3.js          # Web3 utilities
│   │   ├── App.js               # Main component
│   │   ├── App.css              # Styles
│   │   └── index.js             # Entry point
│   ├── .env                     # Environment variables
│   ├── .env.example             # Environment template
│   └── package.json
│
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js v16+ installed
- MongoDB database (local or cloud)
- MetaMask browser extension
- A funded wallet for backend transactions (with SHM tokens)

### Backend Setup

1. **Navigate to backend directory**:
```bash
cd gasless-airdrop/backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:

Edit the `.env` file with your actual values:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://contactnikhil2002_db_user:CZdj9v0NfU8vN24N@test.iphvonu.mongodb.net/?appName=Test

# Shardeum Network Configuration
RPC_URL=https://api.shardeum.org
CHAIN_ID=8118
BLOCK_EXPLORER=https://explorer.shardeum.org

# Backend Wallet (IMPORTANT: Use your actual private key)
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
```

4. **Fund your backend wallet**:

Before running the system, make sure your backend wallet has enough SHM tokens to cover all airdrops + gas fees. You can get the backend wallet address by running:

```bash
node -e "const {ethers} = require('ethers'); console.log(new ethers.Wallet(process.env.PRIVATE_KEY).address)"
```

5. **Import eligible users from CSV**:

```bash
npm run import-csv
```

This will:
- Read the CSV file from `../Overall Leaderboard.csv`
- Calculate token allocations based on XP/Rank
- Import all eligible users into MongoDB
- Display statistics

6. **Start the backend server**:

```bash
npm run dev  # Development mode with auto-reload
# or
npm start    # Production mode
```

The server will start on `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory**:
```bash
cd gasless-airdrop/frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:

The `.env` file is already configured for local development. For production, update:

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_CHAIN_ID=8118
REACT_APP_CHAIN_NAME=Shardeum
REACT_APP_RPC_URL=https://api.shardeum.org
REACT_APP_BLOCK_EXPLORER=https://explorer.shardeum.org
REACT_APP_CURRENCY_SYMBOL=SHM
```

4. **Start the frontend**:

```bash
npm start
```

The app will open at `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### 1. Check Eligibility

**POST** `/check-eligibility`

Check if a wallet address is eligible for the airdrop.

**Request Body**:
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response**:
```json
{
  "success": true,
  "eligible": true,
  "amount": "1000000000000000000000",
  "amountFormatted": "1000.0",
  "xpPoints": 1450,
  "rank": 1,
  "claimed": false,
  "claimDate": null,
  "txHash": null
}
```

#### 2. Claim Airdrop

**POST** `/claim`

Process an airdrop claim (gasless).

**Request Body**:
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Airdrop claimed successfully!",
  "txHash": "0xabc123...",
  "amount": "1000000000000000000000",
  "amountFormatted": "1000.0",
  "blockNumber": 12345,
  "explorerUrl": "https://explorer.shardeum.org/tx/0xabc123..."
}
```

#### 3. Get Claim Status

**GET** `/claim-status/:address`

Get the claim status for a specific address.

**Response**:
```json
{
  "success": true,
  "found": true,
  "claimed": true,
  "claimDate": "2024-01-15T10:30:00.000Z",
  "txHash": "0xabc123...",
  "amount": "1000000000000000000000",
  "amountFormatted": "1000.0",
  "xpPoints": 1450,
  "rank": 1,
  "attempts": 1,
  "lastAttempt": "2024-01-15T10:28:00.000Z"
}
```

#### 4. Get Statistics

**GET** `/stats`

Get overall airdrop statistics.

**Response**:
```json
{
  "success": true,
  "stats": {
    "totalEligible": 11648,
    "totalClaimed": 523,
    "totalUnclaimed": 11125,
    "totalAllocated": 5824000.0,
    "totalDistributed": 261500.0,
    "backendWallet": {
      "address": "0x...",
      "balance": "100000.0"
    },
    "claimPercentage": "4.49"
  }
}
```

#### 5. Get Recent Claims

**GET** `/recent-claims?limit=10`

Get recent claims.

**Response**:
```json
{
  "success": true,
  "claims": [
    {
      "walletAddress": "0x...",
      "amount": "1000.0",
      "claimDate": "2024-01-15T10:30:00.000Z",
      "txHash": "0x...",
      "xpPoints": 1450,
      "rank": 1
    }
  ]
}
```

## Token Allocation Logic

The CSV import script calculates allocations based on rank:

- **Rank 1-100**: 1000 SHM
- **Rank 101-500**: 500 SHM
- **Rank 501-1000**: 250 SHM
- **Rank 1001-5000**: 100 SHM
- **Rank 5001+**: 50 SHM

You can modify this logic in `backend/scripts/importCSV.js` (line 15-35).

## User Flow

1. User visits the frontend application
2. Clicks "Connect Wallet" to connect MetaMask
3. App automatically checks eligibility
4. If eligible and not claimed, displays reward amount
5. User clicks "Claim Airdrop"
6. MetaMask prompts for signature (no gas fee)
7. Frontend sends signature to backend
8. Backend verifies signature and sends tokens (pays gas)
9. User receives tokens and sees confirmation
10. Transaction link displayed for verification

## Security Features

### Backend

- **Signature Verification**: All claims must be signed by the wallet owner
- **Rate Limiting**:
  - General API: 100 requests per 15 minutes
  - Claim endpoint: 5 attempts per 15 minutes
  - Eligibility check: 10 requests per minute
- **Input Validation**: All inputs validated with Joi schemas
- **Address Validation**: Ethereum address format validation
- **Double-claim Prevention**: Database checks before processing
- **Helmet**: Security headers
- **CORS**: Controlled cross-origin access
- **Error Handling**: Comprehensive error catching
- **Logging**: Winston logger for audit trail

### Frontend

- **Signature-based Auth**: Users never share private keys
- **Network Verification**: Checks for correct blockchain network
- **HTTPS**: Use HTTPS in production
- **Input Sanitization**: All user inputs validated

## Troubleshooting

### Backend Issues

**Problem**: "PRIVATE_KEY is not defined"
- **Solution**: Make sure you've added your private key to `.env` file without the `0x` prefix

**Problem**: "Insufficient backend wallet balance"
- **Solution**: Fund your backend wallet with enough SHM to cover all claims + gas

**Problem**: "MongoDB connection failed"
- **Solution**: Check your MongoDB connection string in `.env`

**Problem**: "Port 3001 already in use"
- **Solution**: Change PORT in `.env` or kill the process using port 3001

### Frontend Issues

**Problem**: "MetaMask not detected"
- **Solution**: Install MetaMask browser extension

**Problem**: "Wrong network"
- **Solution**: Click "Switch Network" button or manually add Shardeum network in MetaMask

**Problem**: "API connection failed"
- **Solution**: Make sure backend is running on the correct port

## Deployment

### Backend Deployment (Railway/Heroku)

1. Create new project on Railway/Heroku
2. Connect your Git repository
3. Add environment variables from `.env.example`
4. Deploy
5. Run CSV import script in production
6. Monitor logs for any issues

### Frontend Deployment (Vercel/Netlify)

1. Create new project on Vercel/Netlify
2. Connect your Git repository
3. Set build command: `npm run build`
4. Set publish directory: `build`
5. Add environment variables
6. Deploy

## Monitoring

### Backend Logs

Logs are stored in the `backend/logs` directory:
- `combined.log`: All logs
- `error.log`: Error logs only

### Database Queries

Use MongoDB Compass or CLI to monitor:
- Total eligible users
- Claimed vs unclaimed
- Transaction history
- Failed attempts

## Cost Estimation

### Gas Costs

- **Per Transfer**: ~21,000 gas
- **Gas Price**: Varies by network
- **Example**: For 10,000 claims at 1 Gwei:
  - Total gas: 210,000,000 gas
  - Cost: 0.21 SHM per claim

### Token Costs

Based on the allocation logic and CSV data:
- **Total Tokens Needed**: ~5,824,000 SHM (for 11,648 users)
- **Average per User**: ~500 SHM

## Admin Tasks

### Check Backend Wallet Balance

```bash
curl http://localhost:3001/api/stats
```

### View Recent Claims

```bash
curl http://localhost:3001/api/recent-claims?limit=20
```

### Re-import CSV (Clear and Re-import)

```bash
cd backend
npm run import-csv
```

### Database Backup

```bash
mongodump --uri="your_mongodb_uri" --out=./backup
```

## License

MIT

## Support

For issues or questions:
- Create an issue on GitHub
- Check logs for error details
- Review API documentation

---

**Made with ❤️ for Shardeum Community**
