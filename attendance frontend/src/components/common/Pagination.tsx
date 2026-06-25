import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  limit?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  limit = 10,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // number of pages to show around current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const pages = getPageNumbers();
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems || 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      {/* Description */}
      {totalItems !== undefined ? (
        <span className="text-xs sm:text-sm text-theme-muted font-medium">
          Showing <span className="text-theme-bright font-semibold">{startItem}</span> to{' '}
          <span className="text-theme-bright font-semibold">{endItem}</span> of{' '}
          <span className="text-theme-bright font-semibold">{totalItems}</span> entries
        </span>
      ) : (
        <div />
      )}

      {/* Buttons */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 bg-theme-card hover:bg-theme-card-hover disabled:opacity-40 disabled:hover:bg-theme-card text-theme-text rounded-lg border border-theme-border transition-all cursor-pointer disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
        </button>

        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`dots-${idx}`} className="px-2 py-1 text-theme-muted text-sm">
                ...
              </span>
            );
          }

          const isActive = p === currentPage;

          return (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
                isActive
                  ? 'bg-violet-600 border-violet-500 text-white shadow-md'
                  : 'bg-theme-card border border-theme-border hover:bg-theme-card-hover text-theme-text'
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 bg-theme-card hover:bg-theme-card-hover disabled:opacity-40 disabled:hover:bg-theme-card text-theme-text rounded-lg border border-theme-border transition-all cursor-pointer disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
}
