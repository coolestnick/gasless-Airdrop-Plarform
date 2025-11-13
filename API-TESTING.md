# API Testing Guide

## Testing with cURL

### 1. Health Check

```bash
curl http://localhost:3001/health
```

Expected Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### 2. Check Eligibility

```bash
curl -X POST http://localhost:3001/api/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x93C72384498c6Ff777E5bBF1154edFD2324B47aF"
  }'
```

Expected Response:
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

### 3. Get Statistics

```bash
curl http://localhost:3001/api/stats
```

### 4. Get Recent Claims

```bash
curl http://localhost:3001/api/recent-claims?limit=5
```

### 5. Get Claim Status

```bash
curl http://localhost:3001/api/claim-status/0x93C72384498c6Ff777E5bBF1154edFD2324B47aF
```

## Testing with Postman

### Import Collection

Create a new Postman collection with these requests:

1. **Check Eligibility**
   - Method: POST
   - URL: `http://localhost:3001/api/check-eligibility`
   - Body (JSON):
     ```json
     {
       "walletAddress": "0x93C72384498c6Ff777E5bBF1154edFD2324B47aF"
     }
     ```

2. **Get Stats**
   - Method: GET
   - URL: `http://localhost:3001/api/stats`

3. **Get Recent Claims**
   - Method: GET
   - URL: `http://localhost:3001/api/recent-claims?limit=10`

4. **Get Claim Status**
   - Method: GET
   - URL: `http://localhost:3001/api/claim-status/0x93C72384498c6Ff777E5bBF1154edFD2324B47aF`

## Admin API Testing

### Admin Dashboard

```bash
curl -X GET http://localhost:3001/api/admin/dashboard \
  -H "x-admin-key: your_api_secret_key"
```

### Export Claims

```bash
curl -X GET http://localhost:3001/api/admin/export \
  -H "x-admin-key: your_api_secret_key" \
  -o claims-export.csv
```

### Get Users (Paginated)

```bash
curl -X GET "http://localhost:3001/api/admin/users?page=1&limit=50&claimed=false" \
  -H "x-admin-key: your_api_secret_key"
```

## Testing Rate Limiting

### Test Eligibility Rate Limit (10 requests per minute)

```bash
for i in {1..12}; do
  echo "Request $i:"
  curl -X POST http://localhost:3001/api/check-eligibility \
    -H "Content-Type: application/json" \
    -d '{"walletAddress": "0x93C72384498c6Ff777E5bBF1154edFD2324B47aF"}'
  echo ""
  sleep 1
done
```

You should see rate limit error after 10 requests.

## Testing Frontend Integration

### 1. Connect MetaMask

1. Open `http://localhost:3000`
2. Click "Connect Wallet"
3. Approve in MetaMask
4. Verify wallet address appears in header

### 2. Check Eligibility

1. After connecting, eligibility should auto-check
2. Verify toast notification appears
3. Check if allocation is displayed correctly

### 3. Claim Airdrop (with eligible wallet)

1. Click "Claim Airdrop" button
2. Sign message in MetaMask (no gas required)
3. Wait for backend processing
4. Verify success notification
5. Check transaction on explorer
6. Verify tokens received in wallet

### 4. Test Already Claimed

1. Try claiming again with same wallet
2. Should show "Already Claimed" message
3. Transaction hash should be displayed

### 5. Test Wrong Network

1. Switch MetaMask to different network
2. App should show "Wrong Network" warning
3. Click "Switch Network" button
4. Verify network switches to Shardeum

## Error Testing

### Invalid Wallet Address

```bash
curl -X POST http://localhost:3001/api/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "invalid_address"
  }'
```

Expected: 400 Bad Request with validation error

### Missing Signature

```bash
curl -X POST http://localhost:3001/api/claim \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x93C72384498c6Ff777E5bBF1154edFD2324B47aF"
  }'
```

Expected: 400 Bad Request

### Non-existent Wallet

```bash
curl -X POST http://localhost:3001/api/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x0000000000000000000000000000000000000001"
  }'
```

Expected: Not eligible response

## Performance Testing

### Load Test with Apache Bench

```bash
# Install ab (Apache Bench)
# On macOS: brew install httpd

# Test stats endpoint
ab -n 1000 -c 10 http://localhost:3001/api/stats

# Test check eligibility
ab -n 100 -c 5 -p eligibility.json -T application/json http://localhost:3001/api/check-eligibility
```

Create `eligibility.json`:
```json
{"walletAddress": "0x93C72384498c6Ff777E5bBF1154edFD2324B47aF"}
```

## Database Testing

### MongoDB Queries

```javascript
// Connect to MongoDB
mongosh "your_mongodb_connection_string"

// Use database
use test

// Count eligible users
db.eligibleusers.countDocuments()

// Count claimed
db.eligibleusers.countDocuments({ claimed: true })

// Find top 10 by rank
db.eligibleusers.find().sort({ rank: 1 }).limit(10)

// Find specific wallet
db.eligibleusers.findOne({ walletAddress: "0x93c72384498c6ff777e5bbf1154edfd2324b47af" })

// Get total allocated
db.eligibleusers.aggregate([
  {
    $group: {
      _id: null,
      total: { $sum: { $toDouble: "$allocatedAmount" } }
    }
  }
])

// Check transactions
db.transactions.find().sort({ createdAt: -1 }).limit(10)

// Failed transactions
db.transactions.find({ status: "failed" })
```

## Integration Testing Checklist

- [ ] Backend server starts without errors
- [ ] MongoDB connection successful
- [ ] Wallet service initializes correctly
- [ ] CSV import works and populates database
- [ ] Frontend builds and starts successfully
- [ ] MetaMask connection works
- [ ] Network switching works
- [ ] Eligibility check returns correct data
- [ ] Claim process completes successfully
- [ ] Tokens transfer to user wallet
- [ ] Double claim prevention works
- [ ] Rate limiting functions correctly
- [ ] Error handling works for all endpoints
- [ ] Admin endpoints require authentication
- [ ] Logs are being written correctly
- [ ] Transaction records are saved
- [ ] Statistics are calculated correctly

## Common Test Wallets

From your CSV, these are the top ranked wallets you can test with:

1. `0x93C72384498c6Ff777E5bBF1154edFD2324B47aF` - Rank 1, 1450 XP
2. `0x95553b5e83D712bf79DD47e60e14b0072E532982` - Rank 2, 1450 XP
3. `0x8ddDB93CE4420f410Fd05F2F727228c5926Da6D1` - Rank 3, 1450 XP
4. `0x08e748d7907CD2aDaeD2600a644A6a69406ED47d` - Rank 4, 1450 XP
5. `0x4ff6ee00bBd3252773cE98884D601245bD71cb9E` - Rank 5, 1450 XP

## Monitoring During Testing

### Backend Logs

```bash
# Watch logs in real-time
tail -f backend/logs/combined.log

# Watch errors only
tail -f backend/logs/error.log
```

### Database Monitoring

```bash
# Watch database changes
watch -n 2 'mongosh "your_connection_string" --quiet --eval "db.eligibleusers.countDocuments({claimed: true})"'
```

### Network Monitoring

```bash
# Monitor backend
curl -s http://localhost:3001/api/stats | jq

# Watch stats update
watch -n 5 'curl -s http://localhost:3001/api/stats | jq ".stats"'
```

## Troubleshooting Tests

### Backend Not Starting

1. Check MongoDB connection
2. Verify private key in .env
3. Check port 3001 is available
4. Review logs for errors

### Frontend Not Loading

1. Check backend is running
2. Verify .env has correct API_URL
3. Check browser console for errors
4. Clear browser cache

### Claims Failing

1. Check backend wallet has sufficient balance
2. Verify network is correct (Shardeum)
3. Check signature is valid
4. Review backend logs for errors
5. Ensure wallet is in eligible list

### Rate Limit Issues

1. Wait for rate limit window to reset
2. Test from different IP
3. Adjust rate limits in .env if needed

---

**Happy Testing! 🧪**
