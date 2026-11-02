// scripts/test-backend-apis.js
const { DataStore } = require('../src/lib/dataStore');
const { generateFarmId, generateMotherTreeId, generateBatchId, formatBatchDisplayName, generateLocationCode, generateOwnerCode } = require('../src/lib/idGenerator');

async function runTests() {
  console.log('🧪 Starting Farm Registry & Batch Traceability Backend Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test ID Generators
    console.log('--- TEST 1: ID Generation Rules ---');
    const locCode1 = generateLocationCode('Eathamozhi');
    assert(locCode1 === 'ETH', `Location Eathamozhi -> ETH (got ${locCode1})`);

    const ownerCode1 = generateOwnerCode('Rajeenth');
    assert(ownerCode1 === 'RA', `Owner Rajeenth -> RA (got ${ownerCode1})`);

    const ownerCode2 = generateOwnerCode('Suresh');
    assert(ownerCode2 === 'SU', `Owner Suresh -> SU (got ${ownerCode2})`);

    const ownerCode3 = generateOwnerCode('Aaron');
    assert(ownerCode3 === 'AR', `Owner Aaron -> AR (got ${ownerCode3})`);

    const testFarmId1 = await generateFarmId('Eathamozhi', 'Rajeenth', []);
    assert(testFarmId1.farmId === 'ETH-RA-F001', `Farm ID Eathamozhi + Rajeenth -> ETH-RA-F001 (got ${testFarmId1.farmId})`);

    const testFarmId2 = await generateFarmId('Eathamozhi', 'Suresh', []);
    assert(testFarmId2.farmId === 'ETH-SU-F001', `Farm ID Eathamozhi + Suresh -> ETH-SU-F001 (got ${testFarmId2.farmId})`);

    const testTreeId = await generateMotherTreeId('ETH-RA-F001', []);
    assert(testTreeId === 'ETH-RA-F001-MT001', `Mother Tree ID -> ETH-RA-F001-MT001 (got ${testTreeId})`);

    const testBatchGen = await generateBatchId('ETH-RA-F001', '2026-11-20', []);
    assert(testBatchGen.batchId === "ETH-RA-F001-November'26-B1", `Batch ID -> ETH-RA-F001-November'26-B1 (got ${testBatchGen.batchId})`);

    const displayName = formatBatchDisplayName('ETH-RA-F001', testBatchGen.batchId, 11, 2026);
    assert(displayName === `ETH-RA-F001 ${testBatchGen.batchId} November 2026`, `Batch display name matches requirement (got: "${displayName}")`);

    // 2. Test Farm Registry
    console.log('\n--- TEST 2: Farm Registration & CRUD ---');
    const farmData = {
      farmName: 'Suresh Organic Palms',
      ownerName: 'Suresh',
      location: 'Eathamozhi'
    };
    const newFarm = await DataStore.addFarmAsync(farmData);
    assert(newFarm.farmCode.startsWith('ETH-SU-F'), `Created farm has valid code: ${newFarm.farmCode}`);
    assert(newFarm.ownerCode === 'SU', `Owner code is SU`);
    assert(newFarm.locationCode === 'ETH', `Location code is ETH`);

    const retrievedFarm = await DataStore.getFarmByCodeAsync(newFarm.farmCode);
    assert(retrievedFarm && retrievedFarm.farmName === 'Suresh Organic Palms', `Retrieved farm details by code: ${retrievedFarm?.farmName}`);

    // 3. Test Mother Tree Registry
    console.log('\n--- TEST 3: Mother Tree Registration Linked to Farm ---');
    const treeData = {
      farmCode: newFarm.farmCode,
      name: 'High Yield Ancestral Palm S1',
      variety: 'West Coast Tall (Eathamozhi Tall)',
      age: 45,
      selectionStatus: 'Selected',
      verificationStatus: 'Verified',
      productionStatus: 'Active for Production'
    };
    const newTree = await DataStore.addParentPalmAsync(treeData);
    assert(newTree.farmCode === newFarm.farmCode, `Tree linked to farmCode: ${newTree.farmCode}`);
    assert(newTree.motherTreeCode.startsWith(`${newFarm.farmCode}-MT`), `Tree code formatted correctly: ${newTree.motherTreeCode}`);

    // 4. Test Multi-Farm Batch Creation
    console.log('\n--- TEST 4: Multi-Farm Sourcing Batch Creation ---');
    const defaultFarm = await DataStore.getFarmByCodeAsync('ETH-RA-F001');
    const defaultTrees = (await DataStore.getParentPalmsAsync()).filter(p => p.farmCode === 'ETH-RA-F001');
    const defaultTree = defaultTrees[0];

    const multiFarmBatchData = {
      primaryFarmCode: defaultFarm.farmCode,
      seededDate: '2026-11-15',
      harvestDate: '2026-11-01',
      price: 160,
      totalQuantity: 500,
      sources: [
        {
          farmId: defaultFarm.id,
          farmCode: defaultFarm.farmCode,
          farmName: defaultFarm.farmName,
          motherTreeId: defaultTree.id,
          motherTreeCode: defaultTree.motherTreeCode || defaultTree.code,
          motherTreeName: defaultTree.name,
          coconutQuantity: 200,
          coconutsSown: 200,
          collectionDate: '2026-11-01',
          collectionStatus: 'Verified',
          germinatedQuantity: 190,
          rejectedQuantity: 10,
          notes: 'Source 1 from primary heritage grove'
        },
        {
          farmId: newFarm.id,
          farmCode: newFarm.farmCode,
          farmName: newFarm.farmName,
          motherTreeId: newTree.id,
          motherTreeCode: newTree.motherTreeCode,
          motherTreeName: newTree.name,
          coconutQuantity: 300,
          coconutsSown: 300,
          collectionDate: '2026-11-02',
          collectionStatus: 'Verified',
          germinatedQuantity: 285,
          rejectedQuantity: 15,
          notes: 'Source 2 from Suresh organic grove'
        }
      ]
    };

    const multiBatch = await DataStore.addBatchAsync(multiFarmBatchData);
    assert(multiBatch && multiBatch.batchCode.startsWith("ETH-RA-F001-November'26-B"), `Multi-farm batch created with code: ${multiBatch?.batchCode}`);

    const batchSources = await DataStore.getBatchSourcesAsync(multiBatch.batchCode);
    assert(batchSources.length === 2, `Batch has 2 distinct contributing sources (got ${batchSources.length})`);
    assert(batchSources.some(s => s.farmCode === defaultFarm.farmCode) && batchSources.some(s => s.farmCode === newFarm.farmCode), `Sources belong to multiple farms (ETH-RA-F001 & ${newFarm.farmCode})`);

    const batchInvs = await DataStore.getBatchInventoryAsync(multiBatch.batchCode);
    assert(batchInvs.length === 2, `Batch has 2 source inventory records`);
    const totalAvail = batchInvs.reduce((sum, i) => sum + i.availableQuantity, 0);
    assert(totalAvail === 475, `Total available seedlings across sources is 190 + 285 = 475 (got ${totalAvail})`);

    // 5. Test Customer Order Allocation & Reservation
    console.log('\n--- TEST 5: Customer Order Allocation & Stock Reservation ---');
    const bookingData = {
      batchCode: multiBatch.batchCode,
      customerName: 'Kavitha Raman',
      mobile: '9840123456',
      whatsapp: '9840123456',
      address: '14 Temple View Road, Nagercoil',
      district: 'Kanyakumari',
      state: 'Tamil Nadu',
      pinCode: '629001',
      quantity: 50,
      subtotal: 8000,
      deliveryCharge: 500,
      totalAmount: 8500
    };

    const booking = await DataStore.createBookingAsync(bookingData);
    assert(booking && booking.bookingId, `Customer booking created: ${booking.bookingId}`);
    assert(Array.isArray(booking.allocations) && booking.allocations.length > 0, `Booking has source allocations: ${JSON.stringify(booking.allocations.map(a => `${a.farmCode}:${a.quantity}`))}`);

    const inProgressInvs = await DataStore.getBatchInventoryAsync(multiBatch.batchCode);
    const postBookAvail = inProgressInvs.reduce((sum, i) => sum + i.availableQuantity, 0);
    const postBookBooked = inProgressInvs.reduce((sum, i) => sum + i.bookedQuantity, 0);
    assert(postBookAvail === 425, `Available stock reserved from 475 to 425 (got ${postBookAvail})`);
    assert(postBookBooked === 50, `Booked quantity increased to 50 (got ${postBookBooked})`);

    // 6. Test Dispatch Transaction (No Double Subtraction)
    console.log('\n--- TEST 6: Dispatch Order Without Double Subtraction ---');
    const dispatched = await DataStore.updateBookingStatusAsync(booking.bookingId, 'Dispatched', 'MSS Parcel Service', 'MSS-TRK-9901');
    assert(dispatched && dispatched.bookingStatus === 'Dispatched', `Order status updated to Dispatched`);

    const postDispatchInvs = await DataStore.getBatchInventoryAsync(multiBatch.batchCode);
    const postDispAvail = postDispatchInvs.reduce((sum, i) => sum + i.availableQuantity, 0);
    const postDispBooked = postDispatchInvs.reduce((sum, i) => sum + i.bookedQuantity, 0);
    const postDispDispatched = postDispatchInvs.reduce((sum, i) => sum + i.dispatchedQuantity, 0);

    assert(postDispBooked === 0, `Booked quantity shifted from 50 to 0 (got ${postDispBooked})`);
    assert(postDispDispatched === 50, `Dispatched quantity increased to 50 (got ${postDispDispatched})`);
    assert(postDispAvail === 425, `Available quantity remains intact at 425 with NO double subtraction (got ${postDispAvail})`);

    // 7. Test Full Traceability
    console.log('\n--- TEST 7: Batch and Customer Order Traceability ---');
    const batchTrace = await DataStore.getBatchTraceabilityAsync(multiBatch.batchCode);
    assert(batchTrace.isMixedSource === true, `Batch traceability accurately identifies multi-farm mixed sources: ${batchTrace.isMixedSource}`);
    assert(batchTrace.contributingFarmsCount === 2, `Traceability reports 2 contributing farms`);

    const orderTrace = await DataStore.getOrderTraceabilityAsync(booking.bookingId);
    assert(orderTrace.customerName === 'Kavitha Raman', `Order traceability links customer: ${orderTrace.customerName}`);
    assert(orderTrace.batch && orderTrace.batch.batchCode === multiBatch.batchCode, `Order links back to batch ${multiBatch.batchCode}`);

    // 8. Test Reports
    console.log('\n--- TEST 8: All 9 Analytics & Traceability Reports ---');
    const r1 = await DataStore.getReportsAsync('farm-mother-trees');
    assert(Array.isArray(r1) && r1.length > 0, `Report 1: Farm Mother Trees report works (${r1.length} farms)`);

    const r2 = await DataStore.getReportsAsync('farm-coconut-collection');
    assert(Array.isArray(r2) && r2.length > 0, `Report 2: Coconut Collection report works`);

    const r3 = await DataStore.getReportsAsync('farm-batch-contribution');
    assert(Array.isArray(r3) && r3.length > 0, `Report 3: Batch Contribution report works`);

    const r4 = await DataStore.getReportsAsync('farm-seedling-production');
    assert(Array.isArray(r4) && r4.length > 0, `Report 4: Seedling Production report works`);

    const r5 = await DataStore.getReportsAsync('farm-available-inventory');
    assert(Array.isArray(r5) && r5.length > 0, `Report 5: Available Inventory report works`);

    const r6 = await DataStore.getReportsAsync('batch-germination');
    assert(Array.isArray(r6) && r6.length > 0, `Report 6: Batch Germination report works`);

    const r7 = await DataStore.getReportsAsync('mother-tree-history');
    assert(Array.isArray(r7) && r7.length > 0, `Report 7: Mother Tree History report works`);

    const r8 = await DataStore.getReportsAsync('batch-dispatch');
    assert(Array.isArray(r8) && r8.length > 0, `Report 8: Batch Dispatch report works`);

    const r9 = await DataStore.getReportsAsync('farm-customer-allocation');
    assert(Array.isArray(r9) && r9.length > 0, `Report 9: Farm Customer Allocation report works`);

    // Clean up test records
    await DataStore.deleteBatchAsync(multiBatch.batchCode);
    await DataStore.deleteParentPalmAsync(newTree.code);
    await DataStore.deleteFarmAsync(newFarm.farmCode);
    console.log('\n🧹 Test records cleaned up.');

  } catch (err) {
    console.error('❌ Test failed with exception:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Test Execution Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runTests();
