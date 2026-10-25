// scripts/reset-all-data.js
// Clears all batches, mother trees, bookings, enquiries, reviews, adjustments, and visitor analytics
// from both MongoDB Atlas and src/data/db.json
const fs = require('fs');
const path = require('path');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const mongoose = require('mongoose');

// Read .env.local manually if not passed via --env-file
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

async function resetAllData() {
  console.log('🧹 --- STARTING COMPLETE DATA RESET ---');

  // 1. Purge MongoDB Atlas Collections if configured
  if (MONGODB_URI && !MONGODB_URI.includes('<username>') && !MONGODB_URI.includes('xxxxx')) {
    try {
      console.log('🔌 Connecting to MongoDB Atlas...');
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
      console.log('✅ Connected to MongoDB Atlas:', mongoose.connection.host);

      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const collNames = collections.map(c => c.name);
      console.log('Existing collections:', collNames);

      const collectionsToPurge = [
        'parentpalms',
        'batches',
        'bookings',
        'enquiries',
        'reviews',
        'inventoryadjustments',
        'pageviews',
        'visitorjourneys'
      ];

      for (const coll of collectionsToPurge) {
        if (collNames.includes(coll)) {
          const count = await db.collection(coll).countDocuments();
          await db.collection(coll).deleteMany({});
          console.log(`   🗑️ Purged ${coll} (${count} documents removed)`);
        }
      }

      await mongoose.disconnect();
      console.log('✅ MongoDB Atlas purge complete.\n');
    } catch (err) {
      console.warn('⚠️ MongoDB Atlas cleanup warning (will still clear local db.json):', err.message);
    }
  } else {
    console.log('ℹ️ No valid MONGODB_URI found, skipping cloud DB purge.');
  }

  // 2. Reset src/data/db.json
  const dbJsonPath = path.join(__dirname, '..', 'src', 'data', 'db.json');
  let faqs = [];
  if (fs.existsSync(dbJsonPath)) {
    try {
      const current = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));
      if (Array.isArray(current.faqs)) {
        faqs = current.faqs;
      }
    } catch {}
  }

  const cleanDb = {
    parentPalms: [],
    batches: [],
    bookings: [],
    adjustments: [],
    enquiries: [],
    reviews: [],
    faqs: faqs,
    pageViews: [],
    visitorJourneys: []
  };

  fs.writeFileSync(dbJsonPath, JSON.stringify(cleanDb, null, 2), 'utf-8');
  console.log(`✅ Cleared ${dbJsonPath} (parentPalms, batches, bookings, enquiries, reviews, adjustments, analytics set to empty arrays)`);

  // 3. Remove /tmp/coconut_db.json if it exists
  const tmpPath = path.join('/tmp', 'coconut_db.json');
  try {
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
      console.log(`✅ Removed ${tmpPath}`);
    }
  } catch {}

  console.log('✨ Data reset completed successfully!');
}

resetAllData().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error resetting data:', err);
  process.exit(1);
});
