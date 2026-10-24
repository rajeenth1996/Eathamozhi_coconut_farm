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
  if (monthsCount >= 4 && monthsCount <= 6) estimatedHeight = '1.5–2.5 ft';
  else if (monthsCount >= 7 && monthsCount <= 9) estimatedHeight = '2.5–4.5 ft';
  else if (monthsCount >= 10 && monthsCount <= 12) estimatedHeight = '4.5–6.0 ft';
  else if (monthsCount > 12) estimatedHeight = '6.0+ ft (Ready for Field Planting)';

  return {
    age: `${monthsCount} Month${monthsCount > 1 ? 's' : ''}`,
    height: estimatedHeight,
    monthsCount,
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
