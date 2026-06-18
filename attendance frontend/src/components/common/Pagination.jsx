import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  limit = 10,
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
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
        <span className="text-xs sm:text-sm text-slate-400 font-medium">
          Showing <span className="text-white font-semibold">{startItem}</span> to{' '}
          <span className="text-white font-semibold">{endItem}</span> of{' '}
          <span className="text-white font-semibold">{totalItems}</span> entries
        </span>
      ) : (
        <div />
      )}

      {/* Buttons */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 bg-slate-900/60 hover:bg-slate-800/80 disabled:opacity-40 disabled:hover:bg-slate-900/60 text-slate-300 rounded-lg border border-slate-800/80 transition-all cursor-pointer disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
        </button>

        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`dots-${idx}`} className="px-2 py-1 text-slate-500 text-sm">
                ...
              </span>
            );
          }

          const isActive = p === currentPage;

          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
                isActive
                  ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-900/20'
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 bg-slate-900/60 hover:bg-slate-800/80 disabled:opacity-40 disabled:hover:bg-slate-900/60 text-slate-300 rounded-lg border border-slate-800/80 transition-all cursor-pointer disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
}
