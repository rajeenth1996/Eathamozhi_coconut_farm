// scripts/seed-mongodb.ts
// Run with: npx ts-node --skipProject scripts/seed-mongodb.ts
//
// This script reads your existing src/data/db.json and inserts all data
// into your MongoDB Atlas database. Run it ONCE after setting MONGODB_URI.

import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';

// ── Load env manually (no Next.js dotenv here) ────────────────────────────────
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = val;
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// ── Inline Schemas (avoid import path issues in script context) ───────────────
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

// ── Load db.json ──────────────────────────────────────────────────────────────
const dbJsonPath = path.join(process.cwd(), 'src', 'data', 'db.json');
if (!fs.existsSync(dbJsonPath)) {
  console.error('❌ src/data/db.json not found');
  process.exit(1);
}
const db = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));

// ── Seed Function ─────────────────────────────────────────────────────────────
async function seed() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI!);
  console.log('✅ Connected\n');

  // Helper: upsert array of docs by unique field
  async function upsertAll(Model: any, docs: any[], uniqueKey: string, label: string) {
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

  // Ensure id field exists on all records
  const parentPalms = (db.parentPalms || []).map((p: any, i: number) => ({
    ...p,
    id: p.id || `mp-${i + 1}`,
    parentPalmCodes: p.parentPalmCodes || [p.parentPalmCode || 'EM-MP-001']
  }));
  const batches = (db.batches || []).map((b: any, i: number) => ({
    ...b,
    id: b.id || `b-${i + 1}`,
    parentPalmCodes: b.parentPalmCodes || [b.parentPalmCode || 'EM-MP-001']
  }));
  const bookings   = (db.bookings   || []).map((b: any, i: number) => ({ ...b, id: b.id || `bk-${i + 1}` }));
  const reviews    = (db.reviews    || []).map((r: any, i: number) => ({ ...r, id: r.id || `rev-${i + 1}` }));
  const faqs       = (db.faqs       || []).map((f: any, i: number) => ({ ...f, id: f.id || `faq-${i + 1}` }));
  const enquiries  = (db.enquiries  || []).map((e: any, i: number) => ({ ...e, id: e.id || `enq-${i + 1}` }));
  const adjustments = (db.adjustments || []).map((a: any, i: number) => ({ ...a, id: a.id || `adj-${i + 1}` }));

  await upsertAll(ParentPalmModel, parentPalms,  'code',      'ParentPalms');
  await upsertAll(BatchModel,      batches,       'batchCode', 'Batches');
  await upsertAll(BookingModel,    bookings,      'bookingId', 'Bookings');
  await upsertAll(ReviewModel,     reviews,       'id',        'Reviews');
  await upsertAll(FAQModel,        faqs,          'id',        'FAQs');
  await upsertAll(EnquiryModel,    enquiries,     'id',        'Enquiries');
  await upsertAll(AdjModel,        adjustments,   'id',        'InventoryAdjustments');

  console.log('🎉 Seed complete! All data is now in MongoDB Atlas.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
