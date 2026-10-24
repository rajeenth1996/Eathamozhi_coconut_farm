// scripts/test-upload-cloudinary.js
const fs = require('fs');

async function testCloudinaryUploadAPI() {
  const tinyPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  // Test 1: JSON base64 upload
  console.log('Testing /api/upload with JSON payload...');
  const res1 = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'test',
      image: tinyPngBase64,
    }),
  });

  const data1 = await res1.json();
  console.log('JSON Upload Response status:', res1.status);
  console.log('JSON Upload Response body:', data1);

  if (!data1.url || !data1.url.includes('cloudinary.com')) {
    throw new Error('Expected Cloudinary URL in response 1');
  }

  // Test 2: Multipart/form-data upload
  console.log('\nTesting /api/upload with multipart FormData...');
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const blob = new Blob([buffer], { type: 'image/png' });

  const form = new FormData();
  form.append('file', blob, 'sample-pixel.png');
  form.append('category', 'test-form');

  const res2 = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: form,
  });

  const data2 = await res2.json();
  console.log('FormData Upload Response status:', res2.status);
  console.log('FormData Upload Response body:', data2);

  if (!data2.url || !data2.url.includes('cloudinary.com')) {
    throw new Error('Expected Cloudinary URL in response 2');
  }

  // Test 3: DELETE endpoint
  console.log('\nTesting /api/upload DELETE method...');
  const res3 = await fetch(`http://localhost:3000/api/upload?path=${encodeURIComponent(data2.url)}`, {
    method: 'DELETE',
  });
  const data3 = await res3.json();
  console.log('DELETE status:', res3.status, data3);

  console.log('\nALL CLOUDINARY UPLOAD TESTS PASSED SUCCESSFULLY! 🎉');
}

testCloudinaryUploadAPI().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
