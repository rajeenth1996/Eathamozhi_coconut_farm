const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../src/data/db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

db.batches = db.batches.map(b => {
  let month = 11;
  let year = 2026;

  if (b.seededDate && b.seededDate.includes('-')) {
    const parts = b.seededDate.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  } else if (b.batchMonth) {
    month = b.batchMonth;
    year = b.batchYear || 2026;
  }

  // Check legacy prefix e.g. EM-1026-A
  const emMatch = b.batchCode.match(/EM-(\d{2})(\d{2})-/i);
  if (emMatch) {
    month = parseInt(emMatch[1], 10);
    year = 2000 + parseInt(emMatch[2], 10);
  }

  const fullMonth = monthNames[(month || 1) - 1] || 'November';
  const newName = `${fullMonth} ${year} (${b.batchCode})`;
  console.log(`${b.batchCode}: "${b.name}" -> "${newName}"`);
  return {
    ...b,
    name: newName
  };
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Successfully updated batch names in db.json!');
