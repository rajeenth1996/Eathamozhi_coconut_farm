// scripts/migrate-base64-to-cloudinary.js
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing Cloudinary credentials in environment.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

async function migrate() {
  const dbPath = path.join(__dirname, '..', 'src', 'data', 'db.json');
  const rawData = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(rawData);

  let migratedCount = 0;

  async function processValue(val, key, entityName) {
    if (typeof val === 'string' && val.startsWith('data:image/')) {
      console.log(`Uploading base64 image found in ${entityName}.${key}...`);
      try {
        const res = await cloudinary.uploader.upload(val, {
          folder: 'eathamozhy-farm/migrated',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        });
        console.log(` -> Migrated to Cloudinary: ${res.secure_url}`);
        migratedCount++;
        return res.secure_url;
      } catch (err) {
        console.error(` -> Upload error for ${entityName}.${key}:`, err.message);
        return val;
      }
    }
    return val;
  }

  for (const collectionName of Object.keys(db)) {
    const coll = db[collectionName];
    if (Array.isArray(coll)) {
      for (let i = 0; i < coll.length; i++) {
        const item = coll[i];
        const entityLabel = `${collectionName}[${i}] (${item.code || item.id || item.batchCode || 'item'})`;
        for (const [k, v] of Object.entries(item)) {
          if (Array.isArray(v)) {
            for (let j = 0; j < v.length; j++) {
              v[j] = await processValue(v[j], `${k}[${j}]`, entityLabel);
            }
          } else if (typeof v === 'string') {
            item[k] = await processValue(v, k, entityLabel);
          }
        }
      }
    }
  }

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`\nMigration complete! Total base64 images converted to Cloudinary: ${migratedCount}`);
  
  const newSize = fs.statSync(dbPath).size;
  console.log(`Updated db.json size: ${(newSize / 1024).toFixed(1)} KB`);
}

migrate().catch(console.error);
