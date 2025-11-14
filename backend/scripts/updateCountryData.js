require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const EligibleUser = require('../models/EligibleUser');
const { getCountryFromIP } = require('../utils/ipGeolocation');
const logger = require('../utils/logger');

/**
 * Script to update country data for existing users
 * Processes users with missing or "Local/Private" country data
 */
async function updateCountryData() {
  try {
    // Connect to database
    await connectDB();
    logger.info('✅ Database connected');

    // Find all users with IP address but missing or Local/Private country
    const usersToUpdate = await EligibleUser.find({
      ipAddress: { $exists: true, $ne: null, $ne: '' },
      $or: [
        { country: { $exists: false } },
        { country: null },
        { country: '' },
        { country: 'Local/Private' },
        { country: 'Unknown' }
      ]
    });

    logger.info(`Found ${usersToUpdate.length} users to update`);

    if (usersToUpdate.length === 0) {
      logger.info('No users need updating. Exiting.');
      process.exit(0);
    }

    let updated = 0;
    let failed = 0;
    let skipped = 0;

    // Process users in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < usersToUpdate.length; i += batchSize) {
      const batch = usersToUpdate.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (user) => {
          try {
            // Skip if IP is still private/localhost
            if (!user.ipAddress || user.ipAddress === '::1' || user.ipAddress === '127.0.0.1') {
              skipped++;
              logger.info(`Skipping ${user.walletAddress}: Private IP (${user.ipAddress})`);
              return;
            }

            logger.info(`Processing ${user.walletAddress} with IP: ${user.ipAddress}`);
            
            // Get country from IP
            const country = await getCountryFromIP(user.ipAddress);
            
            if (country && country !== 'Local/Private' && country !== 'Unknown') {
              user.country = country;
              await user.save();
              updated++;
              logger.info(`✅ Updated ${user.walletAddress}: ${country}`);
            } else {
              failed++;
              logger.warn(`⚠️  Could not determine country for ${user.walletAddress} (IP: ${user.ipAddress})`);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            failed++;
            logger.error(`❌ Error updating ${user.walletAddress}:`, error.message);
          }
        })
      );

      // Longer delay between batches
      if (i + batchSize < usersToUpdate.length) {
        logger.info(`Processed batch ${Math.floor(i / batchSize) + 1}. Waiting 2 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    logger.info('\n📊 Update Summary:');
    logger.info(`✅ Successfully updated: ${updated}`);
    logger.info(`⚠️  Failed/Unknown: ${failed}`);
    logger.info(`⏭️  Skipped (private IP): ${skipped}`);
    logger.info(`📝 Total processed: ${usersToUpdate.length}`);

    process.exit(0);
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
updateCountryData();

