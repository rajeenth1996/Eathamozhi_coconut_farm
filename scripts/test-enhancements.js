const fetch = globalThis.fetch || require('node-fetch');
const { SignJWT } = require('jose');
const fs = require('fs');
const path = require('path');

// Manually parse .env / .env.local
function loadEnv() {
  for (const file of ['.env', '.env.local']) {
    const full = path.join(__dirname, '..', file);
    if (fs.existsSync(full)) {
      const content = fs.readFileSync(full, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          const val = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  }
}
loadEnv();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const JWT_SECRET_STRING = process.env.JWT_SECRET || 'eathamozhi_admin_super_secret_jwt_key_2026_secured_coconut';
const JWT_KEY = new TextEncoder().encode(JWT_SECRET_STRING);
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'svrajeenth22@gmail.com').trim().toLowerCase();

async function run() {
  console.log(`\n======================================================`);
  console.log(`  EATHAMOZHI COCONUT FARM - ENHANCEMENTS TEST SUITE  `);
  console.log(`  Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  const adminToken = await new SignJWT({ email: ADMIN_EMAIL, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1d')
    .sign(JWT_KEY);

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
    // 1. YouTube Video CRUD
    console.log(`[TEST 1] Testing YouTube Video CRUD...`);
    const ytPostRes = await fetch(`${BASE_URL}/api/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Authentic Eathamozhi Coconut Grove Walkthrough',
        url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
        order: 1,
        isVisible: true
      })
    });
    assert(ytPostRes.status === 201, `Create YouTube video returns 201`);
    const createdYt = await ytPostRes.json();
    assert(createdYt.id && createdYt.title === 'Authentic Eathamozhi Coconut Grove Walkthrough', `Created video has ID and correct title`);
    assert(createdYt.videoId === 'ScMzIvxBSi4', `Video ID extracted automatically (${createdYt.videoId})`);

    const ytListRes = await fetch(`${BASE_URL}/api/youtube`);
    const ytList = await ytListRes.json();
    assert(Array.isArray(ytList) && ytList.some(v => v.id === createdYt.id), `YouTube video is listed in GET /api/youtube`);

    // Clean up created YT video
    await fetch(`${BASE_URL}/api/youtube/${createdYt.id}`, { method: 'DELETE' });

    // 2. Batch Naming Convention & Customer-Facing Batch Name (Requirement 13)
    console.log(`\n[TEST 2] Testing Batch ID & Customer-Facing Batch Name...`);
    const batchCreateRes = await fetch(`${BASE_URL}/api/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        primaryFarmCode: 'ETH-RA-F001',
        harvestDate: '2026-11-01',
        seededDate: '2026-11-15',
        price: 160,
        age: '9 months',
        height: 'Approx. 2–3 ft',
        description: 'Testing new naming convention',
        sources: []
      })
    });
    assert(batchCreateRes.status === 201, `Create batch returns 201`);
    const createdBatch = await batchCreateRes.json();
    console.log(`  -> Generated Batch Code: ${createdBatch.batchCode}`);
    console.log(`  -> Generated Batch Name: ${createdBatch.name}`);
    const namingPattern = /^EF\d{2}-Nov26-B\d+$/;
    assert(namingPattern.test(createdBatch.batchCode), `Batch code matches pattern <Farm Code>-<Month><YY>-B<Seq> (${createdBatch.batchCode})`);
    const namePattern = /^November 2026 \(EF\d{2}-Nov26-B\d+\)$/;
    assert(namePattern.test(createdBatch.name), `Customer-facing batch name matches <Month> <Year> (<Batch ID>) (${createdBatch.name})`);
    assert(createdBatch.age === '9 months', `Batch age persisted correctly`);
    assert(createdBatch.height.includes('Approx.'), `Batch height is marked Approx.`);

    // 3. Batch Views Tracking (Farmer count persistence)
    console.log(`\n[TEST 3] Testing Batch Views Tracking (Unique Farmer Count)...`);
    const viewRes1 = await fetch(`${BASE_URL}/api/batches/${encodeURIComponent(createdBatch.batchCode)}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: 'farmer_session_alpha' })
    });
    const viewData1 = await viewRes1.json();
    assert(viewData1.viewsCount >= 1, `First unique view increments viewsCount (${viewData1.viewsCount})`);

    // Repeated refresh from same visitor should NOT increment unique views count
    const viewRes2 = await fetch(`${BASE_URL}/api/batches/${encodeURIComponent(createdBatch.batchCode)}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: 'farmer_session_alpha' })
    });
    const viewData2 = await viewRes2.json();
    assert(viewData2.viewsCount === viewData1.viewsCount, `Repeated refresh from same visitorId does not inflate count (${viewData2.viewsCount})`);

    // New visitor should increment
    const viewRes3 = await fetch(`${BASE_URL}/api/batches/${encodeURIComponent(createdBatch.batchCode)}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: 'farmer_session_beta' })
    });
    const viewData3 = await viewRes3.json();
    assert(viewData3.viewsCount === viewData1.viewsCount + 1, `New unique visitorId increments viewsCount to ${viewData3.viewsCount}`);

    // Cleanup test batch
    await fetch(`${BASE_URL}/api/batches?code=${encodeURIComponent(createdBatch.batchCode)}`, { method: 'DELETE' });

    // 4. Farm Deletion Validation
    console.log(`\n[TEST 4] Testing Farm Deletion Validation...`);
    // Attempt to delete ETH-RA-F001 (which has mother trees and batches)
    const delBlockedRes = await fetch(`${BASE_URL}/api/farms/ETH-RA-F001`, { method: 'DELETE' });
    assert(delBlockedRes.status === 400, `Deletion of farm with trees/batches is blocked (status 400)`);
    const delBlockedJson = await delBlockedRes.json();
    assert(delBlockedJson.error && delBlockedJson.error.includes('Cannot delete farm'), `Error message explains block: "${delBlockedJson.error}"`);

    // Create an empty farm with no trees or batches, then verify it CAN be deleted
    const createEmptyFarmRes = await fetch(`${BASE_URL}/api/farms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmName: 'Temporary Test Grove',
        ownerName: 'Test Owner',
        location: 'Kottar',
        status: 'Active'
      })
    });
    assert(createEmptyFarmRes.status === 201, `Empty farm created`);
    const emptyFarm = await createEmptyFarmRes.json();
    console.log(`  -> Created Empty Farm ID: ${emptyFarm.farmCode}`);

    const delAllowedRes = await fetch(`${BASE_URL}/api/farms/${emptyFarm.farmCode}`, { method: 'DELETE' });
    assert(delAllowedRes.status === 200, `Deletion of unassociated farm succeeded with 200`);

    // 5. Mother Tree Farm ID Editable & Approximate Age
    console.log(`\n[TEST 5] Testing Mother Tree Farm ID & Approximate Age...`);
    const palmListRes = await fetch(`${BASE_URL}/api/parent-palms?all=true`);
    const palms = await palmListRes.json();
    const testPalm = palms[0];

    const putPalmRes = await fetch(`${BASE_URL}/api/parent-palms`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: testPalm.code,
        age: '80+ years',
        notes: 'Updated approximate age'
      })
    });
    assert(putPalmRes.status === 200, `Mother tree updated with approximate age`);
    const updatedPalm = await putPalmRes.json();
    assert(updatedPalm.age === '80+ years', `Mother tree age is approximate range (${updatedPalm.age})`);

    // 6. Analytics Time-Range Filter
    console.log(`\n[TEST 6] Testing Website Analytics Time-Range Dropdown API...`);
    for (const range of ['daily', 'weekly', 'monthly', 'all']) {
      const aRes = await fetch(`${BASE_URL}/api/admin/analytics?range=${range}`, {
        headers: { Cookie: `admin_session=${adminToken}` }
      });
      assert(aRes.status === 200, `Analytics API responds with 200 for range=${range}`);
      const aJson = await aRes.json();
      assert(aJson.kpis && typeof aJson.kpis.totalViews === 'number', `Analytics includes valid kpis for range=${range} (totalViews: ${aJson.kpis?.totalViews})`);
      assert(Array.isArray(aJson.batchAnalytics), `Analytics includes batchAnalytics list`);
    }

    // 7. Verify "100% Synced with Farm DB" is removed from public page HTML
    console.log(`\n[TEST 7] Verifying public pages...`);
    const homeRes = await fetch(`${BASE_URL}/`);
    const homeHtml = await homeRes.text();
    assert(!homeHtml.includes('100% Synced with Farm DB'), `"100% Synced with Farm DB" is removed from home page`);

    // Clean up created test batch
    await fetch(`${BASE_URL}/api/batches?code=${encodeURIComponent(createdBatch.batchCode)}`, { method: 'DELETE' });

    console.log(`\n======================================================`);
    console.log(`  ALL ENHANCEMENTS TESTS FINISHED`);
    console.log(`  Passed: ${passed} | Failed: ${failed}`);
    console.log(`======================================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error(`Unexpected test error:`, err);
    process.exit(1);
  }
}

run();
