// Helper to parse months from arbitrary age string (e.g. "3", "3 months", "3-4 months", "8–10 months")
export function parseAgeInMonths(ageStr?: string): number | null {
  if (!ageStr) return null;
  const clean = String(ageStr).trim().toLowerCase();

  const rangeMatch = clean.match(/(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    return (low + high) / 2;
  }
  const singleMatch = clean.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    return parseFloat(singleMatch[1]);
  }
  return null;
}

// Helper to compute age & height dynamically from Seeded Date or explicit Age string
export function getSaplingMetrics(seededDateStr: string, explicitAgeStr?: string) {
  const explicitMonths = parseAgeInMonths(explicitAgeStr);
  let monthsCount: number;

  if (explicitMonths !== null) {
    monthsCount = Math.max(0, Math.round(explicitMonths));
  } else if (seededDateStr) {
    const seeded = new Date(seededDateStr);
    const now = new Date();

    monthsCount = (now.getFullYear() - seeded.getFullYear()) * 12 + (now.getMonth() - seeded.getMonth());
    if (now.getDate() < seeded.getDate()) {
      monthsCount = Math.max(0, monthsCount - 1);
    }
    monthsCount = Math.max(0, monthsCount);
  } else {
    monthsCount = 4;
  }

  const formattedAge = explicitAgeStr
    ? (explicitAgeStr.toLowerCase().includes('month') ? explicitAgeStr : `${explicitAgeStr} months`)
    : `${monthsCount}–${monthsCount + 1} months`;

  let estimatedHeight = 'Approx. 1–2 ft';
  if (monthsCount >= 4 && monthsCount <= 6) estimatedHeight = 'Approx. 2–3 ft';
  else if (monthsCount >= 7 && monthsCount <= 9) estimatedHeight = 'Approx. 3–4 ft';
  else if (monthsCount >= 10 && monthsCount <= 12) estimatedHeight = 'Approx. 4–5 ft';
  else if (monthsCount > 12) estimatedHeight = 'Approx. 5–6 ft';

  return {
    age: formattedAge,
    height: estimatedHeight,
    monthsCount: Math.max(1, monthsCount),
  };
}

// Dynamic Batch Status Calculation Rule Engine
// Saplings under 6 months old are still in early nursery growth and categorized as COMING_SOON (Upcoming)
export function getDynamicBatchStatus(
  availableQuantity: number,
  seededDateStr?: string,
  explicitAgeStr?: string
): 'AVAILABLE' | 'LIMITED' | 'SOLD_OUT' | 'COMING_SOON' {
  // 1. If explicit age is provided (e.g. "3", "3 months", "3–4 months"), respect it directly
  const explicitMonths = parseAgeInMonths(explicitAgeStr);
  if (explicitMonths !== null) {
    if (explicitMonths < 6) return 'COMING_SOON';
  } else if (seededDateStr) {
    // 2. Otherwise calculate from seededDate
    const metrics = getSaplingMetrics(seededDateStr);
    if (metrics.monthsCount < 6) return 'COMING_SOON';
  }

  if (availableQuantity <= 0) return 'SOLD_OUT';
  if (availableQuantity < 50) return 'LIMITED';
  return 'AVAILABLE';
}
