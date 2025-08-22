import React from 'react';
import Button from './Button';

interface PaginationControlsProps {
  canPrevPage: boolean;
  canNextPage: boolean;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  setItemsPerPage: (value: number) => void;
  prevPage: () => void;
  nextPage: () => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  canPrevPage,
  canNextPage,
  totalPages,
  currentPage,
  itemsPerPage,
  setItemsPerPage,
  prevPage,
  nextPage,
}) => {
  return (
    <div className="flex items-center justify-between mt-4 flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="items-per-page" className="text-sm text-gray-600 dark:text-gray-400">
          Rows per page:
        </label>
        <select
          id="items-per-page"
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          aria-label="Select number of rows per page"
        >
          {[10, 25, 50, 100].map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
          Page {currentPage} of {totalPages > 0 ? totalPages : 1}
        </span>
        <div className="flex items-center gap-2">
            <Button onClick={prevPage} disabled={!canPrevPage} variant="secondary" className="px-3 py-1 text-sm">
                Previous
            </Button>
            <Button onClick={nextPage} disabled={!canNextPage} variant="secondary" className="px-3 py-1 text-sm">
                Next
            </Button>
        </div>
      </div>
    </div>
  );
};

export default PaginationControls;