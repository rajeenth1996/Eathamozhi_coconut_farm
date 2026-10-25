// scripts/e2e-test-scratch.js
// Complete End-to-End Test from scratch:
// 0. Clean reset of all existing data
// 1. Upload sample image to Cloudinary via /api/upload
// 2. Create Mother Tree (EM-MP-001)
// 3. Create Batch (EM-0126-A) linked to EM-MP-001
// 4. Place Customer Booking for 5 saplings
// 5. Apply Inventory Audit (+10 saplings) via authenticated Admin API
// 6. Submit Customer Enquiry
// 7. Submit Customer Feedback Review
// 8. Verify all endpoints, HTML pages, stock calculations, and image sync
const fs = require('fs');
const path = require('path');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch {}

const { SignJWT } = require('jose');
const BASE_URL = 'http://localhost:3000';

// Read .env.local manually
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

async function getAdminCookie() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'svrajeenth22@gmail.com').trim().toLowerCase();
  const secret = process.env.JWT_SECRET || 'eathamozhi-coconut-farm-secure-jwt-secret-key-min-32-chars';
  const key = new TextEncoder().encode(secret);
  const token = await new SignJWT({ email: adminEmail, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(key);
  return `admin_session=${token}`;
}

async function runE2ETest() {
  console.log('🚀 ==========================================');
  console.log('🚀 STARTING FULL SCRATCH E2E VERIFICATION TEST');
  console.log('🚀 ==========================================\n');

  // STEP 0: Reset All Data to Scratch State
  console.log('🧹 Step 0: Purging existing data from local db.json and MongoDB Atlas...');
  const mongoose = require('mongoose');
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('xxxxx')) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
      const db = mongoose.connection.db;
      for (const coll of ['parentpalms', 'batches', 'bookings', 'enquiries', 'reviews', 'inventoryadjustments', 'pageviews', 'visitorjourneys']) {
        try { await db.collection(coll).deleteMany({}); } catch {}
      }
      await mongoose.disconnect();
      console.log('   ✅ MongoDB Atlas collections purged.');
    } catch (err) {
      console.warn('   ⚠️ MongoDB Atlas connection warning:', err.message);
    }
  }

  const dbJsonPath = path.join(__dirname, '..', 'src', 'data', 'db.json');
  let faqs = [];
  if (fs.existsSync(dbJsonPath)) {
    try {
      const current = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));
      if (Array.isArray(current.faqs)) faqs = current.faqs;
    } catch {}
  }
  const cleanDb = {
    parentPalms: [],
    batches: [],
    bookings: [],
    adjustments: [],
    enquiries: [],
    reviews: [],
    faqs,
    pageViews: [],
    visitorJourneys: []
  };
  fs.writeFileSync(dbJsonPath, JSON.stringify(cleanDb, null, 2), 'utf-8');
  console.log('   ✅ Local db.json purged.\n');

  // STEP 1: Upload real test image to Cloudinary via /api/upload
  console.log('📸 Step 1: Uploading test image to Cloudinary...');
  const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'mother-trees',
      image: testBase64
    })
  });
  
  if (!uploadRes.ok) {
    throw new Error(`Upload failed with status ${uploadRes.status}: ${await uploadRes.text()}`);
  }
  const uploadData = await uploadRes.json();
  const testImageUrl = uploadData.url;
  console.log(`✅ Upload successful! Cloudinary URL: ${testImageUrl}\n`);

  // STEP 2: Create Fresh Mother Tree
  console.log('🌴 Step 2: Registering Ancestral Mother Tree (EM-MP-001)...');
  const motherTreePayload = {
    code: 'EM-MP-001',
    name: 'Ancestral GI Mother Palm #1',
    age: 85,
    location: 'Plot A - Heritage Grove North, Eathamozhi',
    healthStatus: 'Vigorous & Pest-Free',
    yieldHistory: 'Consistently high-weight seed nuts per year over 25 monitored years.',
    description: 'Our flagship mother palm planted on coastal saline-alluvial soil. Exceptional trunk girth and dense canopy.',
    nutCharacteristics: 'Large spherical nuts with high dry copra content and sweet water volume > 350ml.',
    whySelected: '100% farm grown seedlings with strong wind tolerance during coastal storms.',
    images: [testImageUrl]
  };

  const treeRes = await fetch(`${BASE_URL}/api/parent-palms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(motherTreePayload)
  });

  if (!treeRes.ok) {
    throw new Error(`Create Mother Tree failed: ${await treeRes.text()}`);
  }
  const treeData = await treeRes.json();
  console.log(`✅ Mother Tree Created: ${treeData.code} - ${treeData.name}`);
  console.log(`   Image URL in sync: ${treeData.images[0]}\n`);

  // STEP 3: Create Fresh Batch tied to Mother Tree
  console.log('📦 Step 3: Registering Sapling Batch (EM-0126-A) tied to EM-MP-001...');
  const batchPayload = {
    batchCode: 'EM-0126-A',
    name: 'Heritage Eathamozhi Prime Batch #1',
    parentPalmCode: 'EM-MP-001',
    parentPalmCodes: ['EM-MP-001'],
    harvestDate: '2025-08-01',
    seededDate: '2025-08-15',
    totalQuantity: 300,
    price: 150,
    description: 'First generation sapling progeny directly harvested from Ancestral GI Mother Palm #1. Vigorous root system and thick collar girth.',
    images: [testImageUrl]
  };

  const batchRes = await fetch(`${BASE_URL}/api/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchPayload)
  });

  if (!batchRes.ok) {
    throw new Error(`Create Batch failed: ${await batchRes.text()}`);
  }
  const batchData = await batchRes.json();
  console.log(`✅ Batch Created: ${batchData.batchCode} - ${batchData.name}`);
  console.log(`   Total Quantity: ${batchData.totalQuantity}, Available: ${batchData.availableQuantity}, Price: ₹${batchData.price}`);
  console.log(`   Images: ${batchData.images[0]}\n`);

  // STEP 4: Place a customer booking for 5 saplings
  console.log('🛒 Step 4: Placing customer booking for 5 saplings...');
  const bookingPayload = {
    batchCode: 'EM-0126-A',
    customerName: 'Rajeenth Kumar',
    mobile: '9486880641',
    district: 'Kanyakumari',
    state: 'Tamil Nadu',
    pinCode: '629001',
    deliveryService: 'MSS Parcel Service',
    nearestHub: 'Nagercoil Hub',
    quantity: 5,
    subtotal: 750,
    deliveryCharge: 250,
    totalAmount: 1000,
    paymentScreenshotUrl: testImageUrl,
    specialInstructions: 'Handle with care for coastal farm planting'
  };

  const TEST_IP = `192.168.10.${Math.floor(Math.random() * 200 + 10)}`;

  const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-forwarded-for': TEST_IP
    },
    body: JSON.stringify(bookingPayload)
  });

  if (!bookRes.ok) {
    throw new Error(`Booking failed: ${await bookRes.text()}`);
  }
  const bookData = await bookRes.json();
  console.log(`✅ Booking Created Successfully!`);
  console.log(`   Booking ID: ${bookData.bookingId}`);
  console.log(`   Customer: ${bookData.customerName} (${bookData.mobile})`);
  console.log(`   Quantity: ${bookData.quantity}`);
  console.log(`   Subtotal: ₹${bookData.subtotal}, Delivery: ₹${bookData.deliveryCharge}, Total: ₹${bookData.totalAmount}`);
  console.log(`   Status: ${bookData.bookingStatus}, Payment: ${bookData.paymentStatus}`);
  console.log(`   Payment Screenshot: ${bookData.paymentScreenshotUrl}\n`);

  // STEP 5: Verify Batch Stock Updated Dynamically
  console.log('📊 Step 5: Checking dynamic stock calculation for EM-0126-A...');
  const checkBatchRes = await fetch(`${BASE_URL}/api/batches/EM-0126-A`);
  const checkBatch = await checkBatchRes.json();
  console.log(`   Batch: ${checkBatch.batchCode}`);
  console.log(`   Total: ${checkBatch.totalQuantity}`);
  console.log(`   Booked: ${checkBatch.bookedQuantity} (Expected: 5)`);
  console.log(`   Available: ${checkBatch.availableQuantity} (Expected: 295)`);
  if (checkBatch.bookedQuantity !== 5 || checkBatch.availableQuantity !== 295) {
    throw new Error(`Stock mismatch! Expected booked: 5, available: 295. Got booked: ${checkBatch.bookedQuantity}, available: ${checkBatch.availableQuantity}`);
  }
  console.log(`✅ Stock calculation verified perfectly!\n`);

  // STEP 6: Inventory Adjustment Audit (+10 saplings added)
  console.log('📝 Step 6: Testing Inventory Audit Adjustment (+10 sprouted saplings)...');
  const adminCookie = await getAdminCookie();
  const adjRes = await fetch(`${BASE_URL}/api/admin/inventory`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({
      batchCode: 'EM-0126-A',
      change: 10,
      reason: 'Routine nursery count audit: +10 healthy sprouted seednuts added',
      adminName: 'Rajeenth (Farm Owner)'
    })
  });
  if (!adjRes.ok) {
    throw new Error(`Inventory audit failed: ${await adjRes.text()}`);
  }
  const adjData = await adjRes.json();
  console.log(`✅ Inventory Adjustment logged: +10 for ${adjData.log.batchCode}`);
  
  // Re-verify stock with adjustment
  const afterAdjRes = await fetch(`${BASE_URL}/api/batches/EM-0126-A`);
  const afterAdj = await afterAdjRes.json();
  console.log(`   Net Stock: ${afterAdj.totalQuantity + afterAdj.inventoryAdjustments} (Expected: 310)`);
  console.log(`   Available: ${afterAdj.availableQuantity} (Expected: 305)`);
  if (afterAdj.availableQuantity !== 305) {
    throw new Error(`Available stock after adjustment mismatch! Expected 305, got ${afterAdj.availableQuantity}`);
  }
  console.log(`✅ Inventory adjustment reflected in live availability!\n`);

  // STEP 7: Customer Enquiry
  console.log('✉️ Step 7: Submitting Customer Enquiry...');
  const enqPayload = {
    name: 'Kavitha Sundaram',
    mobile: '9842100000',
    location: 'Tirunelveli, Tamil Nadu',
    message: 'Looking for 100 saplings for our family farm in Tirunelveli. Can you confirm delivery timeline?'
  };
  const enqRes = await fetch(`${BASE_URL}/api/enquiries`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-forwarded-for': TEST_IP
    },
    body: JSON.stringify(enqPayload)
  });
  if (!enqRes.ok) {
    throw new Error(`Enquiry submission failed: ${await enqRes.text()}`);
  }
  const enqData = await enqRes.json();
  console.log(`✅ Customer Enquiry registered: ID ${enqData.id} from ${enqData.name}\n`);

  // STEP 8: Customer Feedback Review
  console.log('⭐ Step 8: Submitting Customer Feedback Review...');
  const revPayload = {
    customerName: 'Murugan K.',
    location: 'Nagercoil, Kanyakumari',
    batchCode: 'EM-0126-A',
    quantity: 20,
    rating: 5,
    comment: 'Exceptional quality! Thick collar girth, healthy green fronds, and perfectly packed roots. 100% authentic Eathamozhi GI tall variety.'
  };
  const revRes = await fetch(`${BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-forwarded-for': TEST_IP
    },
    body: JSON.stringify(revPayload)
  });
  if (!revRes.ok) {
    throw new Error(`Review submission failed: ${await revRes.text()}`);
  }
  const revData = await revRes.json();
  console.log(`✅ Customer Review registered: 5-star review from ${revData.customerName}\n`);

  // STEP 9: Cross-Page Synchronization & Verification
  console.log('🌐 Step 9: Verifying Cross-Page Synchronization & Live Data...');

  const pagesToTest = [
    { url: `${BASE_URL}/`, name: 'Home Page', checks: ['EM-0126-A', 'Ancestral GI Mother Palm #1', '305'] },
    { url: `${BASE_URL}/farm`, name: 'Farm / Mother Trees Page', checks: ['EM-MP-001', 'Ancestral GI Mother Palm #1', '305', 'Saplings Available'] },
    { url: `${BASE_URL}/batches`, name: 'Batches Page', checks: ['EM-0126-A', '305', '150'] },
    { url: `${BASE_URL}/batches/EM-0126-A`, name: 'Batch Detail Page', checks: ['EM-0126-A', 'EM-MP-001', '305'] },
    { url: `${BASE_URL}/parent-palm/EM-MP-001`, name: 'Mother Tree Detail Page', checks: ['EM-MP-001', 'EM-0126-A', '305'] },
    { url: `${BASE_URL}/book/EM-0126-A`, name: 'Booking Page (SSR)', checks: ['spinner-border'] },
    { url: `${BASE_URL}/confirmation/${bookData.bookingId}`, name: 'Order Confirmation Page', checks: [bookData.bookingId, 'Booking Details Recorded!'] },
    { url: `${BASE_URL}/tracking`, name: 'Tracking Page', checks: ['Track Your Sapling Order'] },
    { url: `${BASE_URL}/reviews`, name: 'Reviews Page', checks: ['Murugan K.', 'EM-0126-A'] }
  ];

  for (const page of pagesToTest) {
    const res = await fetch(page.url);
    if (!res.ok) {
      throw new Error(`Page ${page.name} (${page.url}) returned status ${res.status}`);
    }
    const html = await res.text();
    for (const check of page.checks) {
      if (!html.includes(check)) {
        throw new Error(`Page ${page.name} missing expected string: "${check}"`);
      }
    }
    console.log(`   ✅ ${page.name} (${page.url}) OK & verified synchronized!`);
  }

  // Verify Booking Flow Data Backend for /book/[code] and /confirmation/[id]
  console.log('\n📱 Verifying Client-Side Interactive Page Data Backends...');
  const bookBatchApiRes = await fetch(`${BASE_URL}/api/batches/EM-0126-A`);
  const bookBatchApi = await bookBatchApiRes.json();
  if (bookBatchApi.price !== 150 || bookBatchApi.availableQuantity !== 305) {
    throw new Error('Booking page backend data mismatch for EM-0126-A');
  }
  console.log('   ✅ /book/EM-0126-A data source verified (Price: ₹150, Available: 305)');

  const confirmApiRes = await fetch(`${BASE_URL}/api/bookings/${bookData.bookingId}`);
  const confirmApi = await confirmApiRes.json();
  if (confirmApi.customerName !== 'Rajeenth Kumar' || confirmApi.quantity !== 5 || confirmApi.totalAmount !== 1000) {
    throw new Error(`Confirmation page backend data mismatch for ${bookData.bookingId}`);
  }
  console.log(`   ✅ /confirmation/${bookData.bookingId} data source verified (Customer: ${confirmApi.customerName}, Total: ₹${confirmApi.totalAmount})`);

  // STEP 10: Verify Image Accessibility
  console.log('\n🖼️ Step 10: Verifying Image URLs HTTP Reachability...');
  const imgRes = await fetch(testImageUrl, { method: 'HEAD' });
  if (!imgRes.ok) {
    throw new Error(`Image URL unreachable: ${testImageUrl} returned status ${imgRes.status}`);
  }
  console.log(`   ✅ Cloudinary Image Reachable: ${testImageUrl} (HTTP ${imgRes.status})`);

  // STEP 11: Verify Order Tracking by Mobile
  console.log('\n🔍 Step 11: Testing Order Tracking by Mobile API...');
  const trackRes = await fetch(`${BASE_URL}/api/bookings?mobile=9486880641`);
  const trackedOrders = await trackRes.json();
  if (!Array.isArray(trackedOrders) || trackedOrders.length === 0) {
    throw new Error('Order tracking returned no orders for 9486880641');
  }
  console.log(`   ✅ Tracking API returned ${trackedOrders.length} order(s) for customer 9486880641. Status: ${trackedOrders[0].bookingStatus}`);

  // STEP 12: Verify Admin Portal Pages Load with Authentication
  console.log('\n🛡️ Step 12: Verifying Admin Dashboard & Resource Pages with Session...');
  const adminPages = [
    { url: `${BASE_URL}/admin`, name: 'Admin Dashboard', checks: ['Eathamozhi Farm Admin Dashboard', 'SECURE ADMIN PORTAL'] },
    { url: `${BASE_URL}/admin/orders`, name: 'Admin Orders', checks: ['Orders', 'Admin'] },
    { url: `${BASE_URL}/admin/batches`, name: 'Admin Batches', checks: ['Batches', 'Admin'] },
    { url: `${BASE_URL}/admin/mother-trees`, name: 'Admin Mother Trees', checks: ['Mother Tree', 'MOTHER TREE GENETICS'] },
    { url: `${BASE_URL}/admin/analytics`, name: 'Admin Analytics', checks: ['Analytics'] }
  ];

  for (const ap of adminPages) {
    const res = await fetch(ap.url, { headers: { 'Cookie': adminCookie } });
    if (!res.ok) {
      throw new Error(`Admin page ${ap.name} returned status ${res.status}`);
    }
    const html = await res.text();
    for (const check of ap.checks) {
      if (!html.includes(check)) {
        throw new Error(`Admin page ${ap.name} missing expected string: "${check}"`);
      }
    }
    console.log(`   ✅ ${ap.name} (${ap.url}) OK & verified!`);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL 12 END-TO-END TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================');
}

runE2ETest().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
