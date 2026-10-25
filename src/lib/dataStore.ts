import { connectToDatabase } from '@/lib/mongodb';
import {
  ParentPalmModel,
  BatchModel,
  BookingModel,
  ReviewModel,
  FAQModel,
  EnquiryModel,
  InventoryAdjustmentModel
} from '@/lib/models';

export interface ParentPalm {
  id: string;
  code: string;
  name: string;
  age: number;
  location: string;
  healthStatus: string;
  yieldHistory: string;
  description: string;
  nutCharacteristics: string;
  whySelected: string;
  images: string[];
}

export interface Batch {
  id: string;
  batchCode: string;
  parentPalmId: string;
  parentPalmCode: string;
  parentPalmCodes?: string[];
  name: string;
  harvestDate: string; // Coconut Cut From Tree Date
  seededDate: string; // Seeded On Date
  age?: string;
  height?: string;
  totalQuantity: number;
  bookedQuantity: number;
  inventoryAdjustments: number;
  availableQuantity?: number;
  bookedPercentage?: number;
  price: number;
  status: 'AVAILABLE' | 'LIMITED' | 'SOLD_OUT' | 'COMING_SOON';
  description: string;
  viewsCount?: number; // Social proof view counter
  images: string[];
}

export interface InventoryAdjustment {
  id: string;
  batchCode: string;
  quantityChange: number;
  reason: string;
  adminName: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingId: string;
  batchCode: string;
  customerName: string;
  mobile: string;
  whatsapp: string;
  address: string;
  district: string;
  state: string;
  pinCode: string;
  email?: string;
  farmLocation?: string;
  specialInstructions?: string;
  expectedDeliveryDate?: string;
  deliveryService?: string;
  nearestHub?: string;
  quantity: number;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  orderType?: 'COMPLETE' | 'PRE_ORDER';
  isPreOrder?: boolean;
  paidAmount?: number;
  advancePaid?: number;
  balanceAmount?: number;
  paymentStatus: 'PAID' | 'PENDING_VERIFICATION' | 'FAILED';
  bookingStatus: 'Pre-order' | 'Payment review' | 'Confirmed' | 'Preparing' | 'Packed' | 'Dispatched' | 'Delivered' | 'Cancelled';
  paymentScreenshotUrl?: string;
  receiptUrl?: string;
  courierName?: string;
  trackingId?: string;
  dispatchDate?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  customerName: string;
  location: string;
  batchCode: string;
  quantity: number;
  rating: number;
  comment: string;
  verified: boolean;
  date: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface Enquiry {
  id: string;
  name: string;
  mobile: string;
  location?: string;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'RESOLVED';
  createdAt: string;
}

export interface PageViewEvent {
  id: string;
  sessionId: string;
  path: string;
  title?: string;
  referrer?: string;
  referrerSource: string;
  device: 'mobile' | 'tablet' | 'desktop';
  screenSize?: string;
  timestamp: string;
}

export interface VisitorJourney {
  sessionId: string;
  startedAt: string;
  lastActiveAt: string;
  device: 'mobile' | 'tablet' | 'desktop';
  referrerSource: string;
  pathCount: number;
  steps: string[];
  convertedToOrder: boolean;
  orderId?: string;
}


// Helper to compute age & height dynamically from Seeded Date
export function getSaplingMetrics(seededDateStr: string) {
  if (!seededDateStr) return { age: 'N/A', height: 'N/A', monthsCount: 0 };
  
  const seeded = new Date(seededDateStr);
  const now = new Date();
  
  let monthsCount = (now.getFullYear() - seeded.getFullYear()) * 12 + (now.getMonth() - seeded.getMonth());
  if (now.getDate() < seeded.getDate()) {
    monthsCount = Math.max(0, monthsCount - 1);
  }
  
  monthsCount = Math.max(1, monthsCount);

  let estimatedHeight = '0.8–1.5 ft';
  if (monthsCount >= 4 && monthsCount <= 6) {
    estimatedHeight = '1.5–2.5 ft';
  } else if (monthsCount >= 7 && monthsCount <= 9) {
    estimatedHeight = '2.5–4.5 ft';
  } else if (monthsCount >= 10 && monthsCount <= 12) {
    estimatedHeight = '4.5–6.0 ft';
  } else if (monthsCount > 12) {
    estimatedHeight = '6.0+ ft (Ready for Field Planting)';
  }

  return {
    age: `${monthsCount} Month${monthsCount > 1 ? 's' : ''}`,
    height: estimatedHeight,
    monthsCount
  };
}

// Dynamic Batch Status Calculation Rule Engine
export function getDynamicBatchStatus(availableQuantity: number, seededDateStr: string): 'AVAILABLE' | 'LIMITED' | 'SOLD_OUT' | 'COMING_SOON' {
  const metrics = getSaplingMetrics(seededDateStr);
  
  if (metrics.monthsCount < 6) {
    return 'COMING_SOON';
  }
  if (availableQuantity <= 0) {
    return 'SOLD_OUT';
  }
  if (availableQuantity < 50) {
    return 'LIMITED';
  }
  return 'AVAILABLE';
}

// Global Store State
let parentPalms: ParentPalm[] = [];
let batches: Batch[] = [];
let bookings: Booking[] = [];
let adjustments: InventoryAdjustment[] = [];
let reviews: Review[] = [];
let faqs: FAQ[] = [
  {
    id: 'faq-1',
    question: 'Where are your saplings grown?',
    answer: 'All our coconut saplings are raised directly on our own ancestral farm in Eathamozhi, Kanyakumari district, Tamil Nadu.',
    category: 'General'
  },
  {
    id: 'faq-2',
    question: 'How are saplings packaged for long-distance transport?',
    answer: 'Saplings are carefully rooted in nutrient-rich growing media and wrapped with protective moisture-retaining material to safeguard the fronds and collar stem during transit. Each consignment is securely packed and dispatched via trusted freight partners.',
    category: 'Logistics'
  }
];
let enquiries: Enquiry[] = [];
let pageViews: PageViewEvent[] = [];
let visitorJourneys: VisitorJourney[] = [];

// Persistent File Storage (JSON DB in src/data/db.json)
function getNodeModule(moduleName: string) {
  if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node) {
    try {
      const req = eval('require');
      return req(moduleName);
    } catch {
      return null;
    }
  }
  return null;
}

const fsModule = getNodeModule('fs');
const pathModule = getNodeModule('path');

const DB_FILE = pathModule && typeof process !== 'undefined'
  ? pathModule.join(process.cwd(), 'src', 'data', 'db.json')
  : null;

const TMP_DB_FILE = pathModule && typeof process !== 'undefined'
  ? pathModule.join('/tmp', 'coconut_db.json')
  : null;

function loadFromDb() {
  if (!fsModule) return;
  try {
    let raw: string | null = null;
    // Prefer /tmp file if runtime mutations occurred in this serverless container
    if (TMP_DB_FILE && fsModule.existsSync(TMP_DB_FILE)) {
      try { raw = fsModule.readFileSync(TMP_DB_FILE, 'utf-8'); } catch {}
    }
    if (!raw && DB_FILE && fsModule.existsSync(DB_FILE)) {
      try { raw = fsModule.readFileSync(DB_FILE, 'utf-8'); } catch {}
    }

    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.parentPalms)) parentPalms = data.parentPalms;
      if (Array.isArray(data.batches)) {
        batches = data.batches.map((b: any) => ({
          ...b,
          parentPalmCodes: (Array.isArray(b.parentPalmCodes) && b.parentPalmCodes.length > 0)
            ? b.parentPalmCodes
            : [b.parentPalmCode || 'EM-MP-001']
        }));
      }
      if (Array.isArray(data.bookings)) bookings = data.bookings;
      if (Array.isArray(data.adjustments)) adjustments = data.adjustments;
      if (Array.isArray(data.enquiries)) enquiries = data.enquiries;
      if (Array.isArray(data.reviews)) reviews = data.reviews;
      if (Array.isArray(data.faqs)) faqs = data.faqs;
      if (Array.isArray(data.pageViews)) pageViews = data.pageViews;
      if (Array.isArray(data.visitorJourneys)) visitorJourneys = data.visitorJourneys;
    }
  } catch (err) {
    // Non-fatal fallback to initial data
  }
}

function saveToDb() {
  if (!fsModule || !pathModule) return;
  try {
    const payload = {
      parentPalms,
      batches,
      bookings,
      adjustments,
      enquiries,
      reviews,
      faqs,
      pageViews: pageViews.slice(0, 1000),
      visitorJourneys: visitorJourneys.slice(0, 500)
    };
    const jsonStr = JSON.stringify(payload, null, 2);

    let saved = false;
    // Try saving to DB_FILE first (local dev / persistent storage)
    if (DB_FILE) {
      try {
        const dir = pathModule.dirname(DB_FILE);
        if (!fsModule.existsSync(dir)) {
          fsModule.mkdirSync(dir, { recursive: true });
        }
        fsModule.writeFileSync(DB_FILE, jsonStr, 'utf-8');
        saved = true;
      } catch {
        // Read-only filesystem in serverless production
      }
    }

    // In serverless environments (e.g. Vercel), fall back to writable /tmp
    if (!saved && TMP_DB_FILE) {
      try {
        fsModule.writeFileSync(TMP_DB_FILE, jsonStr, 'utf-8');
      } catch {}
    }
  } catch (err) {
    // Silently continue with in-memory state if filesystem is strictly read-only
  }
}

// Auto-scan to ensure newly uploaded or existing photos on disk are never missed
function syncDiskImages() { return;
  if (!fsModule || !pathModule || typeof process === 'undefined') return;
  try {
    const batchesBase = pathModule.join(process.cwd(), 'public', 'images', 'batches');
    const palmsBase = pathModule.join(process.cwd(), 'public', 'images', 'parent-palms');

    // Sync batches
    if (fsModule.existsSync(batchesBase)) {
      batches.forEach(b => {
        const folder = pathModule.join(batchesBase, b.batchCode);
        if (fsModule.existsSync(folder)) {
          const files = fsModule.readdirSync(folder).filter((f: string) => /\.(jpe?g|png|webp)$/i.test(f));
          if (files.length > 0) {
            const diskUrls: string[] = files.map((f: string) => `/images/batches/${b.batchCode}/${f}`);
            const validCurrent: string[] = (b.images || []).filter((img: string) => {
              if (img.startsWith('/images/')) {
                const diskPath = pathModule.join(process.cwd(), 'public', img.replace(/^\//, ''));
                return fsModule.existsSync(diskPath);
              }
              return true;
            });
            if (validCurrent.length === 0) {
              b.images = diskUrls;
            } else {
              b.images = validCurrent;
            }
          }
        }
      });
    }

    // Sync parent palms
    if (fsModule.existsSync(palmsBase)) {
      parentPalms.forEach(p => {
        const folder = pathModule.join(palmsBase, p.code);
        if (fsModule.existsSync(folder)) {
          const files = fsModule.readdirSync(folder).filter((f: string) => /\.(jpe?g|png|webp)$/i.test(f));
          if (files.length > 0) {
            const diskUrls: string[] = files.map((f: string) => `/images/parent-palms/${p.code}/${f}`);
            const validCurrent: string[] = (p.images || []).filter((img: string) => {
              if (img.startsWith('/images/')) {
                const diskPath = pathModule.join(process.cwd(), 'public', img.replace(/^\//, ''));
                return fsModule.existsSync(diskPath);
              }
              return true;
            });
            if (validCurrent.length === 0) {
              p.images = diskUrls;
            } else {
              p.images = validCurrent;
            }
          }
        }
      });
    }
  } catch (e) {
    console.error('Error syncing disk images:', e);
  }
}

// Initial hydration from DB and sync with disk
if (typeof window === 'undefined') {
  loadFromDb();
  syncDiskImages();
  saveToDb();
}

// Helper Functions

let mongoSyncPromise: Promise<void> | null = null;
let lastMongoSyncTime = 0;
const MONGO_SYNC_TTL = 3000; // 3 seconds in-memory cache TTL between syncs

async function syncFromMongo(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastMongoSyncTime < MONGO_SYNC_TTL) {
    return;
  }
  if (mongoSyncPromise) {
    return mongoSyncPromise;
  }

  mongoSyncPromise = (async () => {
    try {
      const conn = await connectToDatabase();
      if (!conn) return;

      const [mPalms, mBatches, mBookings, mEnquiries, mReviews, mAdjustments, mFaqs] = await Promise.all([
        ParentPalmModel.find({}).lean(),
        BatchModel.find({}).lean(),
        BookingModel.find({}).lean(),
        EnquiryModel.find({}).lean(),
        ReviewModel.find({}).lean(),
        InventoryAdjustmentModel.find({}).lean(),
        FAQModel.find({}).lean(),
      ]);

      if (Array.isArray(mPalms) && mPalms.length > 0) {
        parentPalms = mPalms.map((p: any) => ({
          id: p.id || `mp-${Date.now()}`,
          code: p.code,
          name: p.name,
          age: Number(p.age) || 40,
          location: p.location || 'Eathamozhi Farm',
          healthStatus: p.healthStatus || 'Excellent',
          yieldHistory: p.yieldHistory || '',
          description: p.description || '',
          nutCharacteristics: p.nutCharacteristics || '',
          whySelected: p.whySelected || '',
          images: Array.isArray(p.images) ? p.images : []
        }));
      }

      if (Array.isArray(mBatches) && mBatches.length > 0) {
        batches = mBatches.map((b: any) => ({
          id: b.id || `b-${Date.now()}`,
          batchCode: b.batchCode,
          parentPalmId: b.parentPalmId || 'mp-1',
          parentPalmCode: b.parentPalmCode || 'EM-MP-001',
          parentPalmCodes: (Array.isArray(b.parentPalmCodes) && b.parentPalmCodes.length > 0) ? b.parentPalmCodes : [b.parentPalmCode || 'EM-MP-001'],
          name: b.name,
          harvestDate: b.harvestDate,
          seededDate: b.seededDate,
          age: b.age,
          height: b.height,
          totalQuantity: Number(b.totalQuantity),
          bookedQuantity: Number(b.bookedQuantity) || 0,
          inventoryAdjustments: Number(b.inventoryAdjustments) || 0,
          price: Number(b.price),
          status: b.status || 'AVAILABLE',
          description: b.description || '',
          viewsCount: Number(b.viewsCount) || 0,
          images: Array.isArray(b.images) ? b.images : []
        }));
      }

      if (Array.isArray(mBookings) && mBookings.length > 0) {
        bookings = mBookings.map((b: any) => ({ ...b }));
      }
      if (Array.isArray(mEnquiries) && mEnquiries.length > 0) {
        enquiries = mEnquiries.map((e: any) => ({ ...e }));
      }
      if (Array.isArray(mReviews) && mReviews.length > 0) {
        reviews = mReviews.map((r: any) => ({ ...r }));
      }
      if (Array.isArray(mAdjustments) && mAdjustments.length > 0) {
        adjustments = mAdjustments.map((a: any) => ({ ...a }));
      }
      if (Array.isArray(mFaqs) && mFaqs.length > 0) {
        faqs = mFaqs.map((f: any) => ({ ...f }));
      }

      lastMongoSyncTime = Date.now();
      saveToDb();
    } catch (err) {
      console.warn('MongoDB syncFromMongo warning:', err);
    } finally {
      mongoSyncPromise = null;
    }
  })();

  return mongoSyncPromise;
}

export const DataStore = {
  getBatches: () => {
    loadFromDb();
    return batches.map(b => {
      // Dynamically sum active (non-cancelled) bookings for this batch
      const activeBookings = bookings.filter(
        bk => bk.batchCode.toLowerCase() === b.batchCode.toLowerCase() && bk.bookingStatus !== 'Cancelled'
      );
      const computedBookedQuantity = activeBookings.reduce((sum, bk) => sum + bk.quantity, 0);
      const netStock = Math.max(0, b.totalQuantity + (b.inventoryAdjustments || 0));
      const available = Math.max(0, netStock - computedBookedQuantity);
      const metrics = getSaplingMetrics(b.seededDate);
      const computedStatus = getDynamicBatchStatus(available, b.seededDate);

      return {
        ...b,
        bookedQuantity: computedBookedQuantity,
        inventoryAdjustments: b.inventoryAdjustments || 0,
        age: metrics.age,
        height: metrics.height,
        availableQuantity: available,
        status: computedStatus,
        bookedPercentage: netStock > 0 ? Number(((computedBookedQuantity / netStock) * 100).toFixed(1)) : 0
      };
    });
  },

  getOldestAvailableBatch: () => {
    loadFromDb();
    const all = DataStore.getBatches();
    const readyAvailable = all.filter(b => b.availableQuantity > 0 && b.status !== 'COMING_SOON');
    readyAvailable.sort((a, b) => new Date(a.seededDate).getTime() - new Date(b.seededDate).getTime());
    return readyAvailable[0] || all.find(b => b.availableQuantity > 0) || all[0];
  },

  getBatchByCode: (code: string) => {
    loadFromDb();
    const all = DataStore.getBatches();
    const b = all.find(x => x.batchCode.toLowerCase() === code.toLowerCase());
    if (!b) return null;
    const realBatch = batches.find(x => x.batchCode.toLowerCase() === code.toLowerCase());
    if (realBatch) {
      realBatch.viewsCount = (realBatch.viewsCount || 0) + 1;
      saveToDb();
    }
    return b;
  },

  addBatch: (newBatchData: any) => {
    loadFromDb();
    const combinedName = newBatchData.name.includes(newBatchData.batchCode) 
      ? newBatchData.name 
      : `${newBatchData.name} (${newBatchData.batchCode})`;

    const defaultFolderImages = ['/images/placeholder.png'];

    // Multi-Mother tree support
    let codes: string[] = [];
    if (Array.isArray(newBatchData.parentPalmCodes) && newBatchData.parentPalmCodes.length > 0) {
      codes = newBatchData.parentPalmCodes;
    } else if (newBatchData.parentPalmCode) {
      codes = [newBatchData.parentPalmCode];
    } else {
      codes = ['EM-MP-001'];
    }
    const primaryCode = codes[0];
    const parent = parentPalms.find(p => p.code.toLowerCase() === primaryCode.toLowerCase());

    const created: Batch = {
      id: `b-${Date.now()}`,
      batchCode: newBatchData.batchCode,
      parentPalmId: parent ? parent.id : (newBatchData.parentPalmId || 'mp-1'),
      parentPalmCode: primaryCode,
      parentPalmCodes: codes,
      name: combinedName,
      harvestDate: newBatchData.harvestDate,
      seededDate: newBatchData.seededDate,
      totalQuantity: Number(newBatchData.totalQuantity),
      bookedQuantity: 0,
      inventoryAdjustments: 0,
      price: Number(newBatchData.price),
      status: 'AVAILABLE',
      description: newBatchData.description || '',
      viewsCount: 15,
      images: newBatchData.images && newBatchData.images.length > 0 ? newBatchData.images : defaultFolderImages
    };

    batches.unshift(created);
    saveToDb();
    return DataStore.getBatchByCode(created.batchCode);
  },

  updateBatch: (code: string, updatedFields: Partial<Batch> & { parentPalmCodes?: string[] }) => {
    loadFromDb();
    const target = batches.find(b => b.batchCode.toLowerCase() === code.toLowerCase());
    if (!target) throw new Error('Batch not found');

    if (updatedFields.price !== undefined) target.price = Number(updatedFields.price);
    if (updatedFields.totalQuantity !== undefined) target.totalQuantity = Number(updatedFields.totalQuantity);
    if (updatedFields.harvestDate) target.harvestDate = updatedFields.harvestDate;
    if (updatedFields.seededDate) target.seededDate = updatedFields.seededDate;
    if (updatedFields.description) target.description = updatedFields.description;
    if (updatedFields.name) {
      target.name = updatedFields.name.includes(target.batchCode) ? updatedFields.name : `${updatedFields.name} (${target.batchCode})`;
    }
    if (updatedFields.images) {
      target.images = updatedFields.images;
    }
    if (updatedFields.parentPalmCodes && Array.isArray(updatedFields.parentPalmCodes) && updatedFields.parentPalmCodes.length > 0) {
      target.parentPalmCodes = updatedFields.parentPalmCodes;
      target.parentPalmCode = updatedFields.parentPalmCodes[0];
      const parent = parentPalms.find(p => p.code.toLowerCase() === target.parentPalmCode.toLowerCase());
      if (parent) target.parentPalmId = parent.id;
    } else if (updatedFields.parentPalmCode) {
      target.parentPalmCode = updatedFields.parentPalmCode;
      target.parentPalmCodes = [updatedFields.parentPalmCode];
      const parent = parentPalms.find(p => p.code.toLowerCase() === updatedFields.parentPalmCode?.toLowerCase());
      if (parent) target.parentPalmId = parent.id;
    }

    saveToDb();
    return DataStore.getBatchByCode(code);
  },

  deleteBatch: (code: string) => {
    loadFromDb();
    batches = batches.filter(b => b.batchCode.toLowerCase() !== code.toLowerCase());
    saveToDb();
    return true;
  },

  getParentPalms: () => {
    loadFromDb();
    return parentPalms;
  },

  getParentPalmByCode: (code: string) => {
    loadFromDb();
    return parentPalms.find(p => p.code.toLowerCase() === code.toLowerCase()) || null;
  },

  addParentPalm: (data: Omit<ParentPalm, 'id'>) => {
    loadFromDb();
    const defaultTreeImages = ['/images/placeholder.png'];
    const created: ParentPalm = {
      ...data,
      id: `mp-${Date.now()}`,
      images: data.images && data.images.length > 0 ? data.images : defaultTreeImages
    };
    parentPalms.unshift(created);
    saveToDb();
    return created;
  },

  updateParentPalm: (identifier: string, updatedFields: Partial<ParentPalm>) => {
    loadFromDb();
    const target = parentPalms.find(p => 
      p.id === identifier || 
      p.code.toLowerCase() === identifier.toLowerCase()
    );
    if (!target) throw new Error('Parent palm mother tree not found');
    if (updatedFields.images && Array.isArray(updatedFields.images)) {
      target.images = [...updatedFields.images];
    }
    Object.assign(target, updatedFields);
    saveToDb();
    return target;
  },

  deleteParentPalm: (codeOrId: string) => {
    loadFromDb();
    parentPalms = parentPalms.filter(p => p.id !== codeOrId && p.code.toLowerCase() !== codeOrId.toLowerCase());
    saveToDb();
    return true;
  },

  getEnquiries: () => {
    loadFromDb();
    return enquiries;
  },

  addEnquiry: (data: Omit<Enquiry, 'id' | 'status' | 'createdAt'>) => {
    loadFromDb();
    const created: Enquiry = {
      ...data,
      id: `enq-${Date.now()}`,
      status: 'NEW',
      createdAt: new Date().toISOString()
    };
    enquiries.unshift(created);
    saveToDb();
    return created;
  },

  updateEnquiryStatus: (id: string, status: 'NEW' | 'CONTACTED' | 'RESOLVED') => {
    loadFromDb();
    const target = enquiries.find(e => e.id === id);
    if (target) target.status = status;
    saveToDb();
    return target;
  },

  getBookings: () => {
    loadFromDb();
    return bookings;
  },

  // Orders API (alias for bookings)
  getOrders: () => {
    loadFromDb();
    return bookings;
  },

  // Update an order (booking) by ID
  updateOrder: (orderId: string, changes: Partial<Booking>) => {
    loadFromDb();
    const target = bookings.find(b => b.id === orderId || b.bookingId === orderId);
    if (!target) throw new Error('Order not found');
    Object.assign(target, changes);
    saveToDb();
    return target;
  },

  // Placeholder for generic image reference handling
  addImageReference: (type: string, url: string) => {
    // Currently no-op; can be extended to store references per type.
    return true;
  },

  getBookingsByMobile: (mobile: string) => {
    loadFromDb();
    const cleanMob = mobile.trim();
    if (!cleanMob) return [];
    return bookings.filter(b => 
      b.mobile.includes(cleanMob) || 
      b.whatsapp.includes(cleanMob) ||
      b.bookingId.toLowerCase().includes(cleanMob.toLowerCase())
    );
  },

  getBookingById: (bookingId: string, mobile?: string) => {
    loadFromDb();
    const cleanId = bookingId.trim().toUpperCase();
    return bookings.find(b => {
      const matchId = b.bookingId.toUpperCase() === cleanId;
      if (mobile) {
        return matchId && b.mobile.includes(mobile.trim());
      }
      return matchId;
    }) || null;
  },

  createBooking: (data: Omit<Booking, 'id' | 'bookingId' | 'createdAt' | 'paymentStatus' | 'bookingStatus'> & { paymentScreenshotUrl?: string; bookingStatus?: string }) => {
    loadFromDb();
    const batch = DataStore.getBatchByCode(data.batchCode);
    if (!batch || batch.availableQuantity < data.quantity) {
      throw new Error('Requested quantity exceeds available stock.');
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `${data.batchCode}-${randomSuffix}`;
    
    const resolvedAddress = data.address?.trim()
      ? data.address.trim()
      : `${data.district}, ${data.state} - ${data.pinCode}`;
    const resolvedWhatsapp = data.whatsapp?.trim() || data.mobile;
    const resolvedCourier = data.deliveryService?.trim() || 'MSS Parcel Service';

    const isPreOrder = Boolean(data.isPreOrder || data.orderType === 'PRE_ORDER' || (data as any).bookingStatus === 'Pre-order');
    const orderType = isPreOrder ? 'PRE_ORDER' : 'COMPLETE';
    const totalAmount = Number(data.totalAmount) || 0;
    const paidAmount = isPreOrder ? (Number(data.paidAmount) || Number(data.advancePaid) || Math.round(totalAmount / 2)) : totalAmount;
    const balanceAmount = isPreOrder ? Math.max(0, totalAmount - paidAmount) : 0;
    const initialStatus = isPreOrder ? 'Pre-order' : 'Payment review';

    const newBooking: Booking = {
      ...data,
      address: resolvedAddress,
      whatsapp: resolvedWhatsapp,
      deliveryService: resolvedCourier,
      orderType,
      isPreOrder,
      paidAmount,
      advancePaid: isPreOrder ? paidAmount : undefined,
      balanceAmount,
      id: `bk-${Date.now()}`,
      bookingId,
      paymentStatus: 'PENDING_VERIFICATION',
      bookingStatus: (data.bookingStatus as any) || initialStatus,
      createdAt: new Date().toISOString()
    };

    bookings.unshift(newBooking);
    saveToDb();
    return newBooking;
  },

  updateBookingStatus: (bookingId: string, status: Booking['bookingStatus'], courierName?: string, trackingId?: string) => {
    loadFromDb();
    const bk = bookings.find(b => b.bookingId === bookingId);
    if (!bk) return null;
    bk.bookingStatus = status;
    if (status === 'Confirmed' || status === 'Preparing' || status === 'Dispatched' || status === 'Delivered') {
      bk.paymentStatus = 'PAID';
    }
    if (courierName) bk.courierName = courierName;
    if (trackingId) bk.trackingId = trackingId;
    if (status === 'Dispatched') bk.dispatchDate = new Date().toISOString().split('T')[0];
    saveToDb();
    return bk;
  },

  adjustInventory: (batchCode: string, change: number, reason: string, adminName: string) => {
    loadFromDb();
    const targetBatch = batches.find(b => b.batchCode.toLowerCase() === batchCode.toLowerCase());
    if (!targetBatch) throw new Error('Batch not found');
    
    targetBatch.inventoryAdjustments = (targetBatch.inventoryAdjustments || 0) + change;
    
    const newAdj: InventoryAdjustment = {
      id: `adj-${Date.now()}`,
      batchCode: targetBatch.batchCode,
      quantityChange: change,
      reason,
      adminName,
      createdAt: new Date().toISOString()
    };
    
    adjustments.unshift(newAdj);
    saveToDb();
    return newAdj;
  },

  syncImagesWithDisk: () => {
    syncDiskImages();
    saveToDb();
    return true;
  },

  getAdjustments: () => {
    loadFromDb();
    return adjustments;
  },
  getReviews: () => {
    loadFromDb();
    return reviews;
  },
  getReviewById: (id: string) => {
    loadFromDb();
    return reviews.find(r => r.id === id) || null;
  },
  addReview: (reviewData: Partial<Review>) => {
    loadFromDb();
    const newReview: Review = {
      id: reviewData.id || `rev-${Date.now()}`,
      customerName: (reviewData.customerName || 'Verified Farmer').trim(),
      location: (reviewData.location || 'Tamil Nadu').trim(),
      batchCode: (reviewData.batchCode || 'EM-0126-A').trim(),
      quantity: Math.max(1, Number(reviewData.quantity) || 1),
      rating: Math.min(5, Math.max(1, Number(reviewData.rating) || 5)),
      comment: (reviewData.comment || '').trim(),
      verified: reviewData.verified !== undefined ? Boolean(reviewData.verified) : true,
      date: reviewData.date || new Date().toISOString().split('T')[0]
    };
    reviews.unshift(newReview);
    saveToDb();
    return newReview;
  },
  updateReview: (id: string, updatedFields: Partial<Review>) => {
    loadFromDb();
    const index = reviews.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Review with id ${id} not found`);
    }
    const current = reviews[index];
    const updatedReview: Review = {
      ...current,
      customerName: updatedFields.customerName !== undefined ? updatedFields.customerName.trim() : current.customerName,
      location: updatedFields.location !== undefined ? updatedFields.location.trim() : current.location,
      batchCode: updatedFields.batchCode !== undefined ? updatedFields.batchCode.trim() : current.batchCode,
      quantity: updatedFields.quantity !== undefined ? Math.max(1, Number(updatedFields.quantity) || 1) : current.quantity,
      rating: updatedFields.rating !== undefined ? Math.min(5, Math.max(1, Number(updatedFields.rating) || 5)) : current.rating,
      comment: updatedFields.comment !== undefined ? updatedFields.comment.trim() : current.comment,
      verified: updatedFields.verified !== undefined ? Boolean(updatedFields.verified) : current.verified,
      date: updatedFields.date !== undefined ? updatedFields.date.trim() : current.date
    };
    reviews[index] = updatedReview;
    saveToDb();
    return updatedReview;
  },
  deleteReview: (id: string) => {
    loadFromDb();
    const beforeCount = reviews.length;
    reviews = reviews.filter(r => r.id !== id);
    saveToDb();
    return reviews.length < beforeCount;
  },
  getFaqs: () => {
    loadFromDb();
    return faqs;
  },

  recordPageView: (event: {
    sessionId: string;
    path: string;
    title?: string;
    referrer?: string;
    referrerSource?: string;
    device?: 'mobile' | 'tablet' | 'desktop';
    screenSize?: string;
    orderId?: string;
  }) => {
    loadFromDb();
    const timestamp = new Date().toISOString();
    const id = `pv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const pageView: PageViewEvent = {
      id,
      sessionId: event.sessionId,
      path: event.path,
      title: event.title,
      referrer: event.referrer,
      referrerSource: event.referrerSource || 'Direct / Bookmark',
      device: event.device || 'desktop',
      screenSize: event.screenSize,
      timestamp,
    };

    pageViews.unshift(pageView);
    if (pageViews.length > 1000) pageViews.pop();

    // Update or create Visitor Journey
    let journey = visitorJourneys.find(j => j.sessionId === event.sessionId);
    if (!journey) {
      journey = {
        sessionId: event.sessionId,
        startedAt: timestamp,
        lastActiveAt: timestamp,
        device: event.device || 'desktop',
        referrerSource: event.referrerSource || 'Direct / Bookmark',
        pathCount: 1,
        steps: [event.path],
        convertedToOrder: Boolean(event.orderId || event.path.startsWith('/confirmation')),
        orderId: event.orderId,
      };
      visitorJourneys.unshift(journey);
    } else {
      journey.lastActiveAt = timestamp;
      journey.pathCount = (journey.pathCount || 0) + 1;
      if (!journey.steps.includes(event.path)) {
        journey.steps.push(event.path);
      }
      if (event.orderId || event.path.startsWith('/confirmation')) {
        journey.convertedToOrder = true;
        if (event.orderId) journey.orderId = event.orderId;
      }
    }

    if (visitorJourneys.length > 500) visitorJourneys.pop();
    saveToDb();
    return pageView;
  },

  getAnalyticsSummary: () => {
    loadFromDb();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const totalViews = pageViews.length;
    const viewsToday = pageViews.filter(pv => pv.timestamp.startsWith(todayStr)).length;
    const views7d = pageViews.filter(pv => pv.timestamp >= sevenDaysAgo).length;

    const uniqueSessions = visitorJourneys.length;
    const sessionsToday = visitorJourneys.filter(j => j.startedAt.startsWith(todayStr)).length;
    const convertedSessions = visitorJourneys.filter(j => j.convertedToOrder).length;

    // Top Pages
    const pageCounts: { [path: string]: number } = {};
    for (const pv of pageViews) {
      pageCounts[pv.path] = (pageCounts[pv.path] || 0) + 1;
    }
    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Traffic Sources
    const sourceCounts: { [src: string]: number } = {};
    for (const j of visitorJourneys) {
      const src = j.referrerSource || 'Direct / Bookmark';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    }

    // Devices
    const deviceCounts: { [dev: string]: number } = { mobile: 0, desktop: 0, tablet: 0 };
    for (const j of visitorJourneys) {
      const dev = j.device || 'desktop';
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    }

    // Funnel
    const funnel = {
      home: visitorJourneys.filter(j => j.steps.some(s => s === '/')).length,
      motherTrees: visitorJourneys.filter(j => j.steps.some(s => s.startsWith('/farm') || s.startsWith('/parent-palm'))).length,
      batches: visitorJourneys.filter(j => j.steps.some(s => s.startsWith('/batches'))).length,
      checkout: visitorJourneys.filter(j => j.steps.some(s => s.startsWith('/book'))).length,
      converted: convertedSessions,
    };

    return {
      kpis: {
        totalViews,
        viewsToday,
        views7d,
        uniqueSessions,
        sessionsToday,
        convertedSessions,
        conversionRate: uniqueSessions > 0 ? ((convertedSessions / uniqueSessions) * 100).toFixed(1) : '0',
      },
      topPages,
      trafficSources: sourceCounts,
      devices: deviceCounts,
      funnel,
      recentJourneys: visitorJourneys.slice(0, 20),
    };
  },

  // ─── Async MongoDB Synchronized Methods ─────────────────────────────
  syncFromMongo: async () => {
    await syncFromMongo(true);
  },

  getParentPalmsAsync: async (): Promise<ParentPalm[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getParentPalms();
  },

  getParentPalmByCodeAsync: async (code: string): Promise<ParentPalm | null> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getParentPalmByCode(code);
  },

  addParentPalmAsync: async (data: Omit<ParentPalm, 'id'>): Promise<ParentPalm> => {
    const created = DataStore.addParentPalm(data);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await ParentPalmModel.findOneAndUpdate({ code: created.code }, created, { upsert: true, new: true });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to persist ParentPalm to MongoDB:', err);
    }
    return created;
  },

  updateParentPalmAsync: async (identifier: string, updatedFields: Partial<ParentPalm>): Promise<ParentPalm> => {
    const updated = DataStore.updateParentPalm(identifier, updatedFields);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await ParentPalmModel.findOneAndUpdate(
          { $or: [{ id: identifier }, { code: new RegExp('^' + identifier + '$', 'i') }] },
          { $set: updated },
          { new: true }
        );
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to update ParentPalm in MongoDB:', err);
    }
    return updated;
  },

  deleteParentPalmAsync: async (codeOrId: string): Promise<boolean> => {
    DataStore.deleteParentPalm(codeOrId);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await ParentPalmModel.deleteOne({
          $or: [{ id: codeOrId }, { code: new RegExp('^' + codeOrId + '$', 'i') }]
        });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to delete ParentPalm from MongoDB:', err);
    }
    return true;
  },

  getBatchesAsync: async (): Promise<Batch[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getBatches();
  },

  getOldestAvailableBatchAsync: async (): Promise<Batch | undefined> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getOldestAvailableBatch();
  },

  getBatchByCodeAsync: async (code: string): Promise<Batch | null> => {
    loadFromDb();
    await syncFromMongo();
    const batch = DataStore.getBatchByCode(code);
    if (batch) {
      try {
        const conn = await connectToDatabase();
        if (conn) {
          const updateOp: any = { $inc: { viewsCount: 1 } };
          await BatchModel.updateOne({ batchCode: new RegExp("^" + code + "$", "i") }, updateOp);
        }
      } catch (err) {}
    }
    return batch;
  },

  addBatchAsync: async (newBatchData: any): Promise<Batch | null> => {
    const created = DataStore.addBatch(newBatchData);
    try {
      const conn = await connectToDatabase();
      if (conn && created) {
        await BatchModel.findOneAndUpdate({ batchCode: created.batchCode }, created, { upsert: true, new: true });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to persist Batch to MongoDB:', err);
    }
    return created;
  },

  updateBatchAsync: async (code: string, updatedFields: any): Promise<Batch | null> => {
    const updated = DataStore.updateBatch(code, updatedFields);
    try {
      const conn = await connectToDatabase();
      if (conn && updated) {
        await BatchModel.findOneAndUpdate(
          { batchCode: new RegExp('^' + code + '$', 'i') },
          { $set: updated },
          { new: true }
        );
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to update Batch in MongoDB:', err);
    }
    return updated;
  },

  deleteBatchAsync: async (code: string): Promise<boolean> => {
    DataStore.deleteBatch(code);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await BatchModel.deleteOne({ batchCode: new RegExp('^' + code + '$', 'i') });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to delete Batch from MongoDB:', err);
    }
    return true;
  },

  getBookingsAsync: async (): Promise<Booking[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getBookings();
  },

  getBookingByIdAsync: async (bookingId: string, mobile?: string): Promise<Booking | null> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getBookingById(bookingId, mobile);
  },

  getBookingsByMobileAsync: async (mobile: string): Promise<Booking[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getBookingsByMobile(mobile);
  },

  createBookingAsync: async (data: any): Promise<Booking> => {
    const created = DataStore.createBooking(data);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await BookingModel.findOneAndUpdate({ bookingId: created.bookingId }, created, { upsert: true, new: true });
        const batch = DataStore.getBatchByCode(data.batchCode);
        if (batch) {
          await BatchModel.findOneAndUpdate(
            { batchCode: new RegExp('^' + batch.batchCode + '$', 'i') },
            { $set: { bookedQuantity: batch.bookedQuantity } }
          );
        }
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to persist Booking to MongoDB:', err);
    }
    return created;
  },

  updateOrderAsync: async (orderId: string, changes: Partial<Booking>): Promise<Booking> => {
    const updated = DataStore.updateOrder(orderId, changes);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await BookingModel.findOneAndUpdate(
          { $or: [{ id: orderId }, { bookingId: orderId }] },
          { $set: updated },
          { new: true }
        );
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to update Booking in MongoDB:', err);
    }
    return updated;
  },

  updateBookingStatusAsync: async (bookingId: string, status: any, courierName?: string, trackingId?: string): Promise<Booking | null> => {
    const updated = DataStore.updateBookingStatus(bookingId, status, courierName, trackingId);
    if (updated) {
      try {
        const conn = await connectToDatabase();
        if (conn) {
          await BookingModel.findOneAndUpdate(
            { $or: [{ id: bookingId }, { bookingId: bookingId }] },
            { $set: updated },
            { new: true }
          );
          lastMongoSyncTime = 0;
        }
      } catch (err) {
        console.error('Failed to update Booking status in MongoDB:', err);
      }
    }
    return updated;
  },

  getEnquiriesAsync: async (): Promise<Enquiry[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getEnquiries();
  },

  addEnquiryAsync: async (data: any): Promise<Enquiry> => {
    const created = DataStore.addEnquiry(data);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await EnquiryModel.findOneAndUpdate({ id: created.id }, created, { upsert: true, new: true });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to persist Enquiry to MongoDB:', err);
    }
    return created;
  },

  updateEnquiryStatusAsync: async (id: string, status: any): Promise<Enquiry | undefined> => {
    const updated = DataStore.updateEnquiryStatus(id, status);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await EnquiryModel.findOneAndUpdate({ id }, { $set: { status } });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to update Enquiry status in MongoDB:', err);
    }
    return updated;
  },

  getReviewsAsync: async (): Promise<Review[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getReviews();
  },

  addReviewAsync: async (data: any): Promise<Review> => {
    const created = DataStore.addReview(data);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await ReviewModel.findOneAndUpdate({ id: created.id }, created, { upsert: true, new: true });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to persist Review to MongoDB:', err);
    }
    return created;
  },

  updateReviewAsync: async (id: string, updatedFields: Partial<Review>): Promise<Review> => {
    const updated = DataStore.updateReview(id, updatedFields);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await ReviewModel.findOneAndUpdate({ id }, { $set: updated }, { new: true });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to update Review in MongoDB:', err);
    }
    return updated;
  },

  deleteReviewAsync: async (id: string): Promise<boolean> => {
    const deleted = DataStore.deleteReview(id);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await ReviewModel.deleteOne({ id });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to delete Review in MongoDB:', err);
    }
    return deleted;
  },

  getAdjustmentsAsync: async (): Promise<InventoryAdjustment[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getAdjustments();
  },

  adjustInventoryAsync: async (batchCode: string, change: number, reason: string, adminName: string): Promise<InventoryAdjustment> => {
    const log = DataStore.adjustInventory(batchCode, change, reason, adminName);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await InventoryAdjustmentModel.create(log);
        const batch = DataStore.getBatchByCode(batchCode);
        if (batch) {
          await BatchModel.findOneAndUpdate(
            { batchCode: new RegExp('^' + batch.batchCode + '$', 'i') },
            { $set: { inventoryAdjustments: batch.inventoryAdjustments } }
          );
        }
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to persist InventoryAdjustment to MongoDB:', err);
    }
    return log;
  },

};

