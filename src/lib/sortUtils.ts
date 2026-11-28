export type SortDirection = 'asc' | 'desc';

/**
 * Universal data sorting helper for numbers, dates, strings, and custom nested getters.
 */
export function sortData<T>(
  data: T[],
  field: string | null,
  direction: SortDirection,
  customGetters?: Record<string, (item: T) => any>
): T[] {
  if (!field || !Array.isArray(data) || data.length === 0) return data;

  return [...data].sort((a: any, b: any) => {
    let valA = customGetters && customGetters[field] ? customGetters[field](a) : a[field];
    let valB = customGetters && customGetters[field] ? customGetters[field](b) : b[field];

    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';

    // Handle Booleans
    if (typeof valA === 'boolean' && typeof valB === 'boolean') {
      return direction === 'asc' ? (valA === valB ? 0 : valA ? 1 : -1) : (valA === valB ? 0 : valA ? -1 : 1);
    }

    // Handle direct numbers
    if (typeof valA === 'number' && typeof valB === 'number') {
      return direction === 'asc' ? valA - valB : valB - valA;
    }

    // Try parsing dates if values look like date strings (e.g. 2026-11-15, 2026-11-15T12:00:00Z)
    if (typeof valA === 'string' && typeof valB === 'string') {
      const isDateCandidateA = (valA.includes('-') || valA.includes('/') || valA.includes('T')) && valA.length >= 8;
      const isDateCandidateB = (valB.includes('-') || valB.includes('/') || valB.includes('T')) && valB.length >= 8;
      if (isDateCandidateA && isDateCandidateB) {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        if (!isNaN(timeA) && !isNaN(timeB)) {
          return direction === 'asc' ? timeA - timeB : timeB - timeA;
        }
      }

      // Check numeric strings like "150", "2500"
      const numA = Number(valA.trim());
      const numB = Number(valB.trim());
      if (!isNaN(numA) && !isNaN(numB) && valA.trim() !== '' && valB.trim() !== '' && !valA.includes(':')) {
        return direction === 'asc' ? numA - numB : numB - numA;
      }
    }

    // String comparison
    const strA = String(valA).trim().toLowerCase();
    const strB = String(valB).trim().toLowerCase();
    const res = strA.localeCompare(strB);
    return direction === 'asc' ? res : -res;
  });
}
