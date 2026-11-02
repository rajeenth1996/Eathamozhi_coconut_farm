import mongoose, { Schema, model, models } from 'mongoose';

// ─── Farm ─────────────────────────────────────────────────────────────────────
const FarmSchema = new Schema({
  id:           { type: String, required: true, unique: true },
  farmCode:     { type: String, required: true, unique: true, index: true },
  farmName:     { type: String, required: true },
  ownerName:    { type: String, required: true },
  ownerCode:    { type: String, required: true },
  locationCode: { type: String, required: true },
  location:     { type: String, required: true },
  status:       { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
  notes:        { type: String, default: '' },
  createdAt:    { type: String, default: () => new Date().toISOString() },
  updatedAt:    { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });

// ─── MotherTree / ParentPalm ──────────────────────────────────────────────────
const MotherTreeSchema = new Schema({
  id:                 { type: String, required: true, unique: true },
  motherTreeCode:     { type: String, required: true, unique: true, index: true },
  code:               { type: String, required: true, unique: true, index: true }, // Legacy alias
  farmId:             { type: String, required: true, index: true },
  farmCode:           { type: String, required: true, index: true },
  farmName:           { type: String, default: '' },
  name:               { type: String, required: true },
  variety:            { type: String, default: 'West Coast Tall (Eathamozhi Tall)' },
  age:                { type: Schema.Types.Mixed, required: true },
  location:           { type: String, default: 'Heritage Grove' },
  healthStatus:       { type: String, default: 'Excellent' },
  yieldHistory:       { type: String, default: '' },
  description:        { type: String, default: '' },
  nutCharacteristics: { type: String, default: '' },
  whySelected:        { type: String, default: '' },
  images:             [String],
  selectionStatus:    { type: String, enum: ['Selected', 'Registered'], default: 'Selected', index: true },
  verificationStatus: { type: String, enum: ['Verified', 'Pending'], default: 'Verified', index: true },
  productionStatus:   { type: String, enum: ['Active for Production', 'Inactive', 'Retired'], default: 'Active for Production', index: true },
  notes:              { type: String, default: '' },
  isVisible:          { type: Boolean, default: true, index: true },
  createdAt:          { type: String, default: () => new Date().toISOString() },
  updatedAt:          { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });

// ─── Batch ────────────────────────────────────────────────────────────────────
const BatchSchema = new Schema({
  id:                   { type: String, required: true, unique: true },
  batchCode:            { type: String, required: true, unique: true, index: true },
  primaryFarmId:        { type: String, index: true },
  primaryFarmCode:      { type: String, index: true },
  batchMonth:           { type: Number },
  batchYear:            { type: Number },
  batchNumber:          { type: Number },
  totalCoconuts:        { type: Number, default: 0 },
  totalSeedlings:       { type: Number, default: 0 },
  parentPalmId:         { type: String, default: '' },
  parentPalmCode:       { type: String, default: '' },
  parentPalmCodes:      [String],
  name:                 { type: String, required: true },
  harvestDate:          { type: String, required: true },
  seededDate:           { type: String, required: true },
  age:                  String,
  height:               String,
  totalQuantity:        { type: Number, required: true },
  bookedQuantity:       { type: Number, default: 0 },
  inventoryAdjustments: { type: Number, default: 0 },
  price:                { type: Number, required: true },
  status:               { type: String, enum: ['AVAILABLE', 'LIMITED', 'SOLD_OUT', 'COMING_SOON'], default: 'AVAILABLE', index: true },
  description:          String,
  viewsCount:           { type: Number, default: 0 },
  images:               [String],
  isVisible:            { type: Boolean, default: true, index: true },
  createdAt:            { type: String, default: () => new Date().toISOString() },
  updatedAt:            { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });

// ─── BatchSource ──────────────────────────────────────────────────────────────
const BatchSourceSchema = new Schema({
  id:                   { type: String, required: true, unique: true },
  batchId:              { type: String, required: true, index: true },
  batchCode:            { type: String, required: true, index: true },
  farmId:               { type: String, required: true, index: true },
  farmCode:             { type: String, required: true, index: true },
  farmName:             { type: String, default: '' },
  motherTreeId:         { type: String, required: true, index: true },
  motherTreeCode:       { type: String, required: true, index: true },
  coconutQuantity:      { type: Number, required: true, default: 0 },
  coconutsSown:         { type: Number, default: 0 },
  collectionDate:       { type: String, required: true },
  collectionStatus:     { type: String, enum: ['Collected', 'Verified', 'Pending', 'Rejected'], default: 'Collected', index: true },
  germinatedQuantity:   { type: Number, default: 0 },
  rejectedQuantity:     { type: Number, default: 0 },
  germinationStartDate: { type: String },
  germinationEndDate:   { type: String },
  notes:                { type: String, default: '' },
  createdAt:            { type: String, default: () => new Date().toISOString() },
  updatedAt:            { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });
BatchSourceSchema.index({ batchId: 1, farmId: 1, motherTreeId: 1 });

// ─── BatchInventory ───────────────────────────────────────────────────────────
const BatchInventorySchema = new Schema({
  id:                 { type: String, required: true, unique: true },
  batchId:            { type: String, required: true, index: true },
  batchCode:          { type: String, required: true, index: true },
  batchSourceId:      { type: String, required: true, unique: true, index: true },
  farmId:             { type: String, required: true, index: true },
  farmCode:           { type: String, required: true, index: true },
  motherTreeId:       { type: String, required: true, index: true },
  motherTreeCode:     { type: String, required: true, index: true },
  seedlingsProduced:  { type: Number, default: 0 },
  availableQuantity:  { type: Number, default: 0 },
  bookedQuantity:     { type: Number, default: 0 },
  dispatchedQuantity: { type: Number, default: 0 },
  damagedQuantity:    { type: Number, default: 0 },
  rejectedQuantity:   { type: Number, default: 0 },
  updatedAt:          { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });

// ─── Counter for Atomic Sequencing ────────────────────────────────────────────
const CounterSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  seq: { type: Number, default: 0 },
}, { timestamps: false });

// ─── InventoryAdjustment ──────────────────────────────────────────────────────
const InventoryAdjustmentSchema = new Schema({
  id:             { type: String, required: true, unique: true },
  batchCode:      { type: String, required: true, index: true },
  quantityChange: { type: Number, required: true },
  reason:         { type: String, required: true },
  adminName:      { type: String, required: true },
  createdAt:      { type: String, required: true },
}, { timestamps: false });

// ─── Booking ──────────────────────────────────────────────────────────────────
const BookingSchema = new Schema({
  id:                    { type: String, required: true, unique: true },
  bookingId:             { type: String, required: true, unique: true, index: true },
  batchCode:             { type: String, required: true, index: true },
  customerName:          { type: String, required: true },
  mobile:                { type: String, required: true, index: true },
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
  bookingStatus:         { type: String, enum: ['Pre-order', 'Payment review', 'Confirmed', 'Preparing', 'Packed', 'Dispatched', 'Delivered', 'Cancelled'], default: 'Payment review', index: true },
  paymentScreenshotUrl:  String,
  receiptUrl:            String,
  courierName:           String,
  trackingId:            String,
  dispatchDate:          String,
  createdAt:             { type: String, required: true },
  // Traceability & allocations
  allocations:           [
    {
      batchSourceId:  String,
      farmId:         String,
      farmCode:       String,
      motherTreeId:   String,
      motherTreeCode: String,
      quantity:       Number,
    }
  ],
  sourceFarmCode:        String,
  sourceMotherTreeCode:  String,
  isMixedSource:         { type: Boolean, default: false },
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

// ─── BatchView ───────────────────────────────────────────────────────────────
const BatchViewSchema = new Schema({
  id:           { type: String, required: true, unique: true },
  batchCode:    { type: String, required: true, index: true },
  visitorId:    { type: String, required: true, index: true },
  firstViewedAt:{ type: String, default: () => new Date().toISOString() },
  lastViewedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });
BatchViewSchema.index({ batchCode: 1, visitorId: 1 }, { unique: true });

// ─── InstagramPost ───────────────────────────────────────────────────────────
const InstagramPostSchema = new Schema({
  id:           { type: String, required: true, unique: true },
  title:        { type: String, required: true },
  url:          { type: String, required: true },
  order:        { type: Number, default: 0 },
  isVisible:    { type: Boolean, default: true, index: true },
  createdAt:    { type: String, default: () => new Date().toISOString() },
  updatedAt:    { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });

// Export models (use existing model if already compiled — important for Next.js hot-reload)
export const FarmModel            = models.Farm            || model('Farm',            FarmSchema);
export const MotherTreeModel      = models.MotherTree      || model('MotherTree',      MotherTreeSchema, 'parentpalms');
export const ParentPalmModel      = models.ParentPalm      || model('ParentPalm',      MotherTreeSchema, 'parentpalms');
export const BatchModel           = models.Batch           || model('Batch',           BatchSchema);
export const BatchSourceModel     = models.BatchSource     || model('BatchSource',     BatchSourceSchema, 'batch_sources');
export const BatchInventoryModel  = models.BatchInventory  || model('BatchInventory',  BatchInventorySchema, 'batch_inventory');
export const CounterModel         = models.Counter         || model('Counter',         CounterSchema, 'counters');
export const BookingModel         = models.Booking         || model('Booking',         BookingSchema);
export const ReviewModel          = models.Review          || model('Review',          ReviewSchema);
export const FAQModel             = models.FAQ             || model('FAQ',             FAQSchema);
export const EnquiryModel         = models.Enquiry         || model('Enquiry',         EnquirySchema);
export const InventoryAdjustmentModel = models.InventoryAdjustment || model('InventoryAdjustment', InventoryAdjustmentSchema);
export const PageViewModel        = models.PageView        || model('PageView',        PageViewSchema);
export const VisitorJourneyModel  = models.VisitorJourney  || model('VisitorJourney',  VisitorJourneySchema);
export const SiteSettingsModel    = models.SiteSettings    || model('SiteSettings',    SiteSettingsSchema);
export const BatchViewModel       = models.BatchView       || model('BatchView',       BatchViewSchema, 'batch_views');
export const InstagramPostModel   = models.InstagramPost   || model('InstagramPost',   InstagramPostSchema, 'instagram_posts');
