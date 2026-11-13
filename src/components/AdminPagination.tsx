'use client';

interface AdminPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export default function AdminPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className = ''
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startEntry = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endEntry = Math.min(totalItems, safePage * pageSize);

  // Generate page numbers to display (compact window around current page)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, safePage - 1);
      let end = Math.min(totalPages - 1, safePage + 1);

      if (safePage <= 3) {
        start = 2;
        end = 4;
      } else if (safePage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={`d-flex flex-wrap justify-content-between align-items-center gap-3 p-3 bg-light border-top rounded-bottom-4 ${className}`}>
      {/* Left side: Page Size Selector & Entry Count Summary */}
      <div className="d-flex flex-wrap align-items-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <label className="text-secondary small fw-semibold mb-0 text-nowrap">
            Show:
          </label>
          <select
            className="form-select form-select-sm fw-bold border-secondary border-opacity-50"
            style={{ width: '80px', cursor: 'pointer' }}
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              onPageSizeChange(newSize);
              onPageChange(1); // reset to first page when changing page size
            }}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="text-secondary small fw-semibold text-nowrap">per page</span>
        </div>

        <div className="text-muted extra-small">
          Showing <strong className="text-dark">{startEntry}</strong> to{' '}
          <strong className="text-dark">{endEntry}</strong> of{' '}
          <strong className="text-primary">{totalItems}</strong> entries
        </div>
      </div>

      {/* Right side: Page Navigation Controls */}
      {totalPages > 1 && (
        <nav aria-label="Table pagination">
          <ul className="pagination pagination-sm mb-0 gap-1">
            {/* First Page */}
            <li className={`page-item ${safePage === 1 ? 'disabled' : ''}`}>
              <button
                type="button"
                className="page-link rounded-2"
                onClick={() => onPageChange(1)}
                disabled={safePage === 1}
                title="First Page"
              >
                « First
              </button>
            </li>

            {/* Prev Page */}
            <li className={`page-item ${safePage === 1 ? 'disabled' : ''}`}>
              <button
                type="button"
                className="page-link rounded-2"
                onClick={() => onPageChange(safePage - 1)}
                disabled={safePage === 1}
                title="Previous Page"
              >
                ‹ Prev
              </button>
            </li>

            {/* Numbered Buttons */}
            {getPageNumbers().map((p, idx) =>
              typeof p === 'number' ? (
                <li key={idx} className={`page-item ${p === safePage ? 'active' : ''}`}>
                  <button
                    type="button"
                    className={`page-link rounded-2 ${p === safePage ? 'bg-success border-success text-white fw-bold' : ''}`}
                    onClick={() => onPageChange(p)}
                  >
                    {p}
                  </button>
                </li>
              ) : (
                <li key={idx} className="page-item disabled">
                  <span className="page-link rounded-2 border-0 bg-transparent text-muted">…</span>
                </li>
              )
            )}

            {/* Next Page */}
            <li className={`page-item ${safePage === totalPages ? 'disabled' : ''}`}>
              <button
                type="button"
                className="page-link rounded-2"
                onClick={() => onPageChange(safePage + 1)}
                disabled={safePage === totalPages}
                title="Next Page"
              >
                Next ›
              </button>
            </li>

            {/* Last Page */}
            <li className={`page-item ${safePage === totalPages ? 'disabled' : ''}`}>
              <button
                type="button"
                className="page-link rounded-2"
                onClick={() => onPageChange(totalPages)}
                disabled={safePage === totalPages}
                title="Last Page"
              >
                Last »
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
