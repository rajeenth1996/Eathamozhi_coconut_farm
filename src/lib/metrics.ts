// Helper to compute age & height dynamically from Seeded Date
export function getSaplingMetrics(seededDateStr: string) {
  if (!seededDateStr) return { age: '4–5 months', height: 'Approx. 2–3 ft', monthsCount: 4 };

  const seeded = new Date(seededDateStr);
  const now = new Date();

  let monthsCount = (now.getFullYear() - seeded.getFullYear()) * 12 + (now.getMonth() - seeded.getMonth());
  if (now.getDate() < seeded.getDate()) {
    monthsCount = Math.max(0, monthsCount - 1);
  }
  monthsCount = Math.max(0, monthsCount);

  const lower = monthsCount;
  const upper = monthsCount + 1;
  const age = `${lower}–${upper} months`;

  let estimatedHeight = 'Approx. 1–2 ft';
  if (monthsCount >= 4 && monthsCount <= 6) estimatedHeight = 'Approx. 2–3 ft';
  else if (monthsCount >= 7 && monthsCount <= 9) estimatedHeight = 'Approx. 3–4 ft';
  else if (monthsCount >= 10 && monthsCount <= 12) estimatedHeight = 'Approx. 4–5 ft';
  else if (monthsCount > 12) estimatedHeight = 'Approx. 5–6 ft';

  return {
    age,
    height: estimatedHeight,
    monthsCount: Math.max(1, monthsCount),
  };
}

// Dynamic Batch Status Calculation Rule Engine
export function getDynamicBatchStatus(
  availableQuantity: number,
  seededDateStr: string
): 'AVAILABLE' | 'LIMITED' | 'SOLD_OUT' | 'COMING_SOON' {
  const metrics = getSaplingMetrics(seededDateStr);
  if (metrics.monthsCount < 6) return 'COMING_SOON';
  if (availableQuantity <= 0) return 'SOLD_OUT';
  if (availableQuantity < 50) return 'LIMITED';
  return 'AVAILABLE';
}
