import mongoose, { Schema, model, models } from 'mongoose';

// ─── ParentPalm ──────────────────────────────────────────────────────────────
const ParentPalmSchema = new Schema({
  id:           { type: String, required: true, unique: true },
  code:         { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  age:          { type: Number, required: true },
  location:     { type: String, required: true },
  healthStatus: { type: String, required: true },
  yieldHistory: { type: String, required: true },
  description:  { type: String, required: true },
  nutCharacteristics: { type: String, required: true },
  whySelected:  { type: String, required: true },
  images:       [String],
  isVisible:    { type: Boolean, default: true },
}, { timestamps: false });

// ─── Batch ────────────────────────────────────────────────────────────────────
const BatchSchema = new Schema({
  id:               { type: String, required: true, unique: true },
  batchCode:        { type: String, required: true, unique: true },
  parentPalmId:     { type: String, required: true },
  parentPalmCode:   { type: String, required: true },
  parentPalmCodes:  [String],
  name:             { type: String, required: true },
  harvestDate:      { type: String, required: true },
  seededDate:       { type: String, required: true },
  age:              String,
  height:           String,
  totalQuantity:    { type: Number, required: true },
  bookedQuantity:   { type: Number, default: 0 },
  inventoryAdjustments: { type: Number, default: 0 },
  price:            { type: Number, required: true },
  status:           { type: String, enum: ['AVAILABLE', 'LIMITED', 'SOLD_OUT', 'COMING_SOON'], default: 'AVAILABLE' },
  description:      String,
  viewsCount:       { type: Number, default: 0 },
  images:           [String],
  isVisible:        { type: Boolean, default: true },
}, { timestamps: false });

// ─── InventoryAdjustment ──────────────────────────────────────────────────────
const InventoryAdjustmentSchema = new Schema({
  id:             { type: String, required: true, unique: true },
  batchCode:      { type: String, required: true },
  quantityChange: { type: Number, required: true },
  reason:         { type: String, required: true },
  adminName:      { type: String, required: true },
  createdAt:      { type: String, required: true },
}, { timestamps: false });

// ─── Booking ──────────────────────────────────────────────────────────────────
const BookingSchema = new Schema({
  id:                    { type: String, required: true, unique: true },
  bookingId:             { type: String, required: true, unique: true },
  batchCode:             { type: String, required: true },
  customerName:          { type: String, required: true },
  mobile:                { type: String, required: true },
  whatsapp:              { type: String, required: true },
  address:               { type: String, required: true },
  district:              { type: String, required: true },
  state:                 { type: String, required: true },
  pinCode:               { type: String, required: true },
  email:                 String,
  farmLocation:          String,
  specialInstructions:   String,
  expectedDeliveryDate:  String,
  deliveryService:       String,
  nearestHub:            String,
  quantity:              { type: Number, required: true },
  subtotal:              { type: Number, required: true },
  deliveryCharge:        { type: Number, required: true },
  totalAmount:           { type: Number, required: true },
  orderType:             { type: String, enum: ['COMPLETE', 'PRE_ORDER'], default: 'COMPLETE' },
  isPreOrder:            { type: Boolean, default: false },
  paidAmount:            Number,
  advancePaid:           Number,
  balanceAmount:         Number,
  paymentStatus:         { type: String, enum: ['PAID', 'PENDING_VERIFICATION', 'FAILED'], default: 'PENDING_VERIFICATION' },
  bookingStatus:         { type: String, enum: ['Pre-order', 'Payment review', 'Confirmed', 'Preparing', 'Packed', 'Dispatched', 'Delivered', 'Cancelled'], default: 'Payment review' },
  paymentScreenshotUrl:  String,
  receiptUrl:            String,
  courierName:           String,
  trackingId:            String,
  dispatchDate:          String,
  createdAt:             { type: String, required: true },
}, { timestamps: false });

// ─── Review ───────────────────────────────────────────────────────────────────
const ReviewSchema = new Schema({
  id:           { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  location:     { type: String, required: true },
  batchCode:    { type: String, required: true },
  quantity:     { type: Number, required: true },
  rating:       { type: Number, required: true, min: 1, max: 5 },
  comment:      { type: String, required: true },
  verified:     { type: Boolean, default: true },
  date:         { type: String, required: true },
}, { timestamps: false });

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQSchema = new Schema({
  id:       { type: String, required: true, unique: true },
  question: { type: String, required: true },
  answer:   { type: String, required: true },
  category: { type: String, required: true },
}, { timestamps: false });

// ─── Enquiry ──────────────────────────────────────────────────────────────────
const EnquirySchema = new Schema({
  id:        { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  mobile:    { type: String, required: true },
  location:  String,
  message:   { type: String, required: true },
  status:    { type: String, enum: ['NEW', 'CONTACTED', 'RESOLVED'], default: 'NEW' },
  createdAt: { type: String, required: true },
}, { timestamps: false });

// ─── Analytics PageView ────────────────────────────────────────────────────────
const PageViewSchema = new Schema({
  id:             { type: String, required: true, unique: true },
  sessionId:      { type: String, required: true, index: true },
  path:           { type: String, required: true, index: true },
  title:          String,
  referrer:       String,
  referrerSource: { type: String, default: 'Direct / Bookmark' },
  device:         { type: String, enum: ['mobile', 'tablet', 'desktop'], default: 'desktop' },
  screenSize:     String,
  timestamp:      { type: String, required: true, index: true },
}, { timestamps: false });

// ─── Analytics VisitorJourney ──────────────────────────────────────────────────
const VisitorJourneySchema = new Schema({
  sessionId:        { type: String, required: true, unique: true },
  startedAt:        { type: String, required: true },
  lastActiveAt:     { type: String, required: true },
  device:           { type: String, default: 'desktop' },
  referrerSource:   { type: String, default: 'Direct / Bookmark' },
  pathCount:        { type: Number, default: 1 },
  steps:            [String],
  convertedToOrder: { type: Boolean, default: false },
  orderId:          String,
}, { timestamps: false });

// ─── SiteSettings ──────────────────────────────────────────────────────────────
const SiteSettingsSchema = new Schema({
  id:                        { type: String, required: true, unique: true, default: 'site_settings' },
  showBatchesOnMainPage:     { type: Boolean, default: true },
  showMotherTreesOnMainPage: { type: Boolean, default: true },
}, { timestamps: true });

// Export models (use existing model if already compiled — important for Next.js hot-reload)
export const ParentPalmModel  = models.ParentPalm  || model('ParentPalm',  ParentPalmSchema);
export const BatchModel       = models.Batch       || model('Batch',       BatchSchema);
export const BookingModel     = models.Booking     || model('Booking',     BookingSchema);
export const ReviewModel      = models.Review      || model('Review',      ReviewSchema);
export const FAQModel         = models.FAQ         || model('FAQ',         FAQSchema);
export const EnquiryModel     = models.Enquiry     || model('Enquiry',     EnquirySchema);
export const InventoryAdjustmentModel = models.InventoryAdjustment || model('InventoryAdjustment', InventoryAdjustmentSchema);
export const PageViewModel    = models.PageView    || model('PageView',    PageViewSchema);
export const VisitorJourneyModel = models.VisitorJourney || model('VisitorJourney', VisitorJourneySchema);
export const SiteSettingsModel = models.SiteSettings || model('SiteSettings', SiteSettingsSchema);


