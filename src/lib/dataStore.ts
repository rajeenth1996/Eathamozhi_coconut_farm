import { connectToDatabase } from '@/lib/mongodb';
import {
  FarmModel,
  MotherTreeModel,
  ParentPalmModel,
  BatchModel,
  BatchSourceModel,
  BatchInventoryModel,
  BookingModel,
  ReviewModel,
  FAQModel,
  EnquiryModel,
  InventoryAdjustmentModel,
  SiteSettingsModel,
  BatchViewModel,
  YouTubeVideoModel,
  InstagramPostModel
} from '@/lib/models';
import {
  Farm,
  MotherTree,
  ParentPalm,
  Batch,
  BatchSource,
  BatchInventory,
  Booking,
  InventoryAdjustment,
  Review,
  FAQ,
  Enquiry,
  SiteSettings,
  PageViewEvent,
  VisitorJourney,
  YouTubeVideo,
  extractYouTubeVideoId,
  InstagramPost,
  BatchView,
  formatApproximateAge
} from '@/lib/types';
import {
  generateFarmId,
  generateMotherTreeId,
  generateBatchId,
  formatBatchDisplayName
} from '@/lib/idGenerator';

// Re-export types for backward compatibility
export type {
  Farm,
  MotherTree,
  ParentPalm,
  Batch,
  BatchSource,
  BatchInventory,
  Booking,
  InventoryAdjustment,
  Review,
  FAQ,
  Enquiry,
  SiteSettings,
  PageViewEvent,
  VisitorJourney
};

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
let farms: Farm[] = [];
let parentPalms: MotherTree[] = [];
let batches: Batch[] = [];
let batchSources: BatchSource[] = [];
let batchInventory: BatchInventory[] = [];
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
let batchViews: BatchView[] = [];
let youtubeVideos: YouTubeVideo[] = [];
let instagramPosts: InstagramPost[] = [];
let siteSettings: SiteSettings = {
  showBatchesOnMainPage: true,
  showMotherTreesOnMainPage: true,
};

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
    let filePath = DB_FILE;
    if (filePath && !fsModule.existsSync(filePath)) {
      filePath = TMP_DB_FILE;
    }

    if (filePath && fsModule.existsSync(filePath)) {
      const raw = fsModule.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.farms)) farms = data.farms;
      if (Array.isArray(data.parentPalms)) parentPalms = data.parentPalms;
      if (Array.isArray(data.batches)) batches = data.batches;
      if (Array.isArray(data.batchSources)) batchSources = data.batchSources;
      if (Array.isArray(data.batchInventory)) batchInventory = data.batchInventory;
      if (Array.isArray(data.bookings)) bookings = data.bookings;
      if (Array.isArray(data.adjustments)) adjustments = data.adjustments;
      if (Array.isArray(data.enquiries)) enquiries = data.enquiries;
      if (Array.isArray(data.reviews)) reviews = data.reviews;
      if (Array.isArray(data.faqs)) faqs = data.faqs;
      if (Array.isArray(data.pageViews)) pageViews = data.pageViews;
      if (Array.isArray(data.visitorJourneys)) visitorJourneys = data.visitorJourneys;
      if (Array.isArray(data.batchViews)) batchViews = data.batchViews;
      if (Array.isArray(data.youtubeVideos)) youtubeVideos = data.youtubeVideos;
      if (Array.isArray(data.instagramPosts)) instagramPosts = data.instagramPosts;
      if (data.siteSettings) siteSettings = data.siteSettings;
    }
  } catch (err) {
    console.error('Failed to load local DB:', err);
  }
}

function saveToDb() {
  if (!fsModule || !pathModule) return;

  try {
    const payload = {
      farms,
      parentPalms,
      batches,
      batchSources,
      batchInventory,
      bookings,
      adjustments,
      enquiries,
      reviews,
      faqs,
      pageViews: pageViews.slice(0, 1000),
      visitorJourneys: visitorJourneys.slice(0, 500),
      batchViews,
      youtubeVideos,
      instagramPosts,
      siteSettings
    };
    const jsonStr = JSON.stringify(payload, null, 2);

    let saved = false;
    if (DB_FILE) {
      try {
        const dir = pathModule.dirname(DB_FILE);
        if (!fsModule.existsSync(dir)) {
          fsModule.mkdirSync(dir, { recursive: true });
        }
        fsModule.writeFileSync(DB_FILE, jsonStr, 'utf-8');
        saved = true;
      } catch {}
    }

    if (!saved && TMP_DB_FILE) {
      try {
        fsModule.writeFileSync(TMP_DB_FILE, jsonStr, 'utf-8');
      } catch {}
    }
  } catch (err) {}
}

function syncDiskImages() {
  return;
}

// Initial hydration from DB
if (typeof window === 'undefined') {
  loadFromDb();
  saveToDb();
}

let mongoSyncPromise: Promise<void> | null = null;
let lastMongoSyncTime = 0;
const MONGO_SYNC_TTL = 3000;

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

      const [mFarms, mPalms, mBatches, mSources, mInventory, mBookings, mEnquiries, mReviews, mAdjustments, mFaqs, mSettings, mBatchViews, mYouTube, mInstagram] = await Promise.all([
        FarmModel.find({}).lean(),
        ParentPalmModel.find({}).lean(),
        BatchModel.find({}).lean(),
        BatchSourceModel.find({}).lean(),
        BatchInventoryModel.find({}).lean(),
        BookingModel.find({}).lean(),
        EnquiryModel.find({}).lean(),
        ReviewModel.find({}).lean(),
        InventoryAdjustmentModel.find({}).lean(),
        FAQModel.find({}).lean(),
        SiteSettingsModel.findOne({ id: 'site_settings' }).lean(),
        BatchViewModel.find({}).lean(),
        YouTubeVideoModel.find({}).lean(),
        InstagramPostModel.find({}).lean()
      ]);

      if (Array.isArray(mFarms) && mFarms.length > 0) {
        farms = mFarms.map((f: any) => ({
          id: f.id || `farm-${f.farmCode?.toLowerCase() || Date.now()}`,
          farmCode: f.farmCode,
          farmName: f.farmName,
          ownerName: f.ownerName,
          ownerCode: f.ownerCode,
          locationCode: f.locationCode,
          location: f.location,
          status: f.status || 'Active',
          notes: f.notes || '',
          createdAt: f.createdAt || new Date().toISOString(),
          updatedAt: f.updatedAt || new Date().toISOString()
        }));
      }

      if (Array.isArray(mPalms) && mPalms.length > 0) {
        parentPalms = mPalms.map((p: any) => ({
          id: p.id || `mp-${Date.now()}`,
          motherTreeCode: p.motherTreeCode || p.code || 'ETH-RA-F001-MT001',
          code: p.code || p.motherTreeCode || 'ETH-RA-F001-MT001',
          farmId: p.farmId || (farms[0]?.id || 'farm-eth-ra-f001'),
          farmCode: p.farmCode || (farms[0]?.farmCode || 'ETH-RA-F001'),
          farmName: p.farmName || (farms[0]?.farmName || 'Eathamozhi Ancestral Heritage Coconut Farm'),
          name: p.name,
          variety: p.variety || 'West Coast Tall (Eathamozhi Tall)',
          age: p.age !== undefined && p.age !== null ? p.age : '40+ years',
          location: p.location || 'Heritage Grove',
          healthStatus: p.healthStatus || 'Excellent',
          yieldHistory: p.yieldHistory || '',
          description: p.description || '',
          nutCharacteristics: p.nutCharacteristics || '',
          whySelected: p.whySelected || '',
          images: Array.isArray(p.images) ? p.images : [],
          selectionStatus: p.selectionStatus || 'Selected',
          verificationStatus: p.verificationStatus || 'Verified',
          productionStatus: p.productionStatus || 'Active for Production',
          notes: p.notes || '',
          isVisible: p.isVisible !== false,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString()
        }));
      }

      if (Array.isArray(mBatches) && mBatches.length > 0) {
        batches = mBatches.map((b: any) => ({
          id: b.id || `b-${Date.now()}`,
          batchCode: b.batchCode,
          primaryFarmId: b.primaryFarmId || (farms[0]?.id || 'farm-eth-ra-f001'),
          primaryFarmCode: b.primaryFarmCode || (farms[0]?.farmCode || 'ETH-RA-F001'),
          batchMonth: Number(b.batchMonth) || 11,
          batchYear: Number(b.batchYear) || 2026,
          batchNumber: Number(b.batchNumber) || 1,
          totalCoconuts: Number(b.totalCoconuts) || 0,
          totalSeedlings: Number(b.totalSeedlings) || 0,
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
          images: Array.isArray(b.images) ? b.images : [],
          isVisible: b.isVisible !== false,
          createdAt: b.createdAt || new Date().toISOString(),
          updatedAt: b.updatedAt || new Date().toISOString()
        }));
      }

      if (Array.isArray(mSources) && mSources.length > 0) {
        batchSources = mSources.map((s: any) => ({ ...s }));
      }
      if (Array.isArray(mInventory) && mInventory.length > 0) {
        batchInventory = mInventory.map((i: any) => ({ ...i }));
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
      if (mSettings) {
        siteSettings = {
          showBatchesOnMainPage: mSettings.showBatchesOnMainPage !== false,
          showMotherTreesOnMainPage: mSettings.showMotherTreesOnMainPage !== false,
        };
      }
      if (Array.isArray(mBatchViews) && mBatchViews.length > 0) {
        batchViews = mBatchViews.map((v: any) => ({
          id: v.id || `bv-${v._id}`,
          batchCode: v.batchCode,
          visitorId: v.visitorId,
          firstViewedAt: v.firstViewedAt || new Date().toISOString(),
          lastViewedAt: v.lastViewedAt || new Date().toISOString()
        }));
      }
      if (Array.isArray(mYouTube) && mYouTube.length > 0) {
        youtubeVideos = mYouTube.map((yt: any) => ({
          id: yt.id || `yt-${yt._id}`,
          title: yt.title,
          url: yt.url,
          videoId: yt.videoId || extractYouTubeVideoId(yt.url) || undefined,
          order: Number(yt.order) || 0,
          isVisible: yt.isVisible !== false,
          createdAt: yt.createdAt || new Date().toISOString(),
          updatedAt: yt.updatedAt || new Date().toISOString()
        }));
      }
      if (Array.isArray(mInstagram) && mInstagram.length > 0) {
        instagramPosts = mInstagram.map((ig: any) => ({
          id: ig.id || `ig-${ig._id}`,
          title: ig.title,
          url: ig.url,
          order: Number(ig.order) || 0,
          isVisible: ig.isVisible !== false,
          createdAt: ig.createdAt || new Date().toISOString(),
          updatedAt: ig.updatedAt || new Date().toISOString()
        }));
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
  // ─── Farm Registry & Farm-Wise Dashboard ────────────────────────────────────
  getFarms: (): Farm[] => {
    loadFromDb();
    return farms.map(f => {
      const farmTrees = parentPalms.filter(p => p.farmId === f.id || p.farmCode === f.farmCode);
      const totalMotherTrees = farmTrees.length;
      const selectedMotherTrees = farmTrees.filter(p => p.selectionStatus === 'Selected').length;

      const fSources = batchSources.filter(s => s.farmId === f.id || s.farmCode === f.farmCode);
      const usedTreeIds = new Set(fSources.map(s => s.motherTreeCode || s.motherTreeId));
      const treesUsedInBatches = usedTreeIds.size;

      const activeBatchCodes = new Set(
        fSources.map(s => s.batchCode).filter(code => {
          const b = batches.find(bt => bt.batchCode.toLowerCase() === code.toLowerCase());
          return b && b.status !== 'SOLD_OUT';
        })
      );
      const activeBatches = activeBatchCodes.size;

      const fInv = batchInventory.filter(i => i.farmId === f.id || i.farmCode === f.farmCode);
      const totalCoconutsCollected = fSources.reduce((sum, s) => sum + (Number(s.coconutQuantity) || 0), 0);
      const totalSeedlingsProduced = fInv.reduce((sum, i) => sum + (Number(i.seedlingsProduced) || 0), 0);
      const availableSeedlings = fInv.reduce((sum, i) => sum + (Number(i.availableQuantity) || 0), 0);
      const bookedSeedlings = fInv.reduce((sum, i) => sum + (Number(i.bookedQuantity) || 0), 0);
      const dispatchedSeedlings = fInv.reduce((sum, i) => sum + (Number(i.dispatchedQuantity) || 0), 0);
      const damagedSeedlings = fInv.reduce((sum, i) => sum + (Number(i.damagedQuantity) || 0), 0);
      const rejectedSeedlings = fInv.reduce((sum, i) => sum + (Number(i.rejectedQuantity) || 0), 0);

      return {
        ...f,
        totalMotherTrees,
        selectedMotherTrees,
        treesUsedInBatches,
        activeBatches,
        totalCoconutsCollected,
        totalSeedlingsProduced,
        availableSeedlings,
        bookedSeedlings,
        dispatchedSeedlings,
        damagedSeedlings,
        rejectedSeedlings
      };
    });
  },

  getFarmsAsync: async (): Promise<Farm[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getFarms();
  },

  getFarmByCode: (code: string): Farm | undefined => {
    const list = DataStore.getFarms();
    return list.find(f => f.farmCode.toLowerCase() === code.toLowerCase() || f.id === code);
  },

  getFarmByCodeAsync: async (code: string): Promise<Farm | undefined> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getFarmByCode(code);
  },

  getFarmDetails: (code: string): any => {
    const farm = DataStore.getFarmByCode(code);
    if (!farm) return null;

    loadFromDb();
    const trees = parentPalms.filter(p => p.farmId === farm.id || p.farmCode === farm.farmCode);
    const selectedTrees = trees.filter(p => p.selectionStatus === 'Selected');
    const fSources = batchSources.filter(s => s.farmId === farm.id || s.farmCode === farm.farmCode);
    const usedTreeCodes = new Set(fSources.map(s => s.motherTreeCode));
    const usedTrees = trees.filter(p => usedTreeCodes.has(p.motherTreeCode || p.code));

    const farmBatchCodes = new Set(fSources.map(s => s.batchCode));
    const associatedBatches = batches.filter(
      b => farmBatchCodes.has(b.batchCode) || b.primaryFarmCode === farm.farmCode || b.primaryFarmId === farm.id
    );

    return {
      farm,
      motherTrees: trees,
      selectedMotherTrees: selectedTrees,
      treesUsedInBatches: usedTrees,
      batches: associatedBatches,
      sources: fSources,
      totalCoconutsCollected: farm.totalCoconutsCollected,
      totalSeedlingsProduced: farm.totalSeedlingsProduced,
      availableSeedlings: farm.availableSeedlings,
      bookedSeedlings: farm.bookedSeedlings,
      dispatchedSeedlings: farm.dispatchedSeedlings
    };
  },

  getFarmDetailsAsync: async (code: string): Promise<any> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getFarmDetails(code);
  },

  addFarm: (data: Partial<Farm>): Farm => {
    loadFromDb();
    const existingCodes = farms.map(f => f.farmCode);
    let farmCode = data.farmCode;
    let locationCode = data.locationCode;
    let ownerCode = data.ownerCode;

    if (!farmCode) {
      const loc = data.location || 'Eathamozhi';
      const owner = data.ownerName || 'Farm Owner';
      const cleanLoc = loc.replace(/[^a-zA-Z]/g, '').toUpperCase();
      locationCode = (cleanLoc.startsWith('EATH') || cleanLoc.startsWith('ETH')) ? 'ETH' : cleanLoc.slice(0, 3).padEnd(3, 'X');
      
      const distinct: string[] = [];
      const cleanOwner = owner.replace(/[^a-zA-Z]/g, '').toUpperCase();
      for (const char of cleanOwner) {
        if (!distinct.includes(char)) {
          distinct.push(char);
          if (distinct.length === 2) break;
        }
      }
      ownerCode = distinct.length === 1 ? distinct[0] + 'X' : (distinct.length >= 2 ? distinct.join('') : 'OW');

      const prefix = `${locationCode}-${ownerCode}`;
      let maxNum = 0;
      for (const ec of existingCodes) {
        if (ec.startsWith(prefix + '-F')) {
          const num = parseInt(ec.split('-F')[1], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
      farmCode = `${prefix}-F${String(maxNum + 1).padStart(3, '0')}`;
    }

    const newFarm: Farm = {
      id: `farm-${farmCode.toLowerCase()}`,
      farmCode,
      farmName: data.farmName || 'New Coconut Farm',
      ownerName: data.ownerName || 'Farm Owner',
      ownerCode: ownerCode || 'OW',
      locationCode: locationCode || 'ETH',
      location: data.location || 'Eathamozhi',
      status: data.status || 'Active',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    farms.unshift(newFarm);
    saveToDb();
    return DataStore.getFarmByCode(newFarm.farmCode)!;
  },

  addFarmAsync: async (data: Partial<Farm>): Promise<Farm> => {
    loadFromDb();
    await syncFromMongo();
    const existingCodes = farms.map(f => f.farmCode);
    const idGen = await generateFarmId(data.location || 'Eathamozhi', data.ownerName || 'Owner', existingCodes);
    const farmCode = data.farmCode || idGen.farmId;

    const newFarm: Farm = {
      id: `farm-${farmCode.toLowerCase()}`,
      farmCode,
      farmName: data.farmName || 'New Coconut Farm',
      ownerName: data.ownerName || 'Farm Owner',
      ownerCode: idGen.ownerCode,
      locationCode: idGen.locationCode,
      location: data.location || 'Eathamozhi',
      status: data.status || 'Active',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    farms.unshift(newFarm);
    saveToDb();

    try {
      const conn = await connectToDatabase();
      if (conn) {
        await FarmModel.findOneAndUpdate({ farmCode: newFarm.farmCode }, newFarm, { upsert: true, new: true });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to persist Farm to MongoDB:', err);
    }
    return DataStore.getFarmByCode(newFarm.farmCode)!;
  },

  updateFarm: (code: string, data: Partial<Farm>): Farm | null => {
    loadFromDb();
    const farm = farms.find(f => f.farmCode.toLowerCase() === code.toLowerCase() || f.id === code);
    if (!farm) return null;

    if (data.farmName !== undefined) farm.farmName = data.farmName;
    if (data.ownerName !== undefined) farm.ownerName = data.ownerName;
    if (data.location !== undefined) farm.location = data.location;
    if (data.status !== undefined) farm.status = data.status;
    if (data.notes !== undefined) farm.notes = data.notes;
    farm.updatedAt = new Date().toISOString();

    saveToDb();
    return DataStore.getFarmByCode(farm.farmCode) || null;
  },

  updateFarmAsync: async (code: string, data: Partial<Farm>): Promise<Farm | null> => {
    const updated = DataStore.updateFarm(code, data);
    if (updated) {
      try {
        const conn = await connectToDatabase();
        if (conn) {
          await FarmModel.findOneAndUpdate(
            { farmCode: updated.farmCode },
            { $set: updated },
            { new: true }
          );
          lastMongoSyncTime = 0;
        }
      } catch (err) {
        console.error('Failed to update Farm in MongoDB:', err);
      }
    }
    return updated;
  },

  canDeleteFarm: (code: string): { canDelete: boolean; reason?: string } => {
    loadFromDb();
    const farm = farms.find(f => f.farmCode.toLowerCase() === code.toLowerCase() || f.id === code);
    if (!farm) return { canDelete: false, reason: 'Farm not found' };

    const associatedTrees = parentPalms.filter(
      p => (p.farmCode && p.farmCode.toLowerCase() === farm.farmCode.toLowerCase()) || p.farmId === farm.id
    );
    if (associatedTrees.length > 0) {
      const treeCodes = associatedTrees.map(t => t.motherTreeCode || t.code).slice(0, 3).join(', ');
      return {
        canDelete: false,
        reason: `Cannot delete farm "${farm.farmName}" (${farm.farmCode}): It has ${associatedTrees.length} associated Mother Tree(s) [${treeCodes}${associatedTrees.length > 3 ? '...' : ''}]. Please reassign or delete the trees first.`
      };
    }

    const associatedBatches = batches.filter(
      b => (b.primaryFarmCode && b.primaryFarmCode.toLowerCase() === farm.farmCode.toLowerCase()) || b.primaryFarmId === farm.id
    );
    const associatedSources = batchSources.filter(
      s => (s.farmCode && s.farmCode.toLowerCase() === farm.farmCode.toLowerCase()) || s.farmId === farm.id
    );
    if (associatedBatches.length > 0 || associatedSources.length > 0) {
      return {
        canDelete: false,
        reason: `Cannot delete farm "${farm.farmName}" (${farm.farmCode}): It has associated batch records (${associatedBatches.length} batch(es), ${associatedSources.length} collection record(s)). Deletion is blocked to preserve traceability.`
      };
    }

    return { canDelete: true };
  },

  deleteFarm: (code: string): { success: boolean; reason?: string } => {
    loadFromDb();
    const check = DataStore.canDeleteFarm(code);
    if (!check.canDelete) {
      return { success: false, reason: check.reason };
    }
    const idx = farms.findIndex(f => f.farmCode.toLowerCase() === code.toLowerCase() || f.id === code);
    if (idx === -1) return { success: false, reason: 'Farm not found' };
    farms.splice(idx, 1);
    saveToDb();
    return { success: true };
  },

  deleteFarmAsync: async (code: string): Promise<{ success: boolean; reason?: string }> => {
    loadFromDb();
    await syncFromMongo();
    const res = DataStore.deleteFarm(code);
    if (res.success) {
      try {
        const conn = await connectToDatabase();
        if (conn) {
          await FarmModel.findOneAndDelete({ $or: [{ farmCode: code }, { id: code }] });
          lastMongoSyncTime = 0;
        }
      } catch (err) {
        console.error('Failed to delete Farm in MongoDB:', err);
      }
    }
    return res;
  },

  getFarmDashboardSummary: (): any => {
    const allFarms = DataStore.getFarms();
    loadFromDb();

    const totalFarms = allFarms.length;
    const totalMotherTrees = parentPalms.length;
    const totalSelectedMotherTrees = parentPalms.filter(p => p.selectionStatus === 'Selected').length;

    const usedTreeCodes = new Set(batchSources.map(s => s.motherTreeCode || s.motherTreeId));
    const totalMotherTreesUsedInBatches = usedTreeCodes.size;

    const activeBatches = batches.filter(b => b.status !== 'SOLD_OUT').length;
    const totalCoconutsCollected = batchSources.reduce((sum, s) => sum + (Number(s.coconutQuantity) || 0), 0);
    const totalSeedlingsProduced = batchInventory.reduce((sum, i) => sum + (Number(i.seedlingsProduced) || 0), 0);
    const totalAvailableSeedlings = batchInventory.reduce((sum, i) => sum + (Number(i.availableQuantity) || 0), 0);
    const totalBookedSeedlings = batchInventory.reduce((sum, i) => sum + (Number(i.bookedQuantity) || 0), 0);
    const totalDispatchedSeedlings = batchInventory.reduce((sum, i) => sum + (Number(i.dispatchedQuantity) || 0), 0);

    return {
      totalFarms,
      totalMotherTrees,
      totalSelectedMotherTrees,
      totalMotherTreesUsedInBatches,
      totalActiveBatches: activeBatches,
      totalCoconutsCollected,
      totalSeedlingsProduced,
      totalAvailableSeedlings,
      totalBookedSeedlings,
      totalDispatchedSeedlings,
      farms: allFarms
    };
  },

  getFarmDashboardSummaryAsync: async (): Promise<any> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getFarmDashboardSummary();
  },

  // ─── Batches ────────────────────────────────────────────────────────────────
  getBatches: (): Batch[] => {
    loadFromDb();
    return batches.map(b => {
      const bSources = batchSources.filter(s => s.batchCode.toLowerCase() === b.batchCode.toLowerCase() || s.batchId === b.id);
      const bInventory = batchInventory.filter(i => i.batchCode.toLowerCase() === b.batchCode.toLowerCase() || i.batchId === b.id);

      const activeBookings = bookings.filter(
        bk => bk.batchCode.toLowerCase() === b.batchCode.toLowerCase() && bk.bookingStatus !== 'Cancelled'
      );
      const computedBookedQuantity = activeBookings.reduce((sum, bk) => sum + bk.quantity, 0);

      let availableQuantity = 0;
      const netStock = Math.max(0, b.totalQuantity + (b.inventoryAdjustments || 0));
      if (bInventory.length > 0) {
        availableQuantity = bInventory.reduce((sum, i) => sum + (Number(i.availableQuantity) || 0), 0);
      } else {
        availableQuantity = Math.max(0, netStock - computedBookedQuantity);
      }

      const bookedPercentage = netStock > 0 ? Math.min(100, Math.round((computedBookedQuantity / netStock) * 100)) : 100;
      const dynamicStatus = getDynamicBatchStatus(availableQuantity, b.seededDate);
      const metrics = getSaplingMetrics(b.seededDate);
      const age = b.age || metrics.age || '8–10 Months';
      let height = b.height || metrics.height || '2.5–4.5 ft';
      if (!height.toLowerCase().startsWith('approx')) {
        height = `Approx. ${height}`;
      }
      const uniqueViewsCount = Math.max(
        Number(b.viewsCount) || 0,
        new Set(batchViews.filter(v => v.batchCode.toLowerCase() === b.batchCode.toLowerCase()).map(v => v.visitorId)).size
      );

      return {
        ...b,
        age,
        height,
        viewsCount: uniqueViewsCount,
        bookedQuantity: computedBookedQuantity,
        availableQuantity,
        bookedPercentage,
        status: (b.status === 'COMING_SOON' && dynamicStatus === 'COMING_SOON') ? 'COMING_SOON' : (availableQuantity <= 0 ? 'SOLD_OUT' : (availableQuantity < 50 ? 'LIMITED' : 'AVAILABLE')),
        sources: bSources,
        inventory: bInventory
      };
    });
  },

  getBatchesAsync: async (): Promise<Batch[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getBatches();
  },

  getOldestAvailableBatch: (): Batch | undefined => {
    const list = DataStore.getBatches();
    const available = list.filter(b => (b.status === 'AVAILABLE' || b.status === 'LIMITED') && b.isVisible !== false);
    if (available.length === 0) return undefined;
    return available.sort((a, b) => new Date(a.seededDate).getTime() - new Date(b.seededDate).getTime())[0];
  },

  getOldestAvailableBatchAsync: async (): Promise<Batch | undefined> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getOldestAvailableBatch();
  },

  getBatchByCode: (batchCode: string): Batch | null => {
    const list = DataStore.getBatches();
    return list.find(b => b.batchCode.toLowerCase() === batchCode.toLowerCase()) || null;
  },

  getBatchByCodeAsync: async (code: string): Promise<Batch | null> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getBatchByCode(code);
  },

  addBatch: (newBatchData: any): Batch | null => {
    loadFromDb();
    const primaryFarmCode = newBatchData.primaryFarmCode || (farms[0]?.farmCode || 'ETH-RA-F001');
    const primaryFarm = farms.find(f => f.farmCode.toLowerCase() === primaryFarmCode.toLowerCase()) || farms[0];
    const seededDate = newBatchData.seededDate || new Date().toISOString().split('T')[0];
    const harvestDate = newBatchData.harvestDate || seededDate;

    const seededDateObj = new Date(seededDate);
    const monthNum = seededDateObj.getMonth() + 1;
    const yearNum = seededDateObj.getFullYear();

    let batchCode = newBatchData.batchCode;
    if (!batchCode) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const fullMonth = monthNames[(monthNum || 1) - 1] || 'November';
      const twoDigitYear = String(yearNum || 2026).slice(-2);
      const prefix = `${primaryFarmCode}-${fullMonth}'${twoDigitYear}`;
      let maxSeq = 0;
      for (const b of batches) {
        if (b.batchCode.startsWith(prefix + '-B')) {
          const num = parseInt(b.batchCode.slice((prefix + '-B').length), 10);
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }
      }
      batchCode = `${prefix}-B${maxSeq + 1}`;
    }

    const defaultFolderImages = ['/images/placeholder.png'];

    let codes: string[] = [];
    if (Array.isArray(newBatchData.parentPalmCodes) && newBatchData.parentPalmCodes.length > 0) {
      codes = newBatchData.parentPalmCodes;
    } else if (newBatchData.parentPalmCode) {
      codes = [newBatchData.parentPalmCode];
    } else {
      codes = [parentPalms[0]?.code || 'ETH-RA-F001-MT001'];
    }
    const primaryCode = codes[0];
    const parent = parentPalms.find(p => (p.code && p.code.toLowerCase() === primaryCode.toLowerCase()) || (p.motherTreeCode && p.motherTreeCode.toLowerCase() === primaryCode.toLowerCase()));

    const batchName = newBatchData.name || formatBatchDisplayName(primaryFarmCode, batchCode, monthNum, yearNum);

    const metrics = getSaplingMetrics(seededDate);
    const age = newBatchData.age || metrics.age;
    let height = newBatchData.height || metrics.height;
    if (height && !height.toLowerCase().startsWith('approx')) {
      height = `Approx. ${height}`;
    }

    const created: Batch = {
      id: `b-${Date.now()}`,
      batchCode,
      primaryFarmId: primaryFarm?.id || 'farm-eth-ra-f001',
      primaryFarmCode,
      batchMonth: monthNum,
      batchYear: yearNum,
      batchNumber: parseInt(batchCode.split('-B')[1], 10) || 1,
      totalCoconuts: Number(newBatchData.totalCoconuts) || Number(newBatchData.totalQuantity) || 500,
      totalSeedlings: Number(newBatchData.totalQuantity) || 500,
      parentPalmId: parent ? parent.id : (newBatchData.parentPalmId || 'mp-1'),
      parentPalmCode: primaryCode,
      parentPalmCodes: codes,
      name: batchName,
      harvestDate,
      seededDate,
      age,
      height,
      totalQuantity: Number(newBatchData.totalQuantity) || 500,
      bookedQuantity: 0,
      inventoryAdjustments: 0,
      price: Number(newBatchData.price) || 150,
      status: 'AVAILABLE',
      description: newBatchData.description || '',
      viewsCount: 15,
      images: newBatchData.images && newBatchData.images.length > 0 ? newBatchData.images : defaultFolderImages,
      isVisible: newBatchData.isVisible !== undefined ? Boolean(newBatchData.isVisible) : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    batches.unshift(created);

    const sourcesInput: any[] = Array.isArray(newBatchData.sources) && newBatchData.sources.length > 0
      ? newBatchData.sources
      : codes.map(c => {
          const tree = parentPalms.find(p => p.code === c || p.motherTreeCode === c);
          const tFarm = farms.find(f => f.farmCode === (tree?.farmCode || primaryFarmCode)) || primaryFarm;
          const shareQty = Math.round(created.totalQuantity / codes.length);
          return {
            farmId: tFarm?.id || primaryFarm?.id || 'farm-eth-ra-f001',
            farmCode: tFarm?.farmCode || primaryFarmCode,
            farmName: tFarm?.farmName || primaryFarm?.farmName || 'Primary Farm',
            motherTreeId: tree?.id || `tree-${c}`,
            motherTreeCode: tree?.motherTreeCode || c,
            motherTreeName: tree?.name || c,
            coconutQuantity: shareQty,
            coconutsSown: shareQty,
            collectionDate: harvestDate,
            collectionStatus: 'Verified',
            germinatedQuantity: shareQty,
            rejectedQuantity: 0,
            notes: 'Batch initial seed nut allocation.'
          };
        });

    let totalCoconuts = 0;
    sourcesInput.forEach(s => {
      const sourceId = `bs-${created.batchCode}-${s.motherTreeCode}`;
      const batchSourceRecord: BatchSource = {
        id: sourceId,
        batchId: created.id,
        batchCode: created.batchCode,
        farmId: s.farmId || primaryFarm?.id || 'farm-eth-ra-f001',
        farmCode: s.farmCode || primaryFarmCode,
        farmName: s.farmName || primaryFarm?.farmName || 'Primary Farm',
        motherTreeId: s.motherTreeId,
        motherTreeCode: s.motherTreeCode,
        motherTreeName: s.motherTreeName,
        coconutQuantity: Number(s.coconutQuantity) || 100,
        coconutsSown: Number(s.coconutsSown) || Number(s.coconutQuantity) || 100,
        collectionDate: s.collectionDate || harvestDate,
        collectionStatus: s.collectionStatus || 'Verified',
        germinatedQuantity: Number(s.germinatedQuantity) || Number(s.coconutQuantity) || 100,
        rejectedQuantity: Number(s.rejectedQuantity) || 0,
        notes: s.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      batchSources.push(batchSourceRecord);
      totalCoconuts += batchSourceRecord.coconutQuantity;

      const produced = batchSourceRecord.germinatedQuantity || batchSourceRecord.coconutQuantity;
      const batchInvRecord: BatchInventory = {
        id: `bi-${sourceId}`,
        batchId: created.id,
        batchCode: created.batchCode,
        batchSourceId: sourceId,
        farmId: batchSourceRecord.farmId,
        farmCode: batchSourceRecord.farmCode,
        motherTreeId: batchSourceRecord.motherTreeId,
        motherTreeCode: batchSourceRecord.motherTreeCode,
        seedlingsProduced: produced,
        availableQuantity: produced,
        bookedQuantity: 0,
        dispatchedQuantity: 0,
        damagedQuantity: 0,
        rejectedQuantity: 0,
        updatedAt: new Date().toISOString()
      };
      batchInventory.push(batchInvRecord);
    });

    created.totalCoconuts = totalCoconuts;
    saveToDb();
    return DataStore.getBatchByCode(created.batchCode);
  },

  addBatchAsync: async (newBatchData: any): Promise<Batch | null> => {
    loadFromDb();
    await syncFromMongo();

    const existingCodes = batches.map(b => b.batchCode);
    const primaryFarmCode = newBatchData.primaryFarmCode || (farms[0]?.farmCode || 'ETH-RA-F001');
    const seededDate = newBatchData.seededDate || new Date().toISOString().split('T')[0];

    let batchCode = newBatchData.batchCode;
    let monthNum = 11;
    let yearNum = 2026;
    if (!batchCode) {
      const generated = await generateBatchId(primaryFarmCode, seededDate, existingCodes);
      batchCode = generated.batchId;
      monthNum = generated.monthNum;
      yearNum = generated.yearNum;
    } else {
      const d = new Date(seededDate);
      monthNum = d.getMonth() + 1;
      yearNum = d.getFullYear();
    }

    const payload = {
      ...newBatchData,
      batchCode,
      name: newBatchData.name || formatBatchDisplayName(primaryFarmCode, batchCode, monthNum, yearNum)
    };

    const created = DataStore.addBatch(payload);
    try {
      const conn = await connectToDatabase();
      if (conn && created) {
        await BatchModel.findOneAndUpdate({ batchCode: created.batchCode }, created, { upsert: true, new: true });
        
        const sources = batchSources.filter(s => s.batchCode === created.batchCode);
        for (const s of sources) {
          await BatchSourceModel.findOneAndUpdate({ id: s.id }, s, { upsert: true, new: true });
        }
        const invs = batchInventory.filter(i => i.batchCode === created.batchCode);
        for (const i of invs) {
          await BatchInventoryModel.findOneAndUpdate({ id: i.id }, i, { upsert: true, new: true });
        }
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to persist Batch to MongoDB:', err);
    }
    return created;
  },

  updateBatch: (code: string, updatedFields: Partial<Batch> & { parentPalmCodes?: string[] }): Batch | null => {
    loadFromDb();
    const target = batches.find(b => b.batchCode.toLowerCase() === code.toLowerCase());
    if (!target) return null;

    if (updatedFields.isVisible !== undefined) target.isVisible = Boolean(updatedFields.isVisible);
    if (updatedFields.price !== undefined) target.price = Number(updatedFields.price);
    if (updatedFields.totalQuantity !== undefined) target.totalQuantity = Number(updatedFields.totalQuantity);
    if (updatedFields.harvestDate) target.harvestDate = updatedFields.harvestDate;
    if (updatedFields.seededDate) target.seededDate = updatedFields.seededDate;
    if (updatedFields.age !== undefined) target.age = updatedFields.age;
    if (updatedFields.height !== undefined) {
      let h = String(updatedFields.height).trim();
      if (h && !h.toLowerCase().startsWith('approx')) {
        h = `Approx. ${h}`;
      }
      target.height = h;
    }
    if (updatedFields.description !== undefined) target.description = updatedFields.description;
    if (updatedFields.name) target.name = updatedFields.name;
    if (updatedFields.images) target.images = updatedFields.images;
    if (Array.isArray(updatedFields.parentPalmCodes) && updatedFields.parentPalmCodes.length > 0) {
      target.parentPalmCodes = updatedFields.parentPalmCodes;
      target.parentPalmCode = updatedFields.parentPalmCodes[0];
    }
    target.updatedAt = new Date().toISOString();

    saveToDb();
    return DataStore.getBatchByCode(target.batchCode);
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

  deleteBatch: (code: string): boolean => {
    loadFromDb();
    const idx = batches.findIndex(b => b.batchCode.toLowerCase() === code.toLowerCase());
    if (idx === -1) return false;
    batches.splice(idx, 1);
    batchSources = batchSources.filter(s => s.batchCode.toLowerCase() !== code.toLowerCase());
    batchInventory = batchInventory.filter(i => i.batchCode.toLowerCase() !== code.toLowerCase());
    saveToDb();
    return true;
  },

  deleteBatchAsync: async (code: string): Promise<boolean> => {
    const success = DataStore.deleteBatch(code);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await Promise.all([
          BatchModel.findOneAndDelete({ batchCode: new RegExp('^' + code + '$', 'i') }),
          BatchSourceModel.deleteMany({ batchCode: new RegExp('^' + code + '$', 'i') }),
          BatchInventoryModel.deleteMany({ batchCode: new RegExp('^' + code + '$', 'i') })
        ]);
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to delete Batch from MongoDB:', err);
    }
    return success;
  },

  // ─── Mother Tree / Parent Palm Registry ─────────────────────────────────────
  getParentPalms: (): MotherTree[] => {
    loadFromDb();
    return parentPalms.map(p => {
      const pCode = p.code || p.motherTreeCode || 'ETH-RA-F001-MT001';
      const mCode = p.motherTreeCode || p.code || 'ETH-RA-F001-MT001';
      const pSources = batchSources.filter(
        s => (s.motherTreeCode && s.motherTreeCode.toLowerCase() === mCode.toLowerCase()) || s.motherTreeId === p.id
      );
      const usedBatchCodes = new Set(pSources.map(s => s.batchCode));
      const batchesUsedCount = usedBatchCodes.size;
      const totalCoconutsCollected = pSources.reduce((sum, s) => sum + (Number(s.coconutQuantity) || 0), 0);

      const pInv = batchInventory.filter(
        i => (i.motherTreeCode && i.motherTreeCode.toLowerCase() === mCode.toLowerCase()) || i.motherTreeId === p.id
      );
      const totalSeedlingsProduced = pInv.reduce((sum, i) => sum + (Number(i.seedlingsProduced) || 0), 0);

      return {
        ...p,
        code: pCode,
        motherTreeCode: mCode,
        batchesUsedCount,
        totalCoconutsCollected,
        totalSeedlingsProduced
      };
    });
  },

  getParentPalmsAsync: async (): Promise<MotherTree[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getParentPalms();
  },

  getParentPalmByCode: (code: string): MotherTree | null => {
    const list = DataStore.getParentPalms();
    return list.find(p => (p.code && p.code.toLowerCase() === code.toLowerCase()) || (p.motherTreeCode && p.motherTreeCode.toLowerCase() === code.toLowerCase()) || p.id === code) || null;
  },

  getParentPalmByCodeAsync: async (code: string): Promise<MotherTree | null> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getParentPalmByCode(code);
  },

  getParentPalmsByFarm: (farmCode: string): MotherTree[] => {
    const list = DataStore.getParentPalms();
    return list.filter(p => (p.farmCode && p.farmCode.toLowerCase() === farmCode.toLowerCase()) || p.farmId === farmCode);
  },

  getParentPalmsByFarmAsync: async (farmCode: string): Promise<MotherTree[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getParentPalmsByFarm(farmCode);
  },

  addParentPalm: (data: any): MotherTree => {
    loadFromDb();
    const farmCode = data.farmCode || (farms[0]?.farmCode || 'ETH-RA-F001');
    const farm = farms.find(f => f.farmCode.toLowerCase() === farmCode.toLowerCase()) || farms[0];
    const existingCodes = parentPalms.map(p => p.motherTreeCode || p.code);

    let motherTreeCode = data.motherTreeCode;
    if (!motherTreeCode) {
      const prefix = `${farmCode}-MT`;
      let maxNum = 0;
      for (const ec of existingCodes) {
        if (ec && ec.startsWith(prefix)) {
          const num = parseInt(ec.split('-MT')[1], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
      motherTreeCode = `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
    }

    const code = data.code || motherTreeCode;
    const newTree: MotherTree = {
      id: `mp-${Date.now()}`,
      motherTreeCode,
      code,
      farmId: farm?.id || 'farm-eth-ra-f001',
      farmCode: farm?.farmCode || farmCode,
      farmName: farm?.farmName || 'Eathamozhi Ancestral Heritage Coconut Farm',
      name: data.name || `Mother Palm ${motherTreeCode}`,
      variety: data.variety || 'West Coast Tall (Eathamozhi Tall)',
      age: data.age !== undefined && data.age !== null && data.age !== '' ? data.age : '40+ years',
      location: data.location || farm?.location || 'Heritage Grove',
      healthStatus: data.healthStatus || 'Excellent',
      yieldHistory: data.yieldHistory || 'High-yielding verified genetic stock.',
      description: data.description || '',
      nutCharacteristics: data.nutCharacteristics || 'Large spherical nuts with high copra yield.',
      whySelected: data.whySelected || 'Verified vigorous ancestral genetics.',
      images: Array.isArray(data.images) ? data.images : [],
      selectionStatus: data.selectionStatus || 'Selected',
      verificationStatus: data.verificationStatus || 'Verified',
      productionStatus: data.productionStatus || 'Active for Production',
      notes: data.notes || '',
      isVisible: data.isVisible !== undefined ? Boolean(data.isVisible) : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    parentPalms.unshift(newTree);
    saveToDb();
    return DataStore.getParentPalmByCode(newTree.code)!;
  },

  addParentPalmAsync: async (data: any): Promise<MotherTree> => {
    loadFromDb();
    await syncFromMongo();
    const farmCode = data.farmCode || (farms[0]?.farmCode || 'ETH-RA-F001');
    const existingCodes = parentPalms.map(p => p.motherTreeCode || p.code).filter(Boolean);
    const motherTreeCode = data.motherTreeCode || await generateMotherTreeId(farmCode, existingCodes);

    const payload = {
      ...data,
      farmCode,
      motherTreeCode,
      code: data.code || motherTreeCode
    };

    const created = DataStore.addParentPalm(payload);
    try {
      const conn = await connectToDatabase();
      if (conn && created) {
        await MotherTreeModel.findOneAndUpdate({ code: created.code }, created, { upsert: true, new: true });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to persist MotherTree to MongoDB:', err);
    }
    return created;
  },

  updateParentPalm: (code: string, updatedFields: any): MotherTree | null => {
    loadFromDb();
    const palm = parentPalms.find(p => (p.code && p.code.toLowerCase() === code.toLowerCase()) || (p.motherTreeCode && p.motherTreeCode.toLowerCase() === code.toLowerCase()) || p.id === code);
    if (!palm) return null;

    if (updatedFields.farmCode) {
      const f = farms.find(farm => farm.farmCode.toLowerCase() === updatedFields.farmCode.toLowerCase() || farm.id === updatedFields.farmCode);
      if (f) {
        palm.farmCode = f.farmCode;
        palm.farmId = f.id;
        palm.farmName = f.farmName;

        // Keep batchSources and batchInventory synchronized
        for (const s of batchSources) {
          if (s.motherTreeCode === palm.motherTreeCode || s.motherTreeId === palm.id) {
            s.farmCode = f.farmCode;
            s.farmId = f.id;
            s.farmName = f.farmName;
          }
        }
        for (const inv of batchInventory) {
          if (inv.motherTreeCode === palm.motherTreeCode || inv.motherTreeId === palm.id) {
            inv.farmCode = f.farmCode;
            inv.farmId = f.id;
          }
        }
      }
    }

    if (updatedFields.name) palm.name = updatedFields.name;
    if (updatedFields.age !== undefined) palm.age = updatedFields.age;
    if (updatedFields.variety) palm.variety = updatedFields.variety;
    if (updatedFields.location) palm.location = updatedFields.location;
    if (updatedFields.healthStatus) palm.healthStatus = updatedFields.healthStatus;
    if (updatedFields.yieldHistory) palm.yieldHistory = updatedFields.yieldHistory;
    if (updatedFields.description !== undefined) palm.description = updatedFields.description;
    if (updatedFields.nutCharacteristics !== undefined) palm.nutCharacteristics = updatedFields.nutCharacteristics;
    if (updatedFields.whySelected !== undefined) palm.whySelected = updatedFields.whySelected;
    if (updatedFields.images) palm.images = updatedFields.images;
    if (updatedFields.isVisible !== undefined) palm.isVisible = Boolean(updatedFields.isVisible);
    if (updatedFields.selectionStatus) palm.selectionStatus = updatedFields.selectionStatus;
    if (updatedFields.verificationStatus) palm.verificationStatus = updatedFields.verificationStatus;
    if (updatedFields.productionStatus) palm.productionStatus = updatedFields.productionStatus;
    if (updatedFields.notes !== undefined) palm.notes = updatedFields.notes;
    palm.updatedAt = new Date().toISOString();

    saveToDb();
    return DataStore.getParentPalmByCode(palm.code) || null;
  },

  updateParentPalmAsync: async (code: string, updatedFields: any): Promise<MotherTree | null> => {
    const updated = DataStore.updateParentPalm(code, updatedFields);
    try {
      const conn = await connectToDatabase();
      if (conn && updated) {
        await MotherTreeModel.findOneAndUpdate(
          { $or: [{ code: new RegExp('^' + code + '$', 'i') }, { id: code }, { motherTreeCode: code }] },
          { $set: updated },
          { new: true }
        );

        if (updatedFields.farmCode) {
          await BatchSourceModel.updateMany(
            { $or: [{ motherTreeCode: updated.motherTreeCode }, { motherTreeId: updated.id }] },
            { $set: { farmCode: updated.farmCode, farmId: updated.farmId, farmName: updated.farmName } }
          );
          await BatchInventoryModel.updateMany(
            { $or: [{ motherTreeCode: updated.motherTreeCode }, { motherTreeId: updated.id }] },
            { $set: { farmCode: updated.farmCode, farmId: updated.farmId } }
          );
        }

        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to update MotherTree in MongoDB:', err);
    }
    return updated;
  },

  deleteParentPalm: (code: string): boolean => {
    loadFromDb();
    const idx = parentPalms.findIndex(p => (p.code && p.code.toLowerCase() === code.toLowerCase()) || (p.motherTreeCode && p.motherTreeCode.toLowerCase() === code.toLowerCase()) || p.id === code);
    if (idx === -1) return false;
    parentPalms.splice(idx, 1);
    saveToDb();
    return true;
  },

  deleteParentPalmAsync: async (code: string): Promise<boolean> => {
    const success = DataStore.deleteParentPalm(code);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await MotherTreeModel.findOneAndDelete({
          $or: [{ code: new RegExp('^' + code + '$', 'i') }, { id: code }, { motherTreeCode: code }]
        });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to delete MotherTree from MongoDB:', err);
    }
    return success;
  },

  // ─── Germination & Seedling Inventory Tracking ──────────────────────────────
  getBatchSources: (batchCode?: string): BatchSource[] => {
    loadFromDb();
    if (!batchCode) return batchSources;
    return batchSources.filter(s => s.batchCode.toLowerCase() === batchCode.toLowerCase());
  },

  getBatchSourcesAsync: async (batchCode?: string): Promise<BatchSource[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getBatchSources(batchCode);
  },

  getBatchInventory: (batchCode?: string): BatchInventory[] => {
    loadFromDb();
    if (!batchCode) return batchInventory;
    return batchInventory.filter(i => i.batchCode.toLowerCase() === batchCode.toLowerCase());
  },

  getBatchInventoryAsync: async (batchCode?: string): Promise<BatchInventory[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getBatchInventory(batchCode);
  },

  updateGermination: (sourceId: string, data: any): BatchSource | null => {
    loadFromDb();
    const source = batchSources.find(s => s.id === sourceId);
    if (!source) return null;

    if (data.coconutsSown !== undefined) source.coconutsSown = Number(data.coconutsSown);
    if (data.germinatedQuantity !== undefined) source.germinatedQuantity = Number(data.germinatedQuantity);
    if (data.rejectedQuantity !== undefined) source.rejectedQuantity = Number(data.rejectedQuantity);
    if (source.coconutsSown && source.coconutsSown > 0) {
      source.germinationRate = `${Math.round(((source.germinatedQuantity || 0) / source.coconutsSown) * 100)}%`;
    }
    if (data.collectionStatus) source.collectionStatus = data.collectionStatus;
    if (data.germinationStartDate) source.germinationStartDate = data.germinationStartDate;
    if (data.germinationEndDate) source.germinationEndDate = data.germinationEndDate;
    if (data.notes !== undefined) source.notes = data.notes;
    source.updatedAt = new Date().toISOString();

    const inv = batchInventory.find(i => i.batchSourceId === source.id);
    if (inv) {
      inv.seedlingsProduced = source.germinatedQuantity;
      inv.rejectedQuantity = source.rejectedQuantity;
      inv.availableQuantity = Math.max(
        0,
        inv.seedlingsProduced - inv.bookedQuantity - inv.dispatchedQuantity - inv.damagedQuantity - inv.rejectedQuantity
      );
      inv.updatedAt = new Date().toISOString();
    }

    const b = batches.find(bt => bt.batchCode.toLowerCase() === source.batchCode.toLowerCase());
    if (b) {
      const bInvs = batchInventory.filter(i => i.batchCode.toLowerCase() === b.batchCode.toLowerCase());
      b.totalQuantity = bInvs.reduce((sum, i) => sum + (Number(i.seedlingsProduced) || 0), 0);
    }

    saveToDb();
    return source;
  },

  updateGerminationAsync: async (sourceId: string, data: any): Promise<BatchSource | null> => {
    const updated = DataStore.updateGermination(sourceId, data);
    if (updated) {
      try {
        const conn = await connectToDatabase();
        if (conn) {
          await BatchSourceModel.findOneAndUpdate({ id: sourceId }, { $set: updated }, { new: true });
          const inv = batchInventory.find(i => i.batchSourceId === sourceId);
          if (inv) {
            await BatchInventoryModel.findOneAndUpdate({ id: inv.id }, { $set: inv }, { new: true });
          }
          const b = batches.find(bt => bt.batchCode.toLowerCase() === updated.batchCode.toLowerCase());
          if (b) {
            await BatchModel.findOneAndUpdate({ batchCode: b.batchCode }, { $set: { totalQuantity: b.totalQuantity } });
          }
          lastMongoSyncTime = 0;
        }
      } catch (err) {
        console.error('Failed to update Germination in MongoDB:', err);
      }
    }
    return updated;
  },

  adjustSourceInventory: (sourceId: string, changes: any): BatchInventory | null => {
    loadFromDb();
    const inv = batchInventory.find(i => i.batchSourceId === sourceId || i.id === sourceId);
    if (!inv) return null;

    if (changes.damagedQuantity !== undefined) inv.damagedQuantity = Number(changes.damagedQuantity);
    if (changes.rejectedQuantity !== undefined) inv.rejectedQuantity = Number(changes.rejectedQuantity);
    if (changes.availableQuantity !== undefined) inv.availableQuantity = Number(changes.availableQuantity);

    inv.availableQuantity = Math.max(
      0,
      inv.seedlingsProduced - inv.bookedQuantity - inv.dispatchedQuantity - inv.damagedQuantity - inv.rejectedQuantity
    );
    inv.updatedAt = new Date().toISOString();

    saveToDb();
    return inv;
  },

  adjustSourceInventoryAsync: async (sourceId: string, changes: any): Promise<BatchInventory | null> => {
    const updated = DataStore.adjustSourceInventory(sourceId, changes);
    if (updated) {
      try {
        const conn = await connectToDatabase();
        if (conn) {
          await BatchInventoryModel.findOneAndUpdate({ id: updated.id }, { $set: updated }, { new: true });
          lastMongoSyncTime = 0;
        }
      } catch (err) {
        console.error('Failed to update BatchInventory in MongoDB:', err);
      }
    }
    return updated;
  },

  // ─── Customer Orders & Traceability ─────────────────────────────────────────
  getBookings: (): Booking[] => {
    loadFromDb();
    return bookings.map(b => ({ ...b }));
  },

  getBookingsAsync: async (): Promise<Booking[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getBookings();
  },

  getOrders: (): Booking[] => {
    return DataStore.getBookings();
  },

  getBookingsByMobile: (mobile: string): Booking[] => {
    loadFromDb();
    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    return bookings.filter(b => b.mobile && b.mobile.replace(/[^0-9]/g, '').endsWith(cleanMobile));
  },

  getBookingsByMobileAsync: async (mobile: string): Promise<Booking[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getBookingsByMobile(mobile);
  },

  getBookingById: (id: string, mobile?: string): Booking | null => {
    loadFromDb();
    const b = bookings.find(item => item.id === id || item.bookingId === id);
    if (!b) return null;
    if (mobile) {
      const cleanInput = mobile.replace(/[^0-9]/g, '');
      const cleanStored = b.mobile ? b.mobile.replace(/[^0-9]/g, '') : '';
      if (!cleanStored.endsWith(cleanInput)) return null;
    }
    return { ...b };
  },

  getBookingByIdAsync: async (bookingId: string, mobile?: string): Promise<Booking | null> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getBookingById(bookingId, mobile);
  },

  createBooking: (data: Omit<Booking, 'id' | 'bookingId' | 'createdAt' | 'paymentStatus' | 'bookingStatus'> & { paymentScreenshotUrl?: string; bookingStatus?: string }): Booking => {
    loadFromDb();
    const batch = DataStore.getBatchByCode(data.batchCode);
    if (!batch || (batch.availableQuantity !== undefined && batch.availableQuantity < data.quantity)) {
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

    const bInvs = batchInventory.filter(i => i.batchCode.toLowerCase() === data.batchCode.toLowerCase());
    const allocations: any[] = [];
    let remainingToAllocate = data.quantity;

    for (const inv of bInvs) {
      if (remainingToAllocate <= 0) break;
      const alloc = Math.min(inv.availableQuantity, remainingToAllocate);
      if (alloc > 0) {
        inv.bookedQuantity += alloc;
        inv.availableQuantity = Math.max(0, inv.availableQuantity - alloc);
        inv.updatedAt = new Date().toISOString();
        allocations.push({
          batchSourceId: inv.batchSourceId,
          farmId: inv.farmId,
          farmCode: inv.farmCode,
          motherTreeId: inv.motherTreeId,
          motherTreeCode: inv.motherTreeCode,
          quantity: alloc
        });
        remainingToAllocate -= alloc;
      }
    }

    const sourceFarmCodes = Array.from(new Set(allocations.map(a => a.farmCode)));
    const isMixedSource = sourceFarmCodes.length > 1 || (allocations.length > 1);

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
      createdAt: new Date().toISOString(),
      allocations,
      sourceFarmCode: sourceFarmCodes[0] || (batch.primaryFarmCode || 'ETH-RA-F001'),
      sourceMotherTreeCode: allocations[0]?.motherTreeCode || batch.parentPalmCode,
      isMixedSource
    };

    bookings.unshift(newBooking);
    saveToDb();
    return newBooking;
  },

  createBookingAsync: async (data: any): Promise<Booking> => {
    loadFromDb();
    await syncFromMongo();
    const created = DataStore.createBooking(data);

    try {
      const conn = await connectToDatabase();
      if (conn) {
        await BookingModel.findOneAndUpdate({ bookingId: created.bookingId }, created, { upsert: true, new: true });
        
        if (created.allocations && created.allocations.length > 0) {
          for (const a of created.allocations) {
            const inv = batchInventory.find(i => i.batchSourceId === a.batchSourceId);
            if (inv) {
              await BatchInventoryModel.findOneAndUpdate({ id: inv.id }, { $set: inv }, { new: true });
            }
          }
        }
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to persist Booking to MongoDB:', err);
    }
    return created;
  },

  updateBookingStatus: (bookingId: string, status: Booking['bookingStatus'], courierName?: string, trackingId?: string): Booking | null => {
    loadFromDb();
    const bk = bookings.find(b => b.bookingId === bookingId || b.id === bookingId);
    if (!bk) return null;

    const prevStatus = bk.bookingStatus;
    bk.bookingStatus = status;

    if (status === 'Confirmed' || status === 'Preparing' || status === 'Dispatched' || status === 'Delivered') {
      bk.paymentStatus = 'PAID';
    }
    if (courierName) bk.courierName = courierName;
    if (trackingId) bk.trackingId = trackingId;
    if (status === 'Dispatched') bk.dispatchDate = new Date().toISOString().split('T')[0];

    // Source level inventory transitions (avoid double subtraction!)
    if (status === 'Dispatched' && prevStatus !== 'Dispatched' && prevStatus !== 'Delivered') {
      if (Array.isArray(bk.allocations) && bk.allocations.length > 0) {
        for (const alloc of bk.allocations) {
          const inv = batchInventory.find(i => i.batchSourceId === alloc.batchSourceId);
          if (inv) {
            inv.bookedQuantity = Math.max(0, inv.bookedQuantity - alloc.quantity);
            inv.dispatchedQuantity += alloc.quantity;
            inv.updatedAt = new Date().toISOString();
          }
        }
      } else {
        const bInvs = batchInventory.filter(i => i.batchCode.toLowerCase() === bk.batchCode.toLowerCase());
        if (bInvs.length > 0) {
          const share = Math.round(bk.quantity / bInvs.length);
          for (const inv of bInvs) {
            inv.bookedQuantity = Math.max(0, inv.bookedQuantity - share);
            inv.dispatchedQuantity += share;
            inv.updatedAt = new Date().toISOString();
          }
        }
      }
    } else if (status === 'Cancelled' && prevStatus !== 'Cancelled') {
      if (Array.isArray(bk.allocations) && bk.allocations.length > 0) {
        for (const alloc of bk.allocations) {
          const inv = batchInventory.find(i => i.batchSourceId === alloc.batchSourceId);
          if (inv) {
            inv.bookedQuantity = Math.max(0, inv.bookedQuantity - alloc.quantity);
            inv.availableQuantity += alloc.quantity;
            inv.updatedAt = new Date().toISOString();
          }
        }
      }
    }

    saveToDb();
    return bk;
  },

  updateBookingStatusAsync: async (bookingId: string, status: any, courierName?: string, trackingId?: string): Promise<Booking | null> => {
    const updated = DataStore.updateBookingStatus(bookingId, status, courierName, trackingId);
    if (updated) {
      try {
        const conn = await connectToDatabase();
        if (conn) {
          await BookingModel.findOneAndUpdate(
            { $or: [{ id: bookingId }, { bookingId }] },
            { $set: updated },
            { new: true }
          );
          const bInvs = batchInventory.filter(i => i.batchCode.toLowerCase() === updated.batchCode.toLowerCase());
          for (const inv of bInvs) {
            await BatchInventoryModel.findOneAndUpdate({ id: inv.id }, { $set: inv }, { new: true });
          }
          lastMongoSyncTime = 0;
        }
      } catch (err) {
        console.error('Failed to update Booking status in MongoDB:', err);
      }
    }
    return updated;
  },

  updateOrder: (orderId: string, changes: Partial<Booking>): Booking => {
    loadFromDb();
    const bk = bookings.find(b => b.id === orderId || b.bookingId === orderId);
    if (!bk) throw new Error('Order not found');
    Object.assign(bk, changes);
    saveToDb();
    return bk;
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

  // ─── Traceability Lookups ───────────────────────────────────────────────────
  getBatchTraceability: (batchCode: string): any => {
    loadFromDb();
    const batch = DataStore.getBatchByCode(batchCode);
    if (!batch) return null;

    const sources = batchSources.filter(s => s.batchCode.toLowerCase() === batchCode.toLowerCase() || s.batchId === batch.id);
    const inventory = batchInventory.filter(i => i.batchCode.toLowerCase() === batchCode.toLowerCase() || i.batchId === batch.id);

    const contributingFarms = Array.from(new Set(sources.map(s => s.farmCode))).map(fCode => {
      return farms.find(f => f.farmCode === fCode) || { farmCode: fCode, farmName: fCode };
    });

    const motherTreeList = sources.map(s => {
      const tree = parentPalms.find(p => p.motherTreeCode === s.motherTreeCode || p.code === s.motherTreeCode);
      const inv = inventory.find(i => i.batchSourceId === s.id);
      return {
        sourceId: s.id,
        farmId: s.farmId,
        farmCode: s.farmCode,
        farmName: s.farmName,
        motherTreeId: s.motherTreeId,
        motherTreeCode: s.motherTreeCode,
        motherTreeName: s.motherTreeName || tree?.name,
        variety: tree?.variety || 'West Coast Tall (Eathamozhi Tall)',
        age: tree?.age,
        coconutQuantity: s.coconutQuantity,
        coconutsSown: s.coconutsSown,
        collectionDate: s.collectionDate,
        collectionStatus: s.collectionStatus,
        seedlingsProduced: inv?.seedlingsProduced || s.germinatedQuantity || 0,
        availableQuantity: inv?.availableQuantity || 0,
        bookedQuantity: inv?.bookedQuantity || 0,
        dispatchedQuantity: inv?.dispatchedQuantity || 0
      };
    });

    return {
      batchCode: batch.batchCode,
      batchName: batch.name,
      primaryFarmCode: batch.primaryFarmCode,
      harvestDate: batch.harvestDate,
      seededDate: batch.seededDate,
      totalQuantity: batch.totalQuantity,
      availableQuantity: batch.availableQuantity,
      bookedQuantity: batch.bookedQuantity,
      isMixedSource: contributingFarms.length > 1 || motherTreeList.length > 1,
      contributingFarmsCount: contributingFarms.length,
      contributingFarms,
      motherTreesCount: motherTreeList.length,
      sources: motherTreeList
    };
  },

  getBatchTraceabilityAsync: async (batchCode: string): Promise<any> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getBatchTraceability(batchCode);
  },

  getOrderTraceability: (bookingId: string): any => {
    loadFromDb();
    const bk = bookings.find(b => b.bookingId === bookingId || b.id === bookingId);
    if (!bk) return null;

    const batchTrace = DataStore.getBatchTraceability(bk.batchCode);
    return {
      bookingId: bk.bookingId,
      customerName: bk.customerName,
      quantity: bk.quantity,
      bookingStatus: bk.bookingStatus,
      paymentStatus: bk.paymentStatus,
      createdAt: bk.createdAt,
      dispatchDate: bk.dispatchDate,
      courierName: bk.courierName,
      trackingId: bk.trackingId,
      allocations: bk.allocations || [],
      isMixedSource: bk.isMixedSource || (batchTrace ? batchTrace.isMixedSource : false),
      batch: batchTrace
    };
  },

  getOrderTraceabilityAsync: async (bookingId: string): Promise<any> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getOrderTraceability(bookingId);
  },

  // ─── Module 9: Reports and Analytics ────────────────────────────────────────
  getReports: (reportType: string, startDate?: string, endDate?: string): any => {
    loadFromDb();
    const filterByDate = (dateStr: string) => {
      if (!dateStr) return true;
      const d = dateStr.slice(0, 10);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    };

    switch (reportType) {
      case 'farm-mother-trees':
        return farms.map(f => {
          const trees = parentPalms.filter(p => p.farmId === f.id || p.farmCode === f.farmCode);
          return {
            farmCode: f.farmCode,
            farmName: f.farmName,
            location: f.location,
            totalTrees: trees.length,
            selectedTrees: trees.filter(t => t.selectionStatus === 'Selected').length,
            verifiedTrees: trees.filter(t => t.verificationStatus === 'Verified').length,
            activeProductionTrees: trees.filter(t => t.productionStatus === 'Active for Production').length,
            trees: trees.map(t => ({
              motherTreeCode: t.motherTreeCode || t.code,
              name: t.name,
              variety: t.variety,
              age: t.age,
              selectionStatus: t.selectionStatus,
              verificationStatus: t.verificationStatus
            }))
          };
        });

      case 'farm-coconut-collection': {
        const filteredSources = batchSources.filter(s => filterByDate(s.collectionDate));
        return farms.map(f => {
          const sources = filteredSources.filter(s => s.farmId === f.id || s.farmCode === f.farmCode);
          const totalCoconuts = sources.reduce((sum, s) => sum + (Number(s.coconutQuantity) || 0), 0);
          return {
            farmCode: f.farmCode,
            farmName: f.farmName,
            totalCoconutsCollected: totalCoconuts,
            batchesCount: new Set(sources.map(s => s.batchCode)).size,
            collections: sources.map(s => ({
              batchCode: s.batchCode,
              motherTreeCode: s.motherTreeCode,
              coconutQuantity: s.coconutQuantity,
              collectionDate: s.collectionDate,
              collectionStatus: s.collectionStatus
            }))
          };
        });
      }

      case 'farm-batch-contribution':
        return batches.map(b => {
          const sources = batchSources.filter(s => s.batchCode === b.batchCode);
          return {
            batchCode: b.batchCode,
            batchName: b.name,
            harvestDate: b.harvestDate,
            totalSeedlings: b.totalQuantity,
            contributingFarms: Array.from(new Set(sources.map(s => s.farmCode))).map(fc => {
              const fSources = sources.filter(s => s.farmCode === fc);
              const fQty = fSources.reduce((sum, s) => sum + (Number(s.coconutQuantity) || 0), 0);
              return {
                farmCode: fc,
                coconutsContributed: fQty,
                motherTreesCount: fSources.length
              };
            })
          };
        });

      case 'farm-seedling-production':
        return farms.map(f => {
          const invs = batchInventory.filter(i => i.farmId === f.id || i.farmCode === f.farmCode);
          const produced = invs.reduce((sum, i) => sum + (Number(i.seedlingsProduced) || 0), 0);
          const germinated = batchSources.filter(s => s.farmCode === f.farmCode).reduce((sum, s) => sum + (Number(s.germinatedQuantity) || 0), 0);
          return {
            farmCode: f.farmCode,
            farmName: f.farmName,
            totalSeedlingsProduced: produced,
            totalGerminated: germinated,
            activeBatches: new Set(invs.map(i => i.batchCode)).size
          };
        });

      case 'farm-available-inventory':
        return farms.map(f => {
          const invs = batchInventory.filter(i => i.farmId === f.id || i.farmCode === f.farmCode);
          return {
            farmCode: f.farmCode,
            farmName: f.farmName,
            produced: invs.reduce((sum, i) => sum + (Number(i.seedlingsProduced) || 0), 0),
            available: invs.reduce((sum, i) => sum + (Number(i.availableQuantity) || 0), 0),
            booked: invs.reduce((sum, i) => sum + (Number(i.bookedQuantity) || 0), 0),
            dispatched: invs.reduce((sum, i) => sum + (Number(i.dispatchedQuantity) || 0), 0),
            damaged: invs.reduce((sum, i) => sum + (Number(i.damagedQuantity) || 0), 0),
            rejected: invs.reduce((sum, i) => sum + (Number(i.rejectedQuantity) || 0), 0)
          };
        });

      case 'batch-germination':
        return batches.map(b => {
          const sources = batchSources.filter(s => s.batchCode === b.batchCode);
          const totalCoconuts = sources.reduce((sum, s) => sum + (Number(s.coconutQuantity) || 0), 0);
          const totalSown = sources.reduce((sum, s) => sum + (Number(s.coconutsSown) || 0), 0);
          const totalGerminated = sources.reduce((sum, s) => sum + (Number(s.germinatedQuantity) || 0), 0);
          const rate = totalSown > 0 ? Math.round((totalGerminated / totalSown) * 100) : 0;
          return {
            batchCode: b.batchCode,
            batchName: b.name,
            harvestDate: b.harvestDate,
            seededDate: b.seededDate,
            totalCoconuts,
            totalSown,
            totalGerminated,
            germinationRate: `${rate}%`,
            sources: sources.map(s => ({
              farmCode: s.farmCode,
              motherTreeCode: s.motherTreeCode,
              sown: s.coconutsSown,
              germinated: s.germinatedQuantity,
              rejected: s.rejectedQuantity
            }))
          };
        });

      case 'mother-tree-history':
        return parentPalms.map(p => {
          const sources = batchSources.filter(s => s.motherTreeCode === (p.motherTreeCode || p.code) || s.motherTreeId === p.id);
          const totalCoconuts = sources.reduce((sum, s) => sum + (Number(s.coconutQuantity) || 0), 0);
          return {
            motherTreeCode: p.motherTreeCode || p.code,
            name: p.name,
            farmCode: p.farmCode,
            age: p.age,
            batchesCount: sources.length,
            totalCoconutsCollected: totalCoconuts,
            batches: sources.map(s => ({
              batchCode: s.batchCode,
              quantity: s.coconutQuantity,
              collectionDate: s.collectionDate
            }))
          };
        });

      case 'batch-dispatch': {
        const filteredBookings = bookings.filter(b => b.bookingStatus === 'Dispatched' && filterByDate(b.dispatchDate || b.createdAt));
        return batches.map(b => {
          const batchDispatches = filteredBookings.filter(bk => bk.batchCode.toLowerCase() === b.batchCode.toLowerCase());
          const totalDispatched = batchDispatches.reduce((sum, bk) => sum + bk.quantity, 0);
          return {
            batchCode: b.batchCode,
            batchName: b.name,
            ordersDispatchedCount: batchDispatches.length,
            seedlingsDispatched: totalDispatched,
            orders: batchDispatches.map(bk => ({
              bookingId: bk.bookingId,
              customerName: bk.customerName,
              quantity: bk.quantity,
              courierName: bk.courierName,
              trackingId: bk.trackingId,
              dispatchDate: bk.dispatchDate
            }))
          };
        });
      }

      case 'farm-customer-allocation':
        return farms.map(f => {
          const farmAllocOrders = bookings.filter(bk => bk.sourceFarmCode === f.farmCode);
          return {
            farmCode: f.farmCode,
            farmName: f.farmName,
            totalAllocatedOrders: farmAllocOrders.length,
            totalAllocatedSeedlings: farmAllocOrders.reduce((sum, bk) => sum + bk.quantity, 0),
            orders: farmAllocOrders.map(bk => ({
              bookingId: bk.bookingId,
              customerName: bk.customerName,
              quantity: bk.quantity,
              bookingStatus: bk.bookingStatus,
              isMixedSource: bk.isMixedSource
            }))
          };
        });

      default:
        return [];
    }
  },

  getReportsAsync: async (reportType: string, startDate?: string, endDate?: string): Promise<any> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getReports(reportType, startDate, endDate);
  },

  // ─── Inventory Adjustments, Enquiries, Reviews, FAQs, Analytics ─────────────
  adjustInventory: (batchCode: string, change: number, reason: string, adminName: string): InventoryAdjustment => {
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

  adjustInventoryAsync: async (batchCode: string, change: number, reason: string, adminName: string): Promise<InventoryAdjustment> => {
    const adj = DataStore.adjustInventory(batchCode, change, reason, adminName);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await InventoryAdjustmentModel.findOneAndUpdate({ id: adj.id }, adj, { upsert: true, new: true });
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
    return adj;
  },

  getAdjustments: (): InventoryAdjustment[] => {
    loadFromDb();
    return adjustments;
  },

  getAdjustmentsAsync: async (): Promise<InventoryAdjustment[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getAdjustments();
  },

  getEnquiries: (): Enquiry[] => {
    loadFromDb();
    return enquiries;
  },

  getEnquiriesAsync: async (): Promise<Enquiry[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getEnquiries();
  },

  addEnquiry: (data: any): Enquiry => {
    loadFromDb();
    const created: Enquiry = {
      id: `enq-${Date.now()}`,
      name: data.name,
      mobile: data.mobile,
      location: data.location || '',
      message: data.message,
      status: 'NEW',
      createdAt: new Date().toISOString()
    };
    enquiries.unshift(created);
    saveToDb();
    return created;
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

  updateEnquiryStatus: (id: string, status: any): Enquiry | undefined => {
    loadFromDb();
    const target = enquiries.find(e => e.id === id);
    if (!target) return undefined;
    target.status = status;
    saveToDb();
    return target;
  },

  updateEnquiryStatusAsync: async (id: string, status: any): Promise<Enquiry | undefined> => {
    const updated = DataStore.updateEnquiryStatus(id, status);
    try {
      const conn = await connectToDatabase();
      if (conn && updated) {
        await EnquiryModel.findOneAndUpdate({ id }, { $set: { status } }, { new: true });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to update Enquiry in MongoDB:', err);
    }
    return updated;
  },

  getReviews: (): Review[] => {
    loadFromDb();
    return reviews;
  },

  getReviewsAsync: async (): Promise<Review[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getReviews();
  },

  getReviewById: (id: string): Review | undefined => {
    loadFromDb();
    return reviews.find(r => r.id === id);
  },

  addReview: (data: any): Review => {
    loadFromDb();
    const created: Review = {
      id: `rev-${Date.now()}`,
      customerName: data.customerName,
      location: data.location,
      batchCode: data.batchCode,
      quantity: Number(data.quantity) || 10,
      rating: Number(data.rating) || 5,
      comment: data.comment,
      verified: data.verified !== undefined ? Boolean(data.verified) : true,
      date: data.date || new Date().toISOString().split('T')[0]
    };
    reviews.unshift(created);
    saveToDb();
    return created;
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

  updateReview: (id: string, data: any): Review | null => {
    loadFromDb();
    const target = reviews.find(r => r.id === id);
    if (!target) return null;
    if (data.customerName) target.customerName = data.customerName;
    if (data.location) target.location = data.location;
    if (data.batchCode) target.batchCode = data.batchCode;
    if (data.quantity !== undefined) target.quantity = Number(data.quantity);
    if (data.rating !== undefined) target.rating = Number(data.rating);
    if (data.comment) target.comment = data.comment;
    if (data.verified !== undefined) target.verified = Boolean(data.verified);
    saveToDb();
    return target;
  },

  updateReviewAsync: async (id: string, data: any): Promise<Review | null> => {
    const updated = DataStore.updateReview(id, data);
    try {
      const conn = await connectToDatabase();
      if (conn && updated) {
        await ReviewModel.findOneAndUpdate({ id }, { $set: updated }, { new: true });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to update Review in MongoDB:', err);
    }
    return updated;
  },

  deleteReview: (id: string): boolean => {
    loadFromDb();
    const idx = reviews.findIndex(r => r.id === id);
    if (idx === -1) return false;
    reviews.splice(idx, 1);
    saveToDb();
    return true;
  },

  deleteReviewAsync: async (id: string): Promise<boolean> => {
    const success = DataStore.deleteReview(id);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await ReviewModel.findOneAndDelete({ id });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to delete Review from MongoDB:', err);
    }
    return success;
  },

  getFaqs: (): FAQ[] => {
    loadFromDb();
    return faqs;
  },

  getSiteSettings: (): SiteSettings => {
    loadFromDb();
    return siteSettings;
  },

  getSiteSettingsAsync: async (): Promise<SiteSettings> => {
    loadFromDb();
    await syncFromMongo();
    return siteSettings;
  },

  updateSiteSettings: (settings: Partial<SiteSettings>): SiteSettings => {
    loadFromDb();
    siteSettings = {
      ...siteSettings,
      ...settings,
    };
    saveToDb();
    return siteSettings;
  },

  updateSiteSettingsAsync: async (settings: Partial<SiteSettings>): Promise<SiteSettings> => {
    const updated = DataStore.updateSiteSettings(settings);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await SiteSettingsModel.findOneAndUpdate(
          { id: 'site_settings' },
          { $set: updated },
          { upsert: true, new: true }
        );
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to persist SiteSettings to MongoDB:', err);
    }
    return updated;
  },

  recordPageView: (event: any): PageViewEvent => {
    loadFromDb();
    const created: PageViewEvent = {
      id: `pv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sessionId: event.sessionId || 'anonymous',
      path: event.path || '/',
      title: event.title,
      referrer: event.referrer,
      referrerSource: event.referrerSource || 'Direct / Bookmark',
      device: event.device || 'desktop',
      screenSize: event.screenSize,
      timestamp: event.timestamp || new Date().toISOString()
    };
    pageViews.unshift(created);
    saveToDb();
    return created;
  },

  // ─── Batch Unique Visitor Views Tracking ─────────────────────────────────
  recordBatchView: (batchCode: string, visitorId: string): { batchCode: string; viewsCount: number; isNewUniqueView: boolean } => {
    loadFromDb();
    if (!batchCode || !visitorId) return { batchCode, viewsCount: 0, isNewUniqueView: false };

    const batch = batches.find(b => b.batchCode.toLowerCase() === batchCode.toLowerCase());
    if (!batch) return { batchCode, viewsCount: 0, isNewUniqueView: false };

    const existing = batchViews.find(
      v => v.batchCode.toLowerCase() === batchCode.toLowerCase() && v.visitorId === visitorId
    );

    let isNewUniqueView = false;
    if (!existing) {
      isNewUniqueView = true;
      batchViews.push({
        id: `bv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        batchCode: batch.batchCode,
        visitorId,
        firstViewedAt: new Date().toISOString(),
        lastViewedAt: new Date().toISOString()
      });
      batch.viewsCount = (Number(batch.viewsCount) || 0) + 1;
      batch.updatedAt = new Date().toISOString();
    } else {
      existing.lastViewedAt = new Date().toISOString();
    }

    const distinctCount = new Set(
      batchViews.filter(v => v.batchCode.toLowerCase() === batch.batchCode.toLowerCase()).map(v => v.visitorId)
    ).size;
    batch.viewsCount = Math.max(Number(batch.viewsCount) || 0, distinctCount);

    saveToDb();
    return { batchCode: batch.batchCode, viewsCount: batch.viewsCount, isNewUniqueView };
  },

  recordBatchViewAsync: async (batchCode: string, visitorId: string): Promise<{ batchCode: string; viewsCount: number; isNewUniqueView: boolean }> => {
    loadFromDb();
    await syncFromMongo();
    const result = DataStore.recordBatchView(batchCode, visitorId);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        if (result.isNewUniqueView) {
          await BatchViewModel.findOneAndUpdate(
            { batchCode: result.batchCode, visitorId },
            {
              $setOnInsert: {
                id: `bv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                batchCode: result.batchCode,
                visitorId,
                firstViewedAt: new Date().toISOString()
              },
              $set: { lastViewedAt: new Date().toISOString() }
            },
            { upsert: true, new: true }
          );
        } else {
          await BatchViewModel.updateOne(
            { batchCode: result.batchCode, visitorId },
            { $set: { lastViewedAt: new Date().toISOString() } }
          );
        }

        await BatchModel.findOneAndUpdate(
          { batchCode: new RegExp('^' + result.batchCode + '$', 'i') },
          { $set: { viewsCount: result.viewsCount } }
        );
      }
    } catch (err) {
      console.error('Failed to sync batch view to Mongo:', err);
    }
    return result;
  },

  getBatchViewsCount: (batchCode: string): number => {
    loadFromDb();
    const batch = batches.find(b => b.batchCode.toLowerCase() === batchCode.toLowerCase());
    const distinct = new Set(
      batchViews.filter(v => v.batchCode.toLowerCase() === batchCode.toLowerCase()).map(v => v.visitorId)
    ).size;
    return Math.max(Number(batch?.viewsCount) || 0, distinct);
  },

  // ─── YouTube Video Module ──────────────────────────────────────────────────
  getYouTubeVideos: (): YouTubeVideo[] => {
    loadFromDb();
    return youtubeVideos.slice().sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  },

  getYouTubeVideosAsync: async (): Promise<YouTubeVideo[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getYouTubeVideos();
  },

  addYouTubeVideo: (data: Partial<YouTubeVideo>): YouTubeVideo => {
    loadFromDb();
    const cleanUrl = data.url?.trim() || '';
    const vId = extractYouTubeVideoId(cleanUrl) || undefined;
    const created: YouTubeVideo = {
      id: `yt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: data.title?.trim() || 'Eathamozhi Coconut Farm Video',
      url: cleanUrl,
      videoId: vId,
      order: Number(data.order) || (youtubeVideos.length + 1),
      isVisible: data.isVisible !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    youtubeVideos.push(created);
    saveToDb();
    return created;
  },

  addYouTubeVideoAsync: async (data: Partial<YouTubeVideo>): Promise<YouTubeVideo> => {
    loadFromDb();
    await syncFromMongo();
    const created = DataStore.addYouTubeVideo(data);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await YouTubeVideoModel.create(created);
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to save YouTube video to Mongo:', err);
    }
    return created;
  },

  updateYouTubeVideo: (id: string, data: Partial<YouTubeVideo>): YouTubeVideo | null => {
    loadFromDb();
    const item = youtubeVideos.find(p => p.id === id);
    if (!item) return null;
    if (data.title !== undefined) item.title = data.title.trim();
    if (data.url !== undefined) {
      item.url = data.url.trim();
      item.videoId = extractYouTubeVideoId(item.url) || undefined;
    }
    if (data.order !== undefined) item.order = Number(data.order);
    if (data.isVisible !== undefined) item.isVisible = Boolean(data.isVisible);
    item.updatedAt = new Date().toISOString();
    saveToDb();
    return item;
  },

  updateYouTubeVideoAsync: async (id: string, data: Partial<YouTubeVideo>): Promise<YouTubeVideo | null> => {
    const updated = DataStore.updateYouTubeVideo(id, data);
    try {
      const conn = await connectToDatabase();
      if (conn && updated) {
        await YouTubeVideoModel.findOneAndUpdate({ id }, { $set: updated }, { new: true });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to update YouTube video in Mongo:', err);
    }
    return updated;
  },

  deleteYouTubeVideo: (id: string): boolean => {
    loadFromDb();
    const idx = youtubeVideos.findIndex(p => p.id === id);
    if (idx === -1) return false;
    youtubeVideos.splice(idx, 1);
    saveToDb();
    return true;
  },

  deleteYouTubeVideoAsync: async (id: string): Promise<boolean> => {
    const success = DataStore.deleteYouTubeVideo(id);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await YouTubeVideoModel.findOneAndDelete({ id });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to delete YouTube video from Mongo:', err);
    }
    return success;
  },

  // ─── Instagram Content Module ───────────────────────────────────────────────
  getInstagramPosts: (): InstagramPost[] => {
    loadFromDb();
    return instagramPosts.slice().sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  },

  getInstagramPostsAsync: async (): Promise<InstagramPost[]> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getInstagramPosts();
  },

  addInstagramPost: (data: Partial<InstagramPost>): InstagramPost => {
    loadFromDb();
    const created: InstagramPost = {
      id: `ig-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: data.title?.trim() || 'Eathamozhi Coconut Farm Reel',
      url: data.url?.trim() || '',
      order: Number(data.order) || (instagramPosts.length + 1),
      isVisible: data.isVisible !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    instagramPosts.push(created);
    saveToDb();
    return created;
  },

  addInstagramPostAsync: async (data: Partial<InstagramPost>): Promise<InstagramPost> => {
    loadFromDb();
    await syncFromMongo();
    const created = DataStore.addInstagramPost(data);
    try {
      const conn = await connectToDatabase();
      if (conn) {
        await InstagramPostModel.create(created);
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to save Instagram post to Mongo:', err);
    }
    return created;
  },

  updateInstagramPost: (id: string, data: Partial<InstagramPost>): InstagramPost | null => {
    loadFromDb();
    const item = instagramPosts.find(p => p.id === id);
    if (!item) return null;
    if (data.title !== undefined) item.title = data.title.trim();
    if (data.url !== undefined) item.url = data.url.trim();
    if (data.order !== undefined) item.order = Number(data.order);
    if (data.isVisible !== undefined) item.isVisible = Boolean(data.isVisible);
    item.updatedAt = new Date().toISOString();
    saveToDb();
    return item;
  },

  updateInstagramPostAsync: async (id: string, data: Partial<InstagramPost>): Promise<InstagramPost | null> => {
    const updated = DataStore.updateInstagramPost(id, data);
    try {
      const conn = await connectToDatabase();
      if (conn && updated) {
        await InstagramPostModel.findOneAndUpdate({ id }, { $set: updated }, { new: true });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to update Instagram post in Mongo:', err);
    }
    return updated;
  },

  deleteInstagramPost: (id: string): boolean => {
    loadFromDb();
    const idx = instagramPosts.findIndex(p => p.id === id);
    if (idx === -1) return false;
    instagramPosts.splice(idx, 1);
    saveToDb();
    return true;
  },

  deleteInstagramPostAsync: async (id: string): Promise<boolean> => {
    const success = DataStore.deleteInstagramPost(id);
    try {
      const conn = await connectToDatabase();
      if (conn && success) {
        await InstagramPostModel.findOneAndDelete({ id });
        lastMongoSyncTime = 0;
      }
    } catch (err) {
      console.error('Failed to delete Instagram post in Mongo:', err);
    }
    return success;
  },

  // ─── Analytics Engine (Day-wise, Week-wise, Month-wise) ──────────────────────
  getAnalyticsSummary: (range: 'daily' | 'weekly' | 'monthly' | 'all' = 'weekly'): any => {
    loadFromDb();

    const now = new Date();
    const nowMs = now.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;
    const thirtyDaysMs = 30 * oneDayMs;

    // Filter by date range
    const filteredViews = pageViews.filter(v => {
      if (range === 'all') return true;
      const vTime = new Date(v.timestamp).getTime();
      if (isNaN(vTime)) return true;
      if (range === 'daily') return nowMs - vTime <= oneDayMs;
      if (range === 'weekly') return nowMs - vTime <= sevenDaysMs;
      if (range === 'monthly') return nowMs - vTime <= thirtyDaysMs;
      return true;
    });

    const filteredJourneys = visitorJourneys.filter(j => {
      if (range === 'all') return true;
      const jTime = new Date(j.lastActiveAt || j.startedAt).getTime();
      if (isNaN(jTime)) return true;
      if (range === 'daily') return nowMs - jTime <= oneDayMs;
      if (range === 'weekly') return nowMs - jTime <= sevenDaysMs;
      if (range === 'monthly') return nowMs - jTime <= thirtyDaysMs;
      return true;
    });

    const viewsToday = pageViews.filter(v => nowMs - new Date(v.timestamp).getTime() <= oneDayMs).length;
    const views7d = pageViews.filter(v => nowMs - new Date(v.timestamp).getTime() <= sevenDaysMs).length;

    const uniqueSessions = new Set(filteredViews.map(v => v.sessionId)).size;
    const todaySessions = new Set(pageViews.filter(v => nowMs - new Date(v.timestamp).getTime() <= oneDayMs).map(v => v.sessionId)).size;

    const convertedSessions = filteredJourneys.filter(j => j.convertedToOrder).length;
    const conversionRate = uniqueSessions > 0
      ? ((convertedSessions / uniqueSessions) * 100).toFixed(1)
      : '0.0';

    // Top Pages
    const pageCounts: Record<string, number> = {};
    for (const v of filteredViews) {
      pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
    }
    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Traffic Sources
    const trafficSources: Record<string, number> = {};
    for (const v of filteredViews) {
      const src = v.referrerSource || 'Direct / Bookmark';
      trafficSources[src] = (trafficSources[src] || 0) + 1;
    }

    // Devices
    const devices = { mobile: 0, desktop: 0, tablet: 0 };
    for (const v of filteredViews) {
      if (v.device === 'mobile') devices.mobile++;
      else if (v.device === 'tablet') devices.tablet++;
      else devices.desktop++;
    }

    // Funnel
    const funnelSessions = {
      home: new Set<string>(),
      motherTrees: new Set<string>(),
      batches: new Set<string>(),
      checkout: new Set<string>(),
      converted: new Set<string>()
    };

    for (const v of filteredViews) {
      if (v.path === '/') funnelSessions.home.add(v.sessionId);
      if (v.path.startsWith('/farm') || v.path.startsWith('/parent-palm')) funnelSessions.motherTrees.add(v.sessionId);
      if (v.path.startsWith('/batches')) funnelSessions.batches.add(v.sessionId);
      if (v.path.startsWith('/book')) funnelSessions.checkout.add(v.sessionId);
    }
    for (const j of filteredJourneys) {
      if (j.convertedToOrder) funnelSessions.converted.add(j.sessionId);
    }

    const funnel = {
      home: funnelSessions.home.size,
      motherTrees: funnelSessions.motherTrees.size,
      batches: funnelSessions.batches.size,
      checkout: funnelSessions.checkout.size,
      converted: funnelSessions.converted.size
    };

    // Batch specific views analytics
    const batchAnalytics = batches.map(b => {
      const bViews = batchViews.filter(v => v.batchCode.toLowerCase() === b.batchCode.toLowerCase());
      const distinctVisitors = new Set(bViews.map(v => v.visitorId)).size;
      return {
        batchCode: b.batchCode,
        name: b.name,
        price: b.price,
        status: b.status,
        uniqueVisitors: Math.max(Number(b.viewsCount) || 0, distinctVisitors),
        totalPings: bViews.length
      };
    });

    return {
      range,
      kpis: {
        totalViews: filteredViews.length,
        viewsToday,
        views7d,
        uniqueSessions,
        sessionsToday: todaySessions,
        convertedSessions,
        conversionRate
      },
      topPages,
      trafficSources,
      devices,
      funnel,
      recentJourneys: filteredJourneys.slice(0, 30),
      batchAnalytics
    };
  },

  getAnalyticsSummaryAsync: async (range: 'daily' | 'weekly' | 'monthly' | 'all' = 'weekly'): Promise<any> => {
    loadFromDb();
    await syncFromMongo();
    return DataStore.getAnalyticsSummary(range);
  },

  syncImagesWithDisk: () => {
    syncDiskImages();
  },

  addImageReference: (code: string, imageUrl: string) => {
    loadFromDb();
    const batch = batches.find(b => b.batchCode.toLowerCase() === code.toLowerCase());
    if (batch) {
      if (!batch.images) batch.images = [];
      if (!batch.images.includes(imageUrl)) {
        batch.images.push(imageUrl);
        saveToDb();
      }
      return batch;
    }
    const palm = parentPalms.find(p => (p.code && p.code.toLowerCase() === code.toLowerCase()) || (p.motherTreeCode && p.motherTreeCode.toLowerCase() === code.toLowerCase()));
    if (palm) {
      if (!palm.images) palm.images = [];
      if (!palm.images.includes(imageUrl)) {
        palm.images.push(imageUrl);
        saveToDb();
      }
      return palm;
    }
    return null;
  }
};
