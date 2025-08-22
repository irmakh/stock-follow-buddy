import { useState, useMemo, useEffect } from 'react';

export const usePagination = <T,>(data: T[], itemsPerPageDefault = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageDefault);

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / itemsPerPage);
  }, [data.length, itemsPerPage]);

  useEffect(() => {
      // Reset to page 1 if current page becomes invalid after data/itemsPerPage change
      if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(1);
      }
  }, [totalPages, currentPage]);

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  }, [data, currentPage, itemsPerPage]);
  
  const canPrevPage = currentPage > 1;
  const canNextPage = currentPage < totalPages;

  const nextPage = () => {
    // Ensure we don't go past the last page
    setCurrentPage((current) => Math.min(current + 1, totalPages > 0 ? totalPages : 1));
  };

  const prevPage = () => {
    setCurrentPage((current) => Math.max(current - 1, 1));
  };
  
  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }

  const handleSetItemsPerPage = (num: number) => {
    setItemsPerPage(num);
    setCurrentPage(1); // Reset to first page when changing items per page
  }

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage: handleSetItemsPerPage,
    currentData,
    nextPage,
    prevPage,
    goToPage,
    canNextPage,
    canPrevPage,
  };
};
