'use client';

import { useEffect, useState } from 'react';

interface BatchViewTrackerProps {
  batchCode: string;
  initialCount?: number;
}

export default function BatchViewTracker({ batchCode, initialCount = 0 }: BatchViewTrackerProps) {
  const [count, setCount] = useState<number>(initialCount);

  useEffect(() => {
    try {
      let vid = localStorage.getItem('coconut_farmer_vid');
      if (!vid) {
        vid = 'v_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
        localStorage.setItem('coconut_farmer_vid', vid);
      }

      fetch(`/api/batches/${encodeURIComponent(batchCode)}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: vid })
      })
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.viewsCount === 'number') {
            setCount(data.viewsCount);
          }
        })
        .catch(() => {});
    } catch (e) {
      // ignore storage errors
    }
  }, [batchCode]);

  return (
    <span className="badge bg-danger bg-opacity-75 px-3 py-2 me-2">
      <i className="bi bi-eye-fill me-1"></i> 🔥 {count} farmers viewed
    </span>
  );
}
