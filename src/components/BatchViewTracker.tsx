'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface BatchViewTrackerProps {
  batchCode: string;
  initialCount?: number;
}

export default function BatchViewTracker({ batchCode, initialCount = 0 }: BatchViewTrackerProps) {
  const [count, setCount] = useState<number>(initialCount);
  const lastRecordedRef = useRef<number>(0);
  const wasHiddenRef = useRef<boolean>(false);
  const prevBatchCodeRef = useRef<string | null>(null);

  const recordView = useCallback(async () => {
    if (!batchCode) return;
    const now = Date.now();
    // Debounce duplicate immediate renders within 3 seconds
    if (now - lastRecordedRef.current < 3000) return;
    lastRecordedRef.current = now;

    try {
      let vid = '';
      if (typeof window !== 'undefined') {
        vid = sessionStorage.getItem('coconut_farmer_sess_vid') || '';
        if (!vid) {
          vid = 'v_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
          sessionStorage.setItem('coconut_farmer_sess_vid', vid);
        }
      }

      const res = await fetch(`/api/batches/${encodeURIComponent(batchCode)}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: vid || 'detail-viewer' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.viewsCount === 'number') {
          setCount(data.viewsCount);
        }
      }
    } catch (e) {
      // ignore network errors
    }
  }, [batchCode]);

  // Record view once on mount or when batchCode genuinely changes
  useEffect(() => {
    if (batchCode && prevBatchCodeRef.current !== batchCode) {
      prevBatchCodeRef.current = batchCode;
      recordView();
    }
  }, [batchCode, recordView]);

  // Re-record view only when farmer moved out (tab was hidden) and comes back in (tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        wasHiddenRef.current = true;
      } else if (document.visibilityState === 'visible' && wasHiddenRef.current) {
        wasHiddenRef.current = false;
        lastRecordedRef.current = 0;
        recordView();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [recordView]);

  return (
    <span className="badge bg-danger bg-opacity-75 px-3 py-2 me-2">
      <i className="bi bi-eye-fill me-1"></i> 🔥 {count} farmers viewed
    </span>
  );
}
