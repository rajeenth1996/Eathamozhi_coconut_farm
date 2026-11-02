export interface Farm {
  id: string;
  farmCode: string; // e.g. ETH-RA-F001
  farmName: string;
  ownerName: string;
  ownerCode: string; // e.g. RA
  locationCode: string; // e.g. ETH
  location: string;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Dynamic computed fields
  totalMotherTrees?: number;
  selectedMotherTrees?: number;
  treesUsedInBatches?: number;
  activeBatches?: number;
  totalCoconutsCollected?: number;
  totalSeedlingsProduced?: number;
  availableSeedlings?: number;
  bookedSeedlings?: number;
  dispatchedSeedlings?: number;
  damagedSeedlings?: number;
  rejectedSeedlings?: number;
}

export interface MotherTree {
  id: string;
  motherTreeCode: string; // e.g. ETH-RA-F001-MT001
  code: string; // Legacy code (e.g. EM-MP-001 or ETH-RA-F001-MT001)
  farmId: string; // Foreign reference to Farm
  farmCode: string; // Human-readable farm code
  farmName?: string;
  name: string;
  variety: string;
  age: number | string;
  location: string;
  healthStatus: string;
  yieldHistory: string;
  description: string;
  nutCharacteristics: string;
  whySelected: string;
  images: string[];
  selectionStatus: 'Selected' | 'Registered';
  verificationStatus: 'Verified' | 'Pending';
  productionStatus: 'Active for Production' | 'Inactive' | 'Retired';
  notes?: string;
  isVisible?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Dynamic metrics
  batchesUsedCount?: number;
  totalCoconutsCollected?: number;
  totalSeedlingsProduced?: number;
}

// Backward-compatible ParentPalm interface aliased to MotherTree
export interface ParentPalm extends MotherTree {}

export interface BatchSource {
  id: string;
  batchId: string;
  batchCode: string;
  farmId: string;
  farmCode: string;
  farmName: string;
  motherTreeId: string;
  motherTreeCode: string;
  motherTreeName?: string;
  coconutQuantity: number;
  coconutsSown: number;
  collectionDate: string;
  collectionStatus: 'Collected' | 'Verified' | 'Pending' | 'Rejected';
  germinatedQuantity: number;
  rejectedQuantity: number;
  germinationRate?: string;
  germinationStartDate?: string;
  germinationEndDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchInventory {
  id: string;
  batchId: string;
  batchCode: string;
  batchSourceId: string;
  farmId: string;
  farmCode: string;
  motherTreeId: string;
  motherTreeCode: string;
  seedlingsProduced: number;
  availableQuantity: number;
  bookedQuantity: number;
  dispatchedQuantity: number;
  damagedQuantity: number;
  rejectedQuantity: number;
  updatedAt: string;
}

export interface Batch {
  id: string;
  batchCode: string;
  parentPalmId: string;
  parentPalmCode: string;
  parentPalmCodes?: string[];
  name: string;
  harvestDate: string;
  seededDate: string;
  age?: string;
  height?: string;
  totalQuantity: number;
  bookedQuantity: number;
  inventoryAdjustments: number;
  price: number;
  status: 'AVAILABLE' | 'LIMITED' | 'SOLD_OUT' | 'COMING_SOON';
  description: string;
  viewsCount?: number;
  images: string[];
  availableQuantity?: number;
  bookedPercentage?: number;
  isVisible?: boolean;
  // Module 4 & 5 extensions
  primaryFarmId?: string;
  primaryFarmCode?: string;
  batchMonth?: number;
  batchYear?: number;
  batchNumber?: number;
  totalCoconuts?: number;
  totalSeedlings?: number;
  sources?: BatchSource[];
  inventory?: BatchInventory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryAdjustment {
  id: string;
  batchCode: string;
  quantityChange: number;
  reason: string;
  adminName: string;
  createdAt: string;
}

export interface OrderAllocation {
  batchSourceId: string;
  farmId: string;
  farmCode: string;
  motherTreeId: string;
  motherTreeCode: string;
  quantity: number;
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
  // Traceability & Source Allocations
  allocations?: OrderAllocation[];
  sourceFarmCode?: string;
  sourceMotherTreeCode?: string;
  isMixedSource?: boolean;
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

export interface SiteSettings {
  showBatchesOnMainPage: boolean;
  showMotherTreesOnMainPage: boolean;
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

export interface InstagramPost {
  id: string;
  title: string;
  url: string;
  order: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BatchView {
  id: string;
  batchCode: string;
  visitorId: string;
  firstViewedAt: string;
  lastViewedAt: string;
}

export function formatApproximateAge(age: number | string | undefined): string {
  if (age === undefined || age === null || age === '') return '40+ years';
  if (typeof age === 'string') {
    const trimmed = age.trim();
    if (trimmed.toLowerCase().includes('year')) return trimmed;
    if (trimmed.includes('+')) return `${trimmed} years`;
    const num = parseInt(trimmed, 10);
    if (!isNaN(num)) return formatApproximateAge(num);
    return trimmed;
  }
  const n = Number(age);
  if (isNaN(n) || n <= 0) return '40+ years';
  if (n >= 80) return '80+ years';
  if (n >= 50) return '50+ years';
  if (n >= 40) return '40+ years';
  if (n >= 30) return '30+ years';
  const floored = Math.max(10, Math.floor(n / 10) * 10);
  return `${floored}+ years`;
}
