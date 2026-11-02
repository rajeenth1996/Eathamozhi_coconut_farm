import { CounterModel, FarmModel, BatchModel, MotherTreeModel } from '@/lib/models';
import { connectToDatabase } from '@/lib/mongodb';

/**
 * Extracts the 3-letter uppercase location code from a location string.
 * Ignores spaces, punctuation, numbers.
 * Example: "Eathamozhi" -> "ETH"
 */
export function generateLocationCode(location: string): string {
  if (!location) return 'ETH';
  const clean = location.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (clean.startsWith('EATH') || clean.startsWith('ETH')) {
    return 'ETH';
  }
  return clean.slice(0, 3).padEnd(3, 'X');
}

/**
 * Extracts the first two distinct uppercase alphabetic letters from owner name,
 * preserving their original order.
 * Example: "Rajeenth" -> "RA"
 * Example: "Aaron" -> "AR"
 */
export function generateOwnerCode(ownerName: string): string {
  if (!ownerName) return 'OW';
  const clean = ownerName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const distinct: string[] = [];
  for (const char of clean) {
    if (!distinct.includes(char)) {
      distinct.push(char);
      if (distinct.length === 2) break;
    }
  }
  if (distinct.length === 1) {
    return distinct[0] + 'X';
  }
  if (distinct.length === 0) {
    return 'OW';
  }
  return distinct.join('');
}

/**
 * Safely generates an atomic sequential number for a given key.
 * Uses MongoDB findOneAndUpdate with upsert when connected,
 * with in-memory / local fallback.
 */
const inMemoryCounters: Record<string, number> = {};

export async function getNextAtomicSequence(key: string, existingListMax?: number): Promise<number> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const counter = await CounterModel.findOneAndUpdate(
        { key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      if (existingListMax && counter.seq <= existingListMax) {
        // Adjust if sequence was lower than existing records
        const adjusted = await CounterModel.findOneAndUpdate(
          { key },
          { $set: { seq: existingListMax + 1 } },
          { new: true }
        );
        return adjusted.seq;
      }
      return counter.seq;
    }
  } catch (err) {
    console.warn('Atomic sequence counter warning, using memory fallback:', err);
  }

  const current = Math.max(inMemoryCounters[key] || 0, existingListMax || 0);
  const next = current + 1;
  inMemoryCounters[key] = next;
  return next;
}

/**
 * Generates a unique Farm ID in format: LOCATIONCODE-OWNERCODE-FARMNUMBER (e.g. ETH-RA-F001).
 * Resolves conflicts by checking existing farms and finding next available sequence number.
 */
export async function generateFarmId(location: string, ownerName: string, existingFarmCodes: string[] = []): Promise<{ farmId: string; locationCode: string; ownerCode: string }> {
  const locationCode = generateLocationCode(location);
  const ownerCode = generateOwnerCode(ownerName);
  const prefix = `${locationCode}-${ownerCode}`;
  const counterKey = `farm-${prefix}`;

  // Find max sequence in existing farms with this prefix
  let maxSeq = 0;
  for (const code of existingFarmCodes) {
    if (code.startsWith(prefix + '-F')) {
      const part = code.split('-F')[1];
      const num = parseInt(part, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  let nextSeq = await getNextAtomicSequence(counterKey, maxSeq);
  let farmId = `${prefix}-F${String(nextSeq).padStart(3, '0')}`;

  // In case of conflict, increment sequentially until unique
  while (existingFarmCodes.includes(farmId)) {
    nextSeq = await getNextAtomicSequence(counterKey, nextSeq);
    farmId = `${prefix}-F${String(nextSeq).padStart(3, '0')}`;
  }

  return { farmId, locationCode, ownerCode };
}

/**
 * Generates a unique Mother Tree ID: FARMID-MT001 (e.g. ETH-RA-F001-MT001)
 */
export async function generateMotherTreeId(farmCode: string, existingTreeCodes: string[] = []): Promise<string> {
  const counterKey = `mt-${farmCode}`;
  let maxSeq = 0;
  for (const code of existingTreeCodes) {
    if (code.startsWith(farmCode + '-MT')) {
      const part = code.split('-MT')[1];
      const num = parseInt(part, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  let nextSeq = await getNextAtomicSequence(counterKey, maxSeq);
  let treeId = `${farmCode}-MT${String(nextSeq).padStart(3, '0')}`;

  while (existingTreeCodes.includes(treeId)) {
    nextSeq = await getNextAtomicSequence(counterKey, nextSeq);
    treeId = `${farmCode}-MT${String(nextSeq).padStart(3, '0')}`;
  }

  return treeId;
}

/**
 * Generates a unique Batch ID using the new naming convention:
 * <Farm ID>-<Month>'<YY>-B<Batch Number>
 * Examples:
 * - SUN-SE-F001-November'26-B1
 * - SUN-SE-F001-November'26-B2
 * - SUN-SE-F001-December'26-B1
 * - SUN-SE-F002-January'27-B1
 *
 * Sequential batch number without leading zeros, sequential within farm and month.
 */
export async function generateBatchId(
  primaryFarmCode: string,
  dateOrMonthYear?: { month: number; year: number } | string,
  existingBatchCodes: string[] = []
): Promise<{ batchId: string; monthStr: string; yearStr: string; monthNum: number; yearNum: number; fullMonthYear: string }> {
  let monthNum: number;
  let yearNum: number;

  if (typeof dateOrMonthYear === 'object' && dateOrMonthYear !== null) {
    monthNum = dateOrMonthYear.month;
    yearNum = dateOrMonthYear.year;
  } else if (typeof dateOrMonthYear === 'string' && dateOrMonthYear.includes('-')) {
    const parts = dateOrMonthYear.split('-');
    yearNum = parseInt(parts[0], 10);
    monthNum = parseInt(parts[1], 10);
  } else {
    const now = new Date();
    monthNum = now.getMonth() + 1;
    yearNum = now.getFullYear();
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const fullMonth = monthNames[(monthNum || 1) - 1] || 'November';
  const twoDigitYear = String(yearNum || 2026).slice(-2);
  const monthStr = String(monthNum).padStart(2, '0');
  const yearStr = String(yearNum);
  const fullMonthYear = `${fullMonth} ${yearNum}`;

  // Prefix format: <Farm ID>-<Month>'<YY> (e.g. ETH-RA-F001-November'26)
  const prefix = `${primaryFarmCode}-${fullMonth}'${twoDigitYear}`;
  const counterKey = `batch-${prefix}`;

  let maxSeq = 0;
  for (const code of existingBatchCodes) {
    if (code.startsWith(prefix + '-B')) {
      const part = code.slice((prefix + '-B').length);
      const num = parseInt(part, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  let nextSeq = await getNextAtomicSequence(counterKey, maxSeq);
  // Sequential batch number without leading zeros: B1, B2...
  let batchId = `${prefix}-B${nextSeq}`;

  while (existingBatchCodes.includes(batchId)) {
    nextSeq = await getNextAtomicSequence(counterKey, nextSeq);
    batchId = `${prefix}-B${nextSeq}`;
  }

  return { batchId, monthStr, yearStr, monthNum, yearNum, fullMonthYear };
}

/**
 * Returns formatted batch customer display name:
 * "farm id batch id month and year in full as december 2026"
 * Example: "ETH-RA-F001 · ETH-RA-F001-112026-B001 · November 2026 Batch"
 */
export function formatBatchDisplayName(
  primaryFarmCode: string,
  batchCode: string,
  monthOrDate: number | string = 11,
  yearNum?: number
): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  let month = 11;
  let year = yearNum || 2026;

  if (typeof monthOrDate === 'string' && monthOrDate.includes('-')) {
    const parts = monthOrDate.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  } else if (typeof monthOrDate === 'number') {
    month = monthOrDate;
  }

  const fullMonth = monthNames[(month || 1) - 1] || 'December';
  return `${primaryFarmCode} ${batchCode} ${fullMonth} ${year}`;
}
