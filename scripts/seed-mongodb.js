// scripts/seed-mongodb.js
// Run directly with: node --env-file=.env.local scripts/seed-mongodb.js
const fs = require('fs');
const path = require('path');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI || MONGODB_URI.includes('<username>') || MONGODB_URI.includes('<password>') || MONGODB_URI.includes('xxxxx')) {
  console.error('❌ MONGODB_URI in .env.local is missing or contains placeholder values (<username>, <password>).');
  console.error('Please update .env.local with your real MongoDB Atlas connection string and try again.');
  process.exit(1);
}

const { Schema, model, models } = mongoose;

const ParentPalmSchema = new Schema({ id: String, code: String, name: String, age: Number, location: String, healthStatus: String, yieldHistory: String, description: String, nutCharacteristics: String, whySelected: String, images: [String] });
const BatchSchema = new Schema({ id: String, batchCode: String, parentPalmId: String, parentPalmCode: String, parentPalmCodes: [String], name: String, harvestDate: String, seededDate: String, totalQuantity: Number, bookedQuantity: Number, inventoryAdjustments: Number, price: Number, status: String, description: String, viewsCount: Number, images: [String] });
const BookingSchema = new Schema({ id: String, bookingId: String, batchCode: String, customerName: String, mobile: String, whatsapp: String, address: String, district: String, state: String, pinCode: String, email: String, farmLocation: String, specialInstructions: String, expectedDeliveryDate: String, deliveryService: String, nearestHub: String, quantity: Number, subtotal: Number, deliveryCharge: Number, totalAmount: Number, paymentStatus: String, bookingStatus: String, paymentScreenshotUrl: String, receiptUrl: String, courierName: String, trackingId: String, dispatchDate: String, createdAt: String });
const ReviewSchema = new Schema({ id: String, customerName: String, location: String, batchCode: String, quantity: Number, rating: Number, comment: String, verified: Boolean, date: String });
const FAQSchema = new Schema({ id: String, question: String, answer: String, category: String });
const EnquirySchema = new Schema({ id: String, name: String, mobile: String, location: String, message: String, status: String, createdAt: String });
const AdjSchema = new Schema({ id: String, batchCode: String, quantityChange: Number, reason: String, adminName: String, createdAt: String });

const ParentPalmModel  = models.ParentPalm  || model('ParentPalm',  ParentPalmSchema);
const BatchModel       = models.Batch       || model('Batch',       BatchSchema);
const BookingModel     = models.Booking     || model('Booking',     BookingSchema);
const ReviewModel      = models.Review      || model('Review',      ReviewSchema);
const FAQModel         = models.FAQ         || model('FAQ',         FAQSchema);
const EnquiryModel     = models.Enquiry     || model('Enquiry',     EnquirySchema);
const AdjModel         = models.InventoryAdjustment || model('InventoryAdjustment', AdjSchema);

async function seed() {
  console.log('🔌 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected successfully to cluster:', mongoose.connection.host);
  console.log('📁 Target database:', mongoose.connection.name, '\n');

  const dbJsonPath = path.join(__dirname, '..', 'src', 'data', 'db.json');
  if (!fs.existsSync(dbJsonPath)) {
    console.error('❌ src/data/db.json not found');
    process.exit(1);
  }
  const db = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));

  async function upsertAll(Model, docs, uniqueKey, label) {
    console.log(`📦 Seeding ${label} (${docs.length} records)...`);
    let inserted = 0, updated = 0;
    for (const doc of docs) {
      if (!doc[uniqueKey]) continue;
      const filter = { [uniqueKey]: doc[uniqueKey] };
      const result = await Model.updateOne(filter, { $set: doc }, { upsert: true });
      if (result.upsertedCount) inserted++;
      else updated++;
    }
    console.log(`   ✅ ${inserted} inserted, ${updated} updated\n`);
  }

  const parentPalms = (db.parentPalms || []).map((p, i) => ({
    ...p,
    id: p.id || `mp-${i + 1}`,
    parentPalmCodes: p.parentPalmCodes || [p.parentPalmCode || 'EM-MP-001']
  }));
  const batches = (db.batches || []).map((b, i) => ({
    ...b,
    id: b.id || `b-${i + 1}`,
    parentPalmCodes: b.parentPalmCodes || [b.parentPalmCode || 'EM-MP-001']
  }));
  const bookings    = (db.bookings    || []).map((b, i) => ({ ...b, id: b.id || `bk-${i + 1}` }));
  const reviews     = (db.reviews     || []).map((r, i) => ({ ...r, id: r.id || `rev-${i + 1}` }));
  const faqs        = (db.faqs        || []).map((f, i) => ({ ...f, id: f.id || `faq-${i + 1}` }));
  const enquiries   = (db.enquiries   || []).map((e, i) => ({ ...e, id: e.id || `enq-${i + 1}` }));
  const adjustments = (db.adjustments || []).map((a, i) => ({ ...a, id: a.id || `adj-${i + 1}` }));

  await upsertAll(ParentPalmModel, parentPalms,  'code',      'ParentPalms');
  await upsertAll(BatchModel,      batches,       'batchCode', 'Batches');
  await upsertAll(BookingModel,    bookings,      'bookingId', 'Bookings');
  await upsertAll(ReviewModel,     reviews,       'id',        'Reviews');
  await upsertAll(FAQModel,        faqs,          'id',        'FAQs');
  await upsertAll(EnquiryModel,    enquiries,     'id',        'Enquiries');
  await upsertAll(AdjModel,        adjustments,   'id',        'InventoryAdjustments');

  console.log('🎉 Seed complete! All production data is now live in MongoDB Atlas.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
