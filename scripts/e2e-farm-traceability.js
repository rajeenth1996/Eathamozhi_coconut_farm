/**
 * Complete End-to-End System Test:
 * Farm Registry, Mother Tree Management, Multi-Farm Sourcing,
 * Germination, Inventory Accounting, Order Booking & Dispatch,
 * Traceability Graph, and 9 Audit Reports.
 */

const { DataStore } = require('../src/lib/dataStore');
const { generateFarmId, generateMotherTreeId, generateBatchId, formatBatchDisplayName } = require('../src/lib/idGenerator');

async function runEndToEndTests() {
  console.log('\n===============================================================');
  console.log('🚀 RUNNING E2E TEST SUITE: FARM REGISTRY & BATCH TRACEABILITY');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // MODULE 1: FARM ID GENERATOR & FARM REGISTRY
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Farm ID Generation & Registration ---');
    const { farmId: farmId1 } = await generateFarmId('Eathamozhi', 'Rajeenth');
    assert(farmId1.startsWith('ETH-RA-F'), 'Farm ID format for Eathamozhi + Rajeenth', farmId1);

    const { farmId: farmId2 } = await generateFarmId('Eathamozhi', 'Suresh');
    assert(farmId2.startsWith('ETH-SU-F'), 'Farm ID format for Eathamozhi + Suresh', farmId2);

    const { farmId: farmId3 } = await generateFarmId('Agasteeswaram', 'Kumar');
    assert(farmId3.startsWith('AGA-KU-F'), 'Farm ID format for Agasteeswaram + Kumar', farmId3);

    // Register a test farm
    const testFarmCode = `ETH-TS-F999`;
    const newFarm = await DataStore.addFarmAsync({
      farmCode: testFarmCode,
      farmName: 'Test Heritage Estate',
      ownerName: 'Test Suresh',
      location: 'Eathamozhi Village',
      status: 'Active',
      notes: 'Automated E2E testing farm'
    });
    assert(newFarm && newFarm.farmCode === testFarmCode, 'Create new farm in registry', newFarm.farmCode);

    const retrievedFarm = await DataStore.getFarmByCodeAsync(testFarmCode);
    assert(retrievedFarm && retrievedFarm.ownerName === 'Test Suresh', 'Retrieve registered farm by code');

    // -------------------------------------------------------------------------
    // MODULE 3: MOTHER TREE REGISTRY
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Mother Tree Registration ---');
    const mtId = await generateMotherTreeId(testFarmCode);
    assert(mtId.startsWith(`${testFarmCode}-MT`), 'Mother Tree ID format', mtId);

    const newTree = await DataStore.addParentPalmAsync({
      code: mtId,
      motherTreeCode: mtId,
      farmCode: testFarmCode,
      farmId: newFarm.id,
      name: 'Ancestral Tall #99',
      variety: 'Eathamozhi Tall',
      age: 45,
      height: '38 ft',
      annualYield: 140,
      healthStatus: 'Excellent',
      selectionStatus: 'Selected',
      verificationStatus: 'Verified',
      productionStatus: 'Active for Production',
      images: ['/images/trees/tree1.jpg'],
      isVisible: true
    });
    assert(newTree && newTree.motherTreeCode === mtId, 'Register Mother Tree under Farm', newTree.motherTreeCode);

    const farmTrees = await DataStore.getParentPalmsByFarmAsync(testFarmCode);
    assert(farmTrees.some(t => t.motherTreeCode === mtId), 'Verify mother tree appears in farm listing');

    // -------------------------------------------------------------------------
    // MODULE 4: MULTI-FARM BATCH CREATION & SOURCING
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Batch Creation with Multi-Farm Sourcing ---');
    const seededDate = '2026-11-15';
    const { batchId } = await generateBatchId(testFarmCode, seededDate);
    assert(batchId.startsWith(`${testFarmCode}-November'26-B`), 'Generated Batch ID format', batchId);

    const displayName = formatBatchDisplayName(testFarmCode, batchId, seededDate);
    assert(displayName.includes(testFarmCode) && displayName.includes('November 2026'), 'Customer display name format', displayName);

    const newBatch = await DataStore.addBatchAsync({
      batchId,
      batchCode: batchId,
      name: displayName,
      primaryFarmCode: testFarmCode,
      primaryFarmId: newFarm.id,
      parentPalmCode: mtId,
      harvestDate: '2026-10-25',
      seededDate: seededDate,
      expectedReadyDate: '2027-09-15',
      totalQuantity: 200,
      availableQuantity: 200,
      bookedQuantity: 0,
      germinationPercentage: 85,
      status: 'In Germination',
      pricePerSapling: 350,
      isVisible: true,
      sources: [
        {
          farmCode: testFarmCode,
          farmId: newFarm.id,
          farmName: 'Test Heritage Estate',
          motherTreeCode: mtId,
          coconutQuantity: 250,
          collectionDate: '2026-10-20',
          collectionStatus: 'Collected'
        }
      ]
    });
    assert(newBatch && newBatch.batchCode === batchId, 'Create batch with linked source', newBatch.batchCode);

    // -------------------------------------------------------------------------
    // MODULE 5.1: GERMINATION TRACKING
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Germination Tracking ---');
    const sources = await DataStore.getBatchSourcesAsync(batchId);
    assert(sources.length > 0, 'Batch source record initialized', `Count: ${sources.length}`);

    const sourceToUpdate = sources[0];
    const updatedSource = await DataStore.updateGerminationAsync(sourceToUpdate.id, {
      coconutsSown: 220,
      germinatedQuantity: 180,
      rejectedQuantity: 20,
      germinationStage: 'First Shoots Emerge',
      notes: 'Excellent healthy root emergence'
    });

    assert(updatedSource && updatedSource.germinatedQuantity === 180, 'Update germination data on source');
    assert(updatedSource.germinationRate === '82%', 'Germination rate correctly calculated (180/220 = 82%)', updatedSource.germinationRate);

    // -------------------------------------------------------------------------
    // MODULE 5.2: SEEDLING INVENTORY ACCOUNTING & ADJUSTMENT
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Seedling Inventory Accounting ---');
    const invRecords = await DataStore.getBatchInventoryAsync(batchId);
    assert(invRecords.length > 0, 'Batch inventory record created for source');

    const inv = invRecords[0];
    assert(inv.seedlingsProduced === 180, 'Inventory seedlingsProduced matches germinatedQuantity (180)', inv.seedlingsProduced);
    assert(inv.availableQuantity === 160, 'Available quantity matches produced minus rejected (180 - 20 = 160)', inv.availableQuantity);

    // Adjust damage and rejection
    const adjustedInv = await DataStore.adjustSourceInventoryAsync(inv.batchSourceId, {
      damagedQuantity: 5,
      rejectedQuantity: 5
    });
    assert(adjustedInv && adjustedInv.damagedQuantity === 5, 'Record 5 damaged seedlings');
    assert(adjustedInv.availableQuantity === 170, 'Available correctly updated: 180 - 5 - 5 = 170', adjustedInv.availableQuantity);

    // -------------------------------------------------------------------------
    // MODULE 6: ORDER BOOKING & SOURCE ALLOCATION
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Order Booking & Source-Level Allocation ---');
    const booking = await DataStore.createBookingAsync({
      customerName: 'Test Farmer Murugan',
      mobile: '9876543210',
      whatsapp: '9876543210',
      batchCode: batchId,
      quantity: 20,
      totalAmount: 7000,
      paidAmount: 3500,
      isPreOrder: true,
      address: 'Near Old Temple, Kottaram',
      district: 'Kanyakumari',
      state: 'Tamil Nadu',
      pinCode: '629703',
      deliveryService: 'MSS Parcel Service'
    });

    assert(booking && booking.bookingId, 'Customer order created', booking.bookingId);
    assert(booking.allocations && booking.allocations.length > 0, 'Order allocated to source mother tree', `Allocs: ${booking.allocations.length}`);
    assert(booking.sourceFarmCode === testFarmCode, 'Order tracks source farm code', booking.sourceFarmCode);

    // Check inventory after booking
    const invAfterBooking = (await DataStore.getBatchInventoryAsync(batchId))[0];
    assert(invAfterBooking.bookedQuantity === 20, 'Inventory booked quantity incremented to 20', invAfterBooking.bookedQuantity);
    assert(invAfterBooking.availableQuantity === 150, 'Inventory available quantity reduced by 20 (170 - 20 = 150)', invAfterBooking.availableQuantity);

    // -------------------------------------------------------------------------
    // MODULE 7: DISPATCH & ZERO DOUBLE SUBTRACTION
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Dispatch Transition (Zero Double Subtraction) ---');
    const dispatchedOrder = await DataStore.updateBookingStatusAsync(
      booking.bookingId,
      'Dispatched',
      'Professional Couriers',
      'PC-TRK-987654'
    );

    assert(dispatchedOrder && dispatchedOrder.bookingStatus === 'Dispatched', 'Order marked as Dispatched');
    assert(dispatchedOrder.trackingId === 'PC-TRK-987654', 'Tracking ID recorded on order');

    const invAfterDispatch = (await DataStore.getBatchInventoryAsync(batchId))[0];
    assert(invAfterDispatch.dispatchedQuantity === 20, 'Inventory dispatchedQuantity incremented to 20', invAfterDispatch.dispatchedQuantity);
    assert(invAfterDispatch.bookedQuantity === 0, 'Inventory bookedQuantity decremented to 0', invAfterDispatch.bookedQuantity);
    assert(invAfterDispatch.availableQuantity === 150, 'Available quantity NOT doubly subtracted! Remains exactly 150', invAfterDispatch.availableQuantity);

    // -------------------------------------------------------------------------
    // MODULE 8: TRACEABILITY GRAPH
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Testing Batch & Order Traceability Graph ---');
    const batchTrace = await DataStore.getBatchTraceabilityAsync(batchId);
    assert(batchTrace && batchTrace.batchCode === batchId, 'Retrieve batch traceability chain');
    assert(batchTrace.contributingFarms.some(f => f.farmCode === testFarmCode), 'Traceability includes contributing farm');
    assert(batchTrace.sources.some(s => s.motherTreeCode === mtId), 'Traceability includes mother tree');

    const orderTrace = await DataStore.getOrderTraceabilityAsync(booking.bookingId);
    assert(orderTrace && orderTrace.bookingId === booking.bookingId, 'Retrieve order traceability chain');
    assert(orderTrace.batch && orderTrace.batch.batchCode === batchId, 'Order trace points to correct batch');
    assert(orderTrace.trackingId === 'PC-TRK-987654', 'Order trace includes dispatch courier & tracking');

    // -------------------------------------------------------------------------
    // MODULE 9: 9 AUDIT & TRACEABILITY REPORTS
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Testing All 9 Audit & Traceability Reports ---');
    const reports = [
      'farm-mother-trees',
      'farm-coconut-collection',
      'farm-batch-contribution',
      'farm-seedling-production',
      'farm-available-inventory',
      'batch-germination',
      'mother-tree-history',
      'batch-dispatch',
      'farm-customer-allocation'
    ];

    for (const rType of reports) {
      const rep = await DataStore.getReportsAsync(rType);
      assert(Array.isArray(rep) && rep.length > 0, `Report: ${rType} generated successfully`, `Records: ${rep.length}`);
    }

    // -------------------------------------------------------------------------
    // CLEANUP TEST DATA (Preserve clean database state)
    // -------------------------------------------------------------------------
    console.log('\n--- Cleanup Test Records ---');
    await DataStore.deleteBatchAsync(batchId);
    await DataStore.deleteParentPalmAsync(mtId);
    await DataStore.deleteFarmAsync(testFarmCode);
    console.log('🧹 Cleaned up temporary test batch, tree, and farm.');

  } catch (err) {
    console.error('Unhandled exception during E2E test:', err);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`📊 E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runEndToEndTests();
