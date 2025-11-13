require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { ethers } = require('ethers');
const mongoose = require('mongoose');
const EligibleUser = require('../models/EligibleUser');
const logger = require('../utils/logger');

// CSV file path
const CSV_FILE_PATH = path.join(__dirname, '../../../Overall Leaderboard.csv');

// Token allocation calculation
// You can modify this function based on your tokenomics
function calculateAllocation(xpPoints, rank) {
  // Example allocation logic:
  // - Top 100: 1000 SHM
  // - Rank 101-500: 500 SHM
  // - Rank 501-1000: 250 SHM
  // - Rank 1001-5000: 100 SHM
  // - Others: 50 SHM

  let amount;

  if (rank <= 100) {
    amount = '1000';
  } else if (rank <= 500) {
    amount = '500';
  } else if (rank <= 1000) {
    amount = '250';
  } else if (rank <= 5000) {
    amount = '100';
  } else {
    amount = '50';
  }

  // Convert to wei (SHM has 18 decimals like ETH)
  return ethers.parseEther(amount).toString();
}

async function importCSV() {
  try {
    console.log('🚀 Starting CSV import process...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Check if file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`CSV file not found at: ${CSV_FILE_PATH}`);
    }

    console.log(`📁 Reading CSV from: ${CSV_FILE_PATH}\n`);

    const users = [];
    let processedCount = 0;
    let errorCount = 0;

    // Read and parse CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', (row) => {
          try {
            // Validate wallet address
            const wallet = row.Wallet?.trim();
            if (!wallet || !ethers.isAddress(wallet)) {
              console.warn(`⚠️  Invalid address: ${wallet}`);
              errorCount++;
              return;
            }

            const xpPoints = parseInt(row.XP) || 0;
            const rank = parseInt(row.Rank) || 0;
            const allocatedAmount = calculateAllocation(xpPoints, rank);

            users.push({
              walletAddress: wallet.toLowerCase(),
              allocatedAmount,
              xpPoints,
              rank,
              claimed: false
            });

            processedCount++;

            // Log progress every 1000 records
            if (processedCount % 1000 === 0) {
              console.log(`📊 Processed ${processedCount} records...`);
            }
          } catch (error) {
            console.error(`Error processing row:`, row, error.message);
            errorCount++;
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`\n✅ CSV parsing complete!`);
    console.log(`   - Total processed: ${processedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`\n💾 Importing to database...\n`);

    // Clear existing data (optional - comment out if you want to keep existing data)
    const existingCount = await EligibleUser.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing records`);
      console.log('🗑️  Clearing existing data...');
      await EligibleUser.deleteMany({});
      console.log('✅ Existing data cleared\n');
    }

    // Insert in batches to avoid memory issues
    const BATCH_SIZE = 1000;
    let imported = 0;

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      try {
        await EligibleUser.insertMany(batch, { ordered: false });
        imported += batch.length;
        console.log(`✅ Imported batch: ${imported}/${users.length}`);
      } catch (error) {
        // Handle duplicate key errors
        if (error.code === 11000) {
          console.warn(`⚠️  Some duplicates found in batch, skipping...`);
          imported += batch.length;
        } else {
          throw error;
        }
      }
    }

    console.log(`\n🎉 Import complete!`);
    console.log(`   - Total imported: ${imported}`);
    console.log(`   - Total eligible users: ${await EligibleUser.countDocuments()}`);

    // Calculate total allocation
    const stats = await EligibleUser.getStats();
    console.log(`\n📊 Statistics:`);
    console.log(`   - Total Eligible: ${stats.totalEligible}`);
    console.log(`   - Total Allocated: ${ethers.formatEther(stats.totalAllocated.toString())} SHM`);
    console.log(`   - Total Claimed: ${stats.totalClaimed}`);
    console.log(`   - Total Unclaimed: ${stats.totalUnclaimed}`);

    // Sample some records
    console.log(`\n📋 Sample Records:`);
    const samples = await EligibleUser.find().limit(5);
    samples.forEach(user => {
      console.log(`   - ${user.walletAddress}: ${ethers.formatEther(user.allocatedAmount)} SHM (Rank: ${user.rank}, XP: ${user.xpPoints})`);
    });

    console.log('\n✨ CSV import completed successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error importing CSV:', error);
    process.exit(1);
  }
}

// Run import
importCSV();
