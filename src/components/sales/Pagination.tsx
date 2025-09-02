'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalCount?: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  loading?: boolean;
}

export default function Pagination({
  currentPage,
  pageSize,
  totalCount,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  onPageSizeChange,
  loading = false
}: PaginationProps) {
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = currentPage * pageSize;
  
  const showingText = totalCount 
    ? `Showing ${startIndex}–${Math.min(endIndex, totalCount)} of ${totalCount}`
    : `Showing ${startIndex}–${endIndex}`;

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      {/* Page size selector */}
      <div className="flex items-center space-x-2">
        <label htmlFor="page-size" className="text-sm text-gray-700">
          Show:
        </label>
        <select
          id="page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={loading}
          className="block w-auto px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-sm text-gray-700">per page</span>
      </div>

      {/* Showing text */}
      <div className="hidden sm:block">
        <p className="text-sm text-gray-700">
          {showingText}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage || loading}
          className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">Previous</span>
        </button>

        <span className="text-sm text-gray-700 px-2">
          Page {currentPage}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || loading}
          className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Go to next page"
        >
          <span className="mr-1 hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}