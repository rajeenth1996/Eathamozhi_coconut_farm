// scripts/migrate-farms-traceability.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let MONGODB_URI = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/MONGODB_URI=(.*)/);
  if (match) MONGODB_URI = match[1].trim();
}

const dbJsonPath = path.join(__dirname, '..', 'src', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));

// 1. Ensure default Farm
if (!db.farms) db.farms = [];
let defaultFarm = db.farms.find(f => f.farmCode === 'ETH-RA-F001');
if (!defaultFarm) {
  defaultFarm = {
    id: 'farm-eth-ra-f001',
    farmCode: 'ETH-RA-F001',
    farmName: 'Eathamozhi Ancestral Heritage Coconut Farm',
    ownerName: 'Rajeenth',
    ownerCode: 'RA',
    locationCode: 'ETH',
    location: 'Eathamozhi, Kanyakumari',
    status: 'Active',
    notes: 'Primary ancestral grove registered since 1938 with proven high-yielding West Coast Tall mother palms.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.farms.unshift(defaultFarm);
  console.log('✅ Created default heritage farm:', defaultFarm.farmCode);
}

// 2. Migrate existing Mother Trees (parentPalms)
if (Array.isArray(db.parentPalms)) {
  db.parentPalms.forEach((p, idx) => {
    const seqNum = String(idx + 1).padStart(3, '0');
    if (!p.motherTreeCode) {
      p.motherTreeCode = `${defaultFarm.farmCode}-MT${seqNum}`;
    }
    if (!p.farmId) p.farmId = defaultFarm.id;
    if (!p.farmCode) p.farmCode = defaultFarm.farmCode;
    if (!p.farmName) p.farmName = defaultFarm.farmName;
    if (!p.variety) p.variety = 'West Coast Tall (Eathamozhi Tall)';
    if (!p.selectionStatus) p.selectionStatus = 'Selected';
    if (!p.verificationStatus) p.verificationStatus = 'Verified';
    if (!p.productionStatus) p.productionStatus = 'Active for Production';
    if (p.isVisible === undefined) p.isVisible = true;
    if (!p.createdAt) p.createdAt = new Date().toISOString();
    if (!p.updatedAt) p.updatedAt = new Date().toISOString();
  });
  console.log(`✅ Updated ${db.parentPalms.length} mother trees with farm links and codes.`);
}

// 3. Migrate Batches & create batch sources + batch inventory
if (!db.batchSources) db.batchSources = [];
if (!db.batchInventory) db.batchInventory = [];

if (Array.isArray(db.batches)) {
  db.batches.forEach((b, bIdx) => {
    if (!b.primaryFarmId) b.primaryFarmId = defaultFarm.id;
    if (!b.primaryFarmCode) b.primaryFarmCode = defaultFarm.farmCode;

    // Parse month/year
    const seeded = new Date(b.seededDate || '2026-01-15');
    const monthNum = seeded.getMonth() + 1;
    const yearNum = seeded.getFullYear();
    b.batchMonth = b.batchMonth || monthNum;
    b.batchYear = b.batchYear || yearNum;
    b.batchNumber = b.batchNumber || (bIdx + 1);

    // Active bookings count
    const activeBookings = (db.bookings || []).filter(
      bk => bk.batchCode && bk.batchCode.toLowerCase() === b.batchCode.toLowerCase() && bk.bookingStatus !== 'Cancelled'
    );
    const bookedQty = activeBookings.reduce((sum, bk) => sum + (bk.quantity || 0), 0);
    const dispatchedQty = (db.bookings || []).filter(
      bk => bk.batchCode && bk.batchCode.toLowerCase() === b.batchCode.toLowerCase() && bk.bookingStatus === 'Dispatched'
    ).reduce((sum, bk) => sum + (bk.quantity || 0), 0);

    const treeCodes = Array.isArray(b.parentPalmCodes) && b.parentPalmCodes.length > 0
      ? b.parentPalmCodes
      : [b.parentPalmCode || 'EM-MP-001'];

    const coconutsPerTree = Math.round((b.totalQuantity || 500) / treeCodes.length);
    let totalBatchCoconuts = 0;

    treeCodes.forEach((tCode, tIdx) => {
      const tree = db.parentPalms.find(p => p.code === tCode || p.motherTreeCode === tCode);
      const treeId = tree ? tree.id : `tree-${tCode}`;
      const treeMotherCode = tree ? tree.motherTreeCode : `${defaultFarm.farmCode}-MT001`;
      const sourceId = `bs-${b.batchCode}-${treeMotherCode}`;

      let source = db.batchSources.find(s => s.id === sourceId || (s.batchCode === b.batchCode && s.motherTreeCode === treeMotherCode));
      if (!source) {
        source = {
          id: sourceId,
          batchId: b.id,
          batchCode: b.batchCode,
          farmId: defaultFarm.id,
          farmCode: defaultFarm.farmCode,
          farmName: defaultFarm.farmName,
          motherTreeId: treeId,
          motherTreeCode: treeMotherCode,
          motherTreeName: tree ? tree.name : tCode,
          coconutQuantity: coconutsPerTree,
          coconutsSown: coconutsPerTree,
          collectionDate: b.harvestDate || '2026-01-05',
          collectionStatus: 'Verified',
          germinatedQuantity: Math.round(coconutsPerTree * 0.95),
          rejectedQuantity: Math.round(coconutsPerTree * 0.05),
          germinationStartDate: b.harvestDate || '2026-01-05',
          germinationEndDate: b.seededDate || '2026-01-15',
          notes: `Heritage seed nuts collected from verified mother palm ${tCode}.`,
          createdAt: b.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.batchSources.push(source);
      }
      totalBatchCoconuts += source.coconutQuantity;

      // Ensure Batch Inventory record
      let inv = db.batchInventory.find(i => i.batchSourceId === source.id);
      const treeShare = 1 / treeCodes.length;
      const treeBooked = Math.round(bookedQty * treeShare);
      const treeDispatched = Math.round(dispatchedQty * treeShare);
      const treeProduced = coconutsPerTree;
      const treeAvailable = Math.max(0, treeProduced - treeBooked - treeDispatched);

      if (!inv) {
        inv = {
          id: `bi-${source.id}`,
          batchId: b.id,
          batchCode: b.batchCode,
          batchSourceId: source.id,
          farmId: defaultFarm.id,
          farmCode: defaultFarm.farmCode,
          motherTreeId: treeId,
          motherTreeCode: treeMotherCode,
          seedlingsProduced: treeProduced,
          availableQuantity: treeAvailable,
          bookedQuantity: treeBooked,
          dispatchedQuantity: treeDispatched,
          damagedQuantity: 0,
          rejectedQuantity: 0,
          updatedAt: new Date().toISOString()
        };
        db.batchInventory.push(inv);
      }
    });

    b.totalCoconuts = totalBatchCoconuts;
    b.totalSeedlings = b.totalQuantity;
  });
  console.log(`✅ Updated ${db.batches.length} batches with sources and inventory records.`);
}

// 4. Update bookings with traceability info if not present
if (Array.isArray(db.bookings)) {
  db.bookings.forEach(bk => {
    if (!bk.sourceFarmCode) bk.sourceFarmCode = defaultFarm.farmCode;
    const batch = db.batches.find(b => b.batchCode.toLowerCase() === bk.batchCode.toLowerCase());
    if (batch && Array.isArray(batch.parentPalmCodes) && batch.parentPalmCodes.length > 1) {
      bk.isMixedSource = true;
    } else {
      bk.isMixedSource = false;
      bk.sourceMotherTreeCode = (batch && batch.parentPalmCodes && batch.parentPalmCodes[0]) || 'EM-MP-001';
    }
  });
  console.log(`✅ Backfilled traceability metadata on ${db.bookings.length} customer bookings.`);
}

// Save back to db.json
fs.writeFileSync(dbJsonPath, JSON.stringify(db, null, 2), 'utf8');
console.log('✅ Updated src/data/db.json successfully.');

// Now sync to MongoDB Atlas if connected
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI).then(async () => {
    console.log('🔌 Connected to MongoDB Atlas for migration sync...');

    const FarmModel = mongoose.models.Farm || mongoose.model('Farm', new mongoose.Schema({}, { strict: false }));
    const MotherTreeModel = mongoose.models.MotherTree || mongoose.model('MotherTree', new mongoose.Schema({}, { strict: false }), 'parentpalms');
    const BatchModel = mongoose.models.Batch || mongoose.model('Batch', new mongoose.Schema({}, { strict: false }));
    const BatchSourceModel = mongoose.models.BatchSource || mongoose.model('BatchSource', new mongoose.Schema({}, { strict: false }), 'batch_sources');
    const BatchInventoryModel = mongoose.models.BatchInventory || mongoose.model('BatchInventory', new mongoose.Schema({}, { strict: false }), 'batch_inventory');
    const CounterModel = mongoose.models.Counter || mongoose.model('Counter', new mongoose.Schema({}, { strict: false }), 'counters');

    // Upsert Farms
    for (const f of db.farms) {
      await FarmModel.updateOne({ farmCode: f.farmCode }, { $set: f }, { upsert: true });
    }
    console.log(`✅ Synced ${db.farms.length} farms to MongoDB Atlas.`);

    // Upsert Mother Trees
    for (const p of db.parentPalms) {
      await MotherTreeModel.updateOne({ code: p.code }, { $set: p }, { upsert: true });
    }
    console.log(`✅ Synced ${db.parentPalms.length} mother trees to MongoDB Atlas.`);

    // Upsert Batches
    for (const b of db.batches) {
      await BatchModel.updateOne({ batchCode: b.batchCode }, { $set: b }, { upsert: true });
    }
    console.log(`✅ Synced ${db.batches.length} batches to MongoDB Atlas.`);

    // Upsert Batch Sources
    for (const s of db.batchSources) {
      await BatchSourceModel.updateOne({ id: s.id }, { $set: s }, { upsert: true });
    }
    console.log(`✅ Synced ${db.batchSources.length} batch sources to MongoDB Atlas.`);

    // Upsert Batch Inventory
    for (const inv of db.batchInventory) {
      await BatchInventoryModel.updateOne({ id: inv.id }, { $set: inv }, { upsert: true });
    }
    console.log(`✅ Synced ${db.batchInventory.length} batch inventory records to MongoDB Atlas.`);

    // Set counter initial state
    await CounterModel.updateOne({ key: 'farm-ETH-RA' }, { $set: { key: 'farm-ETH-RA', seq: 1 } }, { upsert: true });

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  }).catch(err => {
    console.error('❌ MongoDB sync error:', err);
    process.exit(1);
  });
} else {
  console.log('⚠️ No MONGODB_URI found, skipped Atlas sync.');
}
