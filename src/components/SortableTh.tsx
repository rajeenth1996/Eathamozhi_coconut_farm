'use client';

import React from 'react';
import { SortDirection } from '@/lib/sortUtils';

interface SortableThProps {
  label?: string;
  field: string;
  currentSort: string | null;
  currentDirection: SortDirection;
  onSort: (field: string) => void;
  className?: string;
  style?: React.CSSProperties;
  align?: 'left' | 'center' | 'right' | 'end';
  children?: React.ReactNode;
}

export default function SortableTh({
  label,
  field,
  currentSort,
  currentDirection,
  onSort,
  className = '',
  style = {},
  align = 'left',
  children
}: SortableThProps) {
  const isSorted = currentSort === field;
  const isRight = align === 'right' || align === 'end';
  const displayLabel = typeof children === 'string' ? children : label || field;

  return (
    <th
      className={`user-select-none ${className} ${align === 'center' ? 'text-center' : isRight ? 'text-end' : ''}`}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        transition: 'background-color 0.15s ease',
        ...style
      }}
      onClick={() => onSort(field)}
      title={`Click to sort by ${displayLabel} (${
        isSorted
          ? currentDirection === 'asc'
            ? 'Ascending → click for Descending'
            : 'Descending → click for Ascending'
          : 'Click to sort'
      })`}
    >
      <div
        className={`d-inline-flex align-items-center gap-1 ${
          align === 'center' ? 'justify-content-center' : isRight ? 'justify-content-end' : ''
        }`}
      >
        <span>{children || label}</span>
        {isSorted ? (
          currentDirection === 'asc' ? (
            <i className="bi bi-arrow-up text-primary fw-bold ms-1" style={{ fontSize: '0.85em' }}></i>
          ) : (
            <i className="bi bi-arrow-down text-primary fw-bold ms-1" style={{ fontSize: '0.85em' }}></i>
          )
        ) : (
          <i className="bi bi-arrow-down-up text-muted opacity-50 ms-1" style={{ fontSize: '0.75em' }}></i>
        )}
      </div>
    </th>
  );
}
