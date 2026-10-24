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

// Global Store State with Dedicated Folder Paths
let parentPalms: ParentPalm[] = [
  {
    "id": "mp-1",
    "code": "EM-MP-001",
    "name": "Ancestral Grand Mother Tree #1",
    "age": 88,
    "location": "Plot A - Heritage Grove North",
    "healthStatus": "Vigorous & Pest-Free",
    "yieldHistory": "Consistently 160–180 high-weight seed nuts per year over 25 monitored years.",
    "description": "Our flagship mother palm planted in 1938. Exceptional trunk girth, dense canopy, and superior copra content.",
    "nutCharacteristics": "Large spherical nuts with 180g dry copra content and sweet water volume > 350ml.",
    "whySelected": "Unmatched germination rate (>94%) and strong wind tolerance during coastal storms.",
    "images": [
      "/images/parent-palms/EM-MP-001/1791893869628_WhatsApp_Image_2026-10-13_at_5.31.07_PM__1_.jpeg"
    ]
  },
  {
    "id": "mp-2",
    "code": "EM-MP-002",
    "name": "East River Tall Palm #2",
    "age": 75,
    "location": "Plot B - River Bank Section",
    "healthStatus": "Excellent (Monitored Monthly)",
    "yieldHistory": "145–165 seed nuts/year average with early spadix emergence.",
    "description": "Located in fertile alluvial riverbank soil. Famous for fast germination and thick root collars.",
    "nutCharacteristics": "Medium-large green seed nuts with thick fibrous husk providing natural drought shield.",
    "whySelected": "High sapling survival rate in farm seedbed and rapid initial growth phase.",
    "images": [
      "/images/parent-palms/EM-MP-002/1791893855443_WhatsApp_Image_2026-10-13_at_5.31.07_PM.jpeg"
    ]
  },
  {
    "id": "mp-3",
    "code": "EM-MP-003",
    "name": "Coastal Shield Mother Tree #3",
    "age": 82,
    "location": "Plot A - Seaward Ridge",
    "healthStatus": "Robust & High Immunity",
    "yieldHistory": "150–170 seed nuts/year documented consistently.",
    "description": "Seaward facing tall palm proven resistant to high saline breezes and soil salinity fluctuations.",
    "nutCharacteristics": "Thick husk with heavy endosperm and oil yield > 68%.",
    "whySelected": "Ideal parent palm for coastal region coconut plantation expansion.",
    "images": [
      "/images/parent-palms/EM-MP-003/tree_1.jpeg",
      "/images/parent-palms/EM-MP-003/tree_2.jpeg"
    ]
  },
  {
    "id": "mp-4",
    "code": "EM-MP-004",
    "name": "Central Grove Prime Palm #4",
    "age": 68,
    "location": "Plot C - Central Farm",
    "healthStatus": "Peak Productivity",
    "yieldHistory": "155–175 nuts/year with uniform round shape.",
    "description": "Prime mother palm selected for high seednut weight and uniform seedling collar circumference.",
    "nutCharacteristics": "Heavy spherical seednuts with high water sugar content.",
    "whySelected": "Selected for quick 4-month germination and robust initial root anchorage.",
    "images": [
      "/images/parent-palms/EM-MP-004/tree_1.jpeg",
      "/images/parent-palms/EM-MP-004/tree_2.jpeg"
    ]
  },
  {
    "id": "mp-5",
    "code": "EM-MP-005",
    "name": "Golden Husk Mother Tree #5",
    "age": 79,
    "location": "Plot B - South Field",
    "healthStatus": "Excellent Health",
    "yieldHistory": "140–160 nuts/year with high copra recovery.",
    "description": "Golden-tinged husk variant with high husk fiber tensile strength and dense meat.",
    "nutCharacteristics": "Golden brown ripe nuts, 175g copra per nut.",
    "whySelected": "Proven drought tolerance and high pest immunity.",
    "images": [
      "/images/parent-palms/EM-MP-005/tree_1.jpeg",
      "/images/parent-palms/EM-MP-005/tree_2.jpeg"
    ]
  },
  {
    "id": "mp-6",
    "code": "EM-MP-006",
    "name": "High Copra Mother Palm #6",
    "age": 71,
    "location": "Plot D - West Boundary",
    "healthStatus": "Vigorous",
    "yieldHistory": "150–165 nuts/year with top-tier oil percentage.",
    "description": "Monitored for oil extraction yield; yields superior Grade-A copra.",
    "nutCharacteristics": "Compact round nut with dense solid kernel.",
    "whySelected": "Top candidate for commercial oil-yielding coconut orchards.",
    "images": [
      "/images/parent-palms/EM-MP-006/tree_1.jpeg",
      "/images/parent-palms/EM-MP-006/tree_2.jpeg"
    ]
  },
  {
    "id": "mp-7",
    "code": "EM-MP-007",
    "name": "Heritage Giant Palm #7",
    "age": 91,
    "location": "Plot A - Old Grove Center",
    "healthStatus": "Prime Heritage Condition",
    "yieldHistory": "165–185 nuts/year over 30 years.",
    "description": "One of our oldest registered mother trees with massive canopy spread.",
    "nutCharacteristics": "Extra-large seednuts yielding heavy sturdy saplings.",
    "whySelected": "Unbeatable genetic stability and longevity.",
    "images": [
      "/images/parent-palms/EM-MP-007/tree_1.jpg",
      "/images/parent-palms/EM-MP-007/tree_2.jpeg"
    ]
  },
  {
    "id": "mp-8",
    "code": "EM-MP-008",
    "name": "Fast Germinator Palm #8",
    "age": 64,
    "location": "Plot C - East Section",
    "healthStatus": "Vigorous",
    "yieldHistory": "135–155 nuts/year with 96% germination speed.",
    "description": "Sprouts 2 weeks earlier than average in seedbeds.",
    "nutCharacteristics": "Thin husk, thick shell, large water cavity.",
    "whySelected": "Fastest farm sprout emergence rate on record.",
    "images": [
      "/images/parent-palms/EM-MP-008/tree_1.jpg",
      "/images/parent-palms/EM-MP-008/tree_2.jpeg"
    ]
  },
  {
    "id": "mp-9",
    "code": "EM-MP-009",
    "name": "Deep Root Mother Palm #9",
    "age": 77,
    "location": "Plot E - Highland Block",
    "healthStatus": "Extremely Resilient",
    "yieldHistory": "140–160 nuts/year under rain-fed conditions.",
    "description": "Thrives in lower water tables with deep taproot architecture.",
    "nutCharacteristics": "Medium seednuts with resilient outer husk.",
    "whySelected": "Ideal for rain-fed agricultural fields.",
    "images": [
      "/images/parent-palms/EM-MP-009/tree_1.jpeg",
      "/images/parent-palms/EM-MP-009/tree_2.jpeg"
    ]
  },
  {
    "id": "mp-10",
    "code": "EM-MP-010",
    "name": "Sweet Water Mother Tree #10",
    "age": 69,
    "location": "Plot B - Canal Side",
    "healthStatus": "Excellent",
    "yieldHistory": "150–170 nuts/year with high brix sweetness index.",
    "description": "Dual-purpose mother tree producing sweet tender water and rich mature copra.",
    "nutCharacteristics": "Large green-yellow nuts, 400ml sweet water capacity.",
    "whySelected": "Popular dual-purpose tender/mature coconut seedling lineage.",
    "images": [
      "/images/parent-palms/EM-MP-010/tree_1.jpeg",
      "/images/parent-palms/EM-MP-010/tree_2.jpeg"
    ]
  }
];

let batches: Batch[] = [
  {
    "id": "b-1",
    "batchCode": "EM-0126-A",
    "parentPalmId": "mp-1",
    "parentPalmCode": "EM-MP-001",
    "name": "January 2026 Ready Batch (EM-0126-A)",
    "harvestDate": "2025-09-10",
    "seededDate": "2025-09-25",
    "totalQuantity": 500,
    "bookedQuantity": 0,
    "inventoryAdjustments": 0,
    "price": 150,
    "status": "AVAILABLE",
    "description": "Fully matured 12-month saplings ready for immediate orchard planting. Strong root systems and thick collars.",
    "viewsCount": 120,
    "images": [
      "/images/batches/EM-0126-A/1791893428452_WhatsApp_Image_2026-10-13_at_5.32.57_PM.jpeg",
      "/images/batches/EM-0126-A/1791893438300_WhatsApp_Image_2026-10-13_at_5.32.58_PM__1_.jpeg"
    ]
  },
  {
    "id": "b-2",
    "batchCode": "EM-0226-B",
    "parentPalmId": "mp-2",
    "parentPalmCode": "EM-MP-002",
    "name": "February 2026 Prime Batch (EM-0226-B)",
    "harvestDate": "2025-10-05",
    "seededDate": "2025-10-20",
    "totalQuantity": 450,
    "bookedQuantity": 0,
    "inventoryAdjustments": 0,
    "price": 150,
    "status": "AVAILABLE",
    "description": "Vigorous 11-month saplings from River Bank parent tree. High leaf frond count and dark green color.",
    "viewsCount": 120,
    "images": [
      "/images/batches/EM-0226-B/1791893468990_WhatsApp_Image_2026-10-13_at_5.32.58_PM__1_.jpeg",
      "/images/batches/EM-0226-B/1791893468994_WhatsApp_Image_2026-10-13_at_5.33.28_PM.jpeg",
      "/images/batches/EM-0226-B/1791893468997_WhatsApp_Image_2026-10-13_at_5.33.29_PM__1_.jpeg"
    ]
  },
  {
    "id": "b-3",
    "batchCode": "EM-0326-C",
    "parentPalmId": "mp-3",
    "parentPalmCode": "EM-MP-003",
    "name": "March 2026 Coastal Batch (EM-0326-C)",
    "harvestDate": "2025-11-01",
    "seededDate": "2025-11-15",
    "totalQuantity": 600,
    "bookedQuantity": 0,
    "inventoryAdjustments": 0,
    "price": 160,
    "status": "AVAILABLE",
    "description": "Coastal shield cultivar batch. Engineered for wind resistance and saline soil adaptability.",
    "viewsCount": 120,
    "images": [
      "/images/batches/EM-0326-C/1791893490267_WhatsApp_Image_2026-10-13_at_5.35.08_PM.jpeg",
      "/images/batches/EM-0326-C/1791893490273_WhatsApp_Image_2026-10-13_at_5.35.09_PM__1_.jpeg"
    ]
  },
  {
    "id": "b-4",
    "batchCode": "EM-0426-D",
    "parentPalmId": "mp-4",
    "parentPalmCode": "EM-MP-004",
    "name": "April 2026 Central Batch (EM-0426-D)",
    "harvestDate": "2025-12-01",
    "seededDate": "2025-12-15",
    "totalQuantity": 400,
    "bookedQuantity": 0,
    "inventoryAdjustments": 0,
    "price": 155,
    "status": "AVAILABLE",
    "description": "Heavy collar saplings raised under drip irrigation with balanced organic compost nutrition.",
    "viewsCount": 120,
    "images": [
      "/images/batches/EM-0426-D/1791893523072_WhatsApp_Image_2026-10-13_at_5.32.07_PM.jpeg",
      "/images/batches/EM-0426-D/1791893523076_WhatsApp_Image_2026-10-13_at_5.32.08_PM.jpeg"
    ]
  },
  {
    "id": "b-5",
    "batchCode": "EM-0526-E",
    "parentPalmId": "mp-5",
    "parentPalmCode": "EM-MP-005",
    "name": "May 2026 Summer Batch (EM-0526-E)",
    "harvestDate": "2026-01-05",
    "seededDate": "2026-01-20",
    "totalQuantity": 350,
    "bookedQuantity": 0,
    "inventoryAdjustments": 0,
    "price": 150,
    "status": "AVAILABLE",
    "description": "Hardened saplings with high heat tolerance. Excellent candidate for dry zone planting.",
    "viewsCount": 120,
    "images": [
      "/images/batches/EM-0526-E/1791893552971_WhatsApp_Image_2026-10-13_at_5.33.31_PM.jpeg"
    ]
  },
  {
    "id": "b-6",
    "batchCode": "EM-0626-F",
    "parentPalmId": "mp-6",
    "parentPalmCode": "EM-MP-006",
    "name": "June 2026 Monsoon Pre-Booking (EM-0626-F)",
    "harvestDate": "2026-02-01",
    "seededDate": "2026-02-15",
    "totalQuantity": 550,
    "bookedQuantity": 0,
    "inventoryAdjustments": 0,
    "price": 165,
    "status": "AVAILABLE",
    "description": "Special monsoon edition batch. Prepared for planting at the start of South-West monsoon.",
    "viewsCount": 120,
    "images": [
      "/images/batches/EM-0626-F/1791893569761_WhatsApp_Image_2026-10-13_at_5.33.32_PM.jpeg"
    ]
  },
  {
    "id": "b-7",
    "batchCode": "EM-0726-G",
    "parentPalmId": "mp-7",
    "parentPalmCode": "EM-MP-007",
    "name": "July 2026 Heritage Giant Batch (EM-0726-G)",
    "harvestDate": "2026-03-01",
    "seededDate": "2026-03-15",
    "totalQuantity": 500,
    "bookedQuantity": 0,
    "inventoryAdjustments": 0,
    "price": 170,
    "status": "AVAILABLE",
    "description": "Offspring of 91-year old Giant Mother Tree #7. High genetic purity and extra large nut potential.",
    "viewsCount": 120,
    "images": [
      "/images/batches/EM-0726-G/1791893590270_WhatsApp_Image_2026-10-13_at_5.33.31_PM.jpeg"
    ]
  },
  {
    "id": "b-8",
    "batchCode": "EM-0826-H",
    "parentPalmId": "mp-8",
    "parentPalmCode": "EM-MP-008",
    "name": "August 2026 Fast Growth Batch (EM-0826-H)",
    "harvestDate": "2026-04-01",
    "seededDate": "2026-04-15",
    "totalQuantity": 400,
    "bookedQuantity": 0,
    "inventoryAdjustments": 0,
    "price": 160,
    "status": "AVAILABLE",
    "description": "Rapid sprouting batch with quick root anchorage and dense frond emergence.",
    "viewsCount": 120,
    "images": [
      "/images/batches/EM-0826-H/1791893653192_WhatsApp_Image_2026-10-13_at_5.31.10_PM__1_.jpeg"
    ]
  },
  {
    "id": "b-9",
    "batchCode": "EM-0926-I",
    "parentPalmId": "mp-9",
    "parentPalmCode": "EM-MP-009",
    "name": "September 2026 Deep Root Batch (EM-0926-I)",
    "harvestDate": "2026-05-01",
    "seededDate": "2026-05-15",
    "totalQuantity": 450,
    "bookedQuantity": 0,
    "inventoryAdjustments": 0,
    "price": 155,
    "status": "AVAILABLE",
    "description": "Drought resilient sapling lineage from Highland Block parent palm.",
    "viewsCount": 120,
    "images": [
      "/images/batches/EM-0926-I/1791893677048_WhatsApp_Image_2026-10-13_at_5.32.06_PM__1_.jpeg",
      "/images/batches/EM-0926-I/1791893677053_WhatsApp_Image_2026-10-13_at_5.32.07_PM.jpeg",
      "/images/batches/EM-0926-I/1791893677056_WhatsApp_Image_2026-10-13_at_5.32.08_PM.jpeg"
    ]
  },
  {
    "id": "b-10",
    "batchCode": "EM-1026-J",
    "parentPalmId": "mp-10",
    "parentPalmCode": "EM-MP-010",
    "name": "October 2026 Sweet Water Batch (EM-1026-J)",
    "harvestDate": "2026-06-01",
    "seededDate": "2026-06-15",
    "totalQuantity": 600,
    "bookedQuantity": 0,
    "inventoryAdjustments": 0,
    "price": 160,
    "status": "AVAILABLE",
    "description": "Dual-purpose saplings. Ideal for both tender coconut harvesting and copra production.",
    "viewsCount": 120,
    "images": [
      "/images/batches/EM-1026-J/1791893696732_WhatsApp_Image_2026-10-13_at_5.32.06_PM.jpeg",
      "/images/batches/EM-1026-J/1791893712664_WhatsApp_Image_2026-10-13_at_5.31.10_PM__1_.jpeg",
      "/images/batches/EM-1026-J/1791893712667_WhatsApp_Image_2026-10-13_at_5.33.31_PM.jpeg",
      "/images/batches/EM-1026-J/1791893712714_WhatsApp_Image_2026-10-13_at_5.33.32_PM.jpeg",
      "/images/batches/EM-1026-J/1791893712717_WhatsApp_Image_2026-10-13_at_5.33.27_PM.jpeg"
    ]
  }
];

let bookings: Booking[] = [
  {
    "id": "bk-1001",
    "bookingId": "EM-0126-A-1001",
    "batchCode": "EM-0126-A",
    "customerName": "Rajeenth Kumar",
    "mobile": "9486880641",
    "whatsapp": "9486880641",
    "address": "12-A Coconut Farm Lane, Main Road",
    "district": "Kanyakumari",
    "state": "Tamil Nadu",
    "pinCode": "629001",
    "quantity": 25,
    "subtotal": 3750,
    "deliveryCharge": 250,
    "totalAmount": 4000,
    "paymentStatus": "PAID",
    "bookingStatus": "Confirmed",
    "expectedDeliveryDate": "2026-10-09",
    "deliveryService": "ST Couriers",
    "nearestHub": "Nagercoil Central Hub",
    "createdAt": "2026-10-01T09:00:00Z"
  },
  {
    "id": "bk-1002",
    "bookingId": "EM-0126-A-1002",
    "batchCode": "EM-0126-A",
    "customerName": "Suresh Murugan",
    "mobile": "9842155678",
    "whatsapp": "9842155678",
    "address": "45 Palm Grove Estate, Highways",
    "district": "Tirunelveli",
    "state": "Tamil Nadu",
    "pinCode": "627001",
    "quantity": 50,
    "subtotal": 7500,
    "deliveryCharge": 500,
    "totalAmount": 8000,
    "paymentStatus": "PAID",
    "bookingStatus": "Dispatched",
    "courierName": "VRL Logistics",
    "trackingId": "VRL-TN-98421",
    "dispatchDate": "2026-10-04",
    "expectedDeliveryDate": "2026-10-10",
    "deliveryService": "VRL Logistics",
    "nearestHub": "Tirunelveli Town Hub",
    "createdAt": "2026-10-02T10:30:00Z"
  },
  {
    "id": "bk-1003",
    "bookingId": "EM-0226-B-1003",
    "batchCode": "EM-0226-B",
    "customerName": "Anitha Ramesh",
    "mobile": "9842155678",
    "whatsapp": "9842155678",
    "address": "88 River Road, Near Temple",
    "district": "Madurai",
    "state": "Tamil Nadu",
    "pinCode": "625001",
    "quantity": 30,
    "subtotal": 4500,
    "deliveryCharge": 300,
    "totalAmount": 4800,
    "paymentStatus": "PAID",
    "bookingStatus": "Preparing",
    "expectedDeliveryDate": "2026-10-12",
    "deliveryService": "ST Couriers",
    "nearestHub": "Madurai Mattuthavani",
    "createdAt": "2026-10-03T11:15:00Z"
  },
  {
    "id": "bk-1004",
    "bookingId": "EM-0326-C-1004",
    "batchCode": "EM-0326-C",
    "customerName": "Karthik Subramanian",
    "mobile": "9790123456",
    "whatsapp": "9790123456",
    "address": "102 Beach Road, Colachel",
    "district": "Kanyakumari",
    "state": "Tamil Nadu",
    "pinCode": "629151",
    "quantity": 40,
    "subtotal": 6400,
    "deliveryCharge": 350,
    "totalAmount": 6750,
    "paymentStatus": "PENDING_VERIFICATION",
    "bookingStatus": "Payment review",
    "expectedDeliveryDate": "2026-10-14",
    "deliveryService": "ST Couriers",
    "nearestHub": "Colachel Junction",
    "createdAt": "2026-10-04T14:20:00Z"
  },
  {
    "id": "bk-1005",
    "bookingId": "EM-0426-D-1005",
    "batchCode": "EM-0426-D",
    "customerName": "Venkatesh Rao",
    "mobile": "9876543210",
    "whatsapp": "9876543210",
    "address": "15 Green Valley Farm",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "pinCode": "641001",
    "quantity": 60,
    "subtotal": 9300,
    "deliveryCharge": 600,
    "totalAmount": 9900,
    "paymentStatus": "PAID",
    "bookingStatus": "Delivered",
    "courierName": "KPN Speed Parcel",
    "trackingId": "KPN-CBE-7712",
    "dispatchDate": "2026-10-01",
    "expectedDeliveryDate": "2026-10-06",
    "deliveryService": "KPN Speed Parcel",
    "nearestHub": "Coimbatore Gandhipuram",
    "createdAt": "2026-09-28T08:00:00Z"
  },
  {
    "id": "bk-1006",
    "bookingId": "EM-0526-E-1006",
    "batchCode": "EM-0526-E",
    "customerName": "Meena Krishnan",
    "mobile": "9123456789",
    "whatsapp": "9123456789",
    "address": "77 Agricultural Zone",
    "district": "Salem",
    "state": "Tamil Nadu",
    "pinCode": "636001",
    "quantity": 20,
    "subtotal": 3000,
    "deliveryCharge": 200,
    "totalAmount": 3200,
    "paymentStatus": "PAID",
    "bookingStatus": "Confirmed",
    "expectedDeliveryDate": "2026-10-15",
    "deliveryService": "ST Couriers",
    "nearestHub": "Salem 4-Roads",
    "createdAt": "2026-10-05T16:00:00Z"
  },
  {
    "id": "bk-1007",
    "bookingId": "EM-0626-F-1007",
    "batchCode": "EM-0626-F",
    "customerName": "Prakash Selvam",
    "mobile": "9345678901",
    "whatsapp": "9345678901",
    "address": "33 East Coast Road",
    "district": "Thanjavur",
    "state": "Tamil Nadu",
    "pinCode": "613001",
    "quantity": 100,
    "subtotal": 16500,
    "deliveryCharge": 1000,
    "totalAmount": 17500,
    "paymentStatus": "PAID",
    "bookingStatus": "Preparing",
    "expectedDeliveryDate": "2026-10-18",
    "deliveryService": "VRL Logistics",
    "nearestHub": "Thanjavur Old Bus Stand",
    "createdAt": "2026-10-06T12:00:00Z"
  },
  {
    "id": "bk-1008",
    "bookingId": "EM-0726-G-1008",
    "batchCode": "EM-0726-G",
    "customerName": "Devi Prasad",
    "mobile": "9566778899",
    "whatsapp": "9566778899",
    "address": "5 Heritage Lane",
    "district": "Tiruchirappalli",
    "state": "Tamil Nadu",
    "pinCode": "620001",
    "quantity": 35,
    "subtotal": 5950,
    "deliveryCharge": 350,
    "totalAmount": 6300,
    "paymentStatus": "PAID",
    "bookingStatus": "Confirmed",
    "expectedDeliveryDate": "2026-10-19",
    "deliveryService": "ST Couriers",
    "nearestHub": "Trichy Central Hub",
    "createdAt": "2026-10-06T15:30:00Z"
  },
  {
    "id": "bk-1009",
    "bookingId": "EM-0826-H-1009",
    "batchCode": "EM-0826-H",
    "customerName": "Balamurugan P.",
    "mobile": "9486880641",
    "whatsapp": "9486880641",
    "address": "12-A Coconut Farm Lane",
    "district": "Kanyakumari",
    "state": "Tamil Nadu",
    "pinCode": "629001",
    "quantity": 15,
    "subtotal": 2400,
    "deliveryCharge": 200,
    "totalAmount": 2600,
    "paymentStatus": "PAID",
    "bookingStatus": "Confirmed",
    "expectedDeliveryDate": "2026-10-20",
    "deliveryService": "ST Couriers",
    "nearestHub": "Kanyakumari Main Hub",
    "createdAt": "2026-10-07T08:45:00Z"
  },
  {
    "id": "bk-1010",
    "bookingId": "EM-0926-I-1010",
    "batchCode": "EM-0926-I",
    "customerName": "Janaki Raman",
    "mobile": "9840011223",
    "whatsapp": "9840011223",
    "address": "9 Canal View Road",
    "district": "Erode",
    "state": "Tamil Nadu",
    "pinCode": "638001",
    "quantity": 50,
    "subtotal": 7750,
    "deliveryCharge": 500,
    "totalAmount": 8250,
    "paymentStatus": "PENDING_VERIFICATION",
    "bookingStatus": "Payment review",
    "expectedDeliveryDate": "2026-10-22",
    "deliveryService": "Professional Couriers",
    "nearestHub": "Erode Brough Road",
    "createdAt": "2026-10-07T11:00:00Z"
  },
  {
    "id": "bk-1011",
    "bookingId": "EM-0226-B-1011",
    "batchCode": "EM-0226-B",
    "customerName": "Ramasamy Gounder",
    "mobile": "9443322110",
    "whatsapp": "9443322110",
    "address": "Plot 44, Coconut Belt",
    "district": "Pollachi",
    "state": "Tamil Nadu",
    "pinCode": "642001",
    "quantity": 75,
    "subtotal": 11250,
    "deliveryCharge": 750,
    "totalAmount": 12000,
    "paymentStatus": "PAID",
    "bookingStatus": "Confirmed",
    "expectedDeliveryDate": "2026-10-24",
    "deliveryService": "ST Couriers",
    "nearestHub": "Pollachi Town Hub",
    "createdAt": "2026-10-12T09:30:00Z"
  },
  {
    "id": "bk-1012",
    "bookingId": "EM-0526-E-1012",
    "batchCode": "EM-0526-E",
    "customerName": "Kavitha Rajan",
    "mobile": "9884455667",
    "whatsapp": "9884455667",
    "address": "22 Lake View Farm",
    "district": "Dindigul",
    "state": "Tamil Nadu",
    "pinCode": "624001",
    "quantity": 30,
    "subtotal": 4500,
    "deliveryCharge": 300,
    "totalAmount": 4800,
    "paymentStatus": "PAID",
    "bookingStatus": "Preparing",
    "expectedDeliveryDate": "2026-10-26",
    "deliveryService": "VRL Logistics",
    "nearestHub": "Dindigul Bypass Hub",
    "createdAt": "2026-10-15T14:10:00Z"
  },
  {
    "id": "bk-1013",
    "bookingId": "EM-0826-H-1013",
    "batchCode": "EM-0826-H",
    "customerName": "Saravanan T.",
    "mobile": "9751122334",
    "whatsapp": "9751122334",
    "address": "18 Riverside Grove",
    "district": "Karur",
    "state": "Tamil Nadu",
    "pinCode": "639001",
    "quantity": 45,
    "subtotal": 7200,
    "deliveryCharge": 450,
    "totalAmount": 7650,
    "paymentStatus": "PENDING_VERIFICATION",
    "bookingStatus": "Payment review",
    "expectedDeliveryDate": "2026-10-29",
    "deliveryService": "ST Couriers",
    "nearestHub": "Karur Central Hub",
    "createdAt": "2026-10-18T16:20:00Z"
  },
  {
    "id": "bk-1014",
    "bookingId": "EM-0926-I-1014",
    "batchCode": "EM-0926-I",
    "customerName": "Murugavel S.",
    "mobile": "9944112233",
    "whatsapp": "9944112233",
    "address": "87 Plantation Drive",
    "district": "Theni",
    "state": "Tamil Nadu",
    "pinCode": "625531",
    "quantity": 60,
    "subtotal": 9300,
    "deliveryCharge": 600,
    "totalAmount": 9900,
    "paymentStatus": "PAID",
    "bookingStatus": "Confirmed",
    "expectedDeliveryDate": "2026-10-31",
    "deliveryService": "ST Couriers",
    "nearestHub": "Theni Main Hub",
    "createdAt": "2026-10-20T10:45:00Z"
  }
];

let adjustments: InventoryAdjustment[] = [
  {
    "id": "adj-1",
    "batchCode": "EM-0126-A",
    "quantityChange": -5,
    "reason": "Routine farm inspection reject of bent saplings",
    "adminName": "Rajeenth (Farm Admin)",
    "createdAt": "2026-10-02T16:00:00Z"
  },
  {
    "id": "adj-2",
    "batchCode": "EM-0326-C",
    "quantityChange": 10,
    "reason": "Bonus sprouted seednuts added from farm seedbed extension",
    "adminName": "Rajeenth (Farm Admin)",
    "createdAt": "2026-10-05T10:00:00Z"
  }
];

let reviews: Review[] = [
  {
    id: 'rev-1',
    customerName: 'Murugan K.',
    location: 'Nagercoil, Kanyakumari',
    batchCode: 'EM-0126-A',
    quantity: 20,
    rating: 5,
    comment: 'Received extremely healthy saplings with thick collars and strong root systems. Packaging was carefully handled and survived transport without damage!',
    verified: true,
    date: '2026-09-28'
  },
  {
    id: 'rev-2',
    customerName: 'Suresh M.',
    location: 'Tirunelveli, Tamil Nadu',
    batchCode: 'EM-0226-B',
    quantity: 50,
    rating: 5,
    comment: 'Outstanding Eathamozhy GI variety seedlings. Every single sapling germinated with deep green fronds.',
    verified: true,
    date: '2026-10-02'
  }
];

let faqs: FAQ[] = [
  {
    id: 'faq-1',
    question: 'Where are your saplings grown?',
    answer: 'All our coconut saplings are raised directly on our own ancestral farm in Eathamozhy, Kanyakumari district, Tamil Nadu.',
    category: 'General'
  },
  {
    id: 'faq-2',
    question: 'How are saplings packaged for long-distance transport?',
    answer: 'Saplings are carefully rooted in nutrient-rich growing media and wrapped with protective moisture-retaining material to safeguard the fronds and collar stem during transit. Each consignment is securely packed and dispatched via trusted freight partners.',
    category: 'Logistics'
  }
];

let enquiries: Enquiry[] = [
  {
    id: 'enq-1',
    name: 'Suresh Kumar',
    mobile: '9842155678',
    location: 'Tirunelveli, Tamil Nadu',
    message: 'Looking for 150 saplings for my 2-acre farm expansion next month. Please share transport details.',
    status: 'NEW',
    createdAt: '2026-10-04T14:30:00Z'
  }
];

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
      if (Array.isArray(data.parentPalms) && data.parentPalms.length > 0) parentPalms = data.parentPalms;
      if (Array.isArray(data.batches) && data.batches.length > 0) {
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
      if (Array.isArray(data.faqs) && data.faqs.length > 0) faqs = data.faqs;
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
function syncDiskImages() {
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
      realBatch.viewsCount = (realBatch.viewsCount || 100) + 1;
    }
    return b;
  },

  addBatch: (newBatchData: any) => {
    loadFromDb();
    const combinedName = newBatchData.name.includes(newBatchData.batchCode) 
      ? newBatchData.name 
      : `${newBatchData.name} (${newBatchData.batchCode})`;

    const defaultFolderImages = [`/images/batches/${newBatchData.batchCode}/batch_1.jpg`];

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
    const defaultTreeImages = [`/images/parent-palms/${data.code}/tree_1.jpg`];
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

  createBooking: (data: Omit<Booking, 'id' | 'bookingId' | 'createdAt' | 'paymentStatus' | 'bookingStatus'> & { paymentScreenshotUrl?: string }) => {
    loadFromDb();
    const batch = DataStore.getBatchByCode(data.batchCode);
    if (!batch || batch.availableQuantity < data.quantity) {
      throw new Error('Requested quantity exceeds available stock.');
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `${data.batchCode}-${randomSuffix}`;
    
    const newBooking: Booking = {
      ...data,
      id: `bk-${Date.now()}`,
      bookingId,
      paymentStatus: 'PENDING_VERIFICATION',
      bookingStatus: 'Payment review',
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
  }
};

