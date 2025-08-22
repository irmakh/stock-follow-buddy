import { useState, useMemo } from 'react';

type SortDirection = 'ascending' | 'descending';

interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export const useSort = <T extends Record<string, any>>(
  items: T[],
  defaultConfig: SortConfig<T>
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(defaultConfig);

  const sortedItems = useMemo(() => {
    const sortableItems = [...items];
    sortableItems.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      
      // Handle cases where values might be null or undefined
      if (valA == null) return 1;
      if (valB == null) return -1;

      // Type-specific comparison
      if (typeof valA === 'string' && typeof valB === 'string') {
        // Check if strings are dates
        const isADate = !isNaN(Date.parse(valA));
        const isBDate = !isNaN(Date.parse(valB));
        if (isADate && isBDate) {
          const dateA = new Date(valA).getTime();
          const dateB = new Date(valB).getTime();
          if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        }
      }

      // Default comparison for numbers and other string types
      if (valA < valB) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (valA > valB) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: keyof T) => {
    if (sortConfig.key === key) {
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return '';
  }

  return { sortedItems, requestSort, sortConfig, getSortIndicator };
};
