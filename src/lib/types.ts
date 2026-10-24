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
  paymentStatus: 'PAID' | 'PENDING_VERIFICATION' | 'FAILED';
  bookingStatus: 'Payment review' | 'Confirmed' | 'Preparing' | 'Packed' | 'Dispatched' | 'Delivered' | 'Cancelled';
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

