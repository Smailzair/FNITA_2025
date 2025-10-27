import { useState, useMemo, type CSSProperties, type ReactNode } from "react";

// Define generic types for the component's props
type SortDirection = "asc" | "desc";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  sortable?: boolean;
  sortKey?: keyof T;
  render?: (item: T) => ReactNode;
  headerStyle?: CSSProperties;
  cellStyle?: CSSProperties;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  error?: string | null;
  emptyStateMessage?: string;
  initialSortColumn?: keyof T;
  initialSortDirection?: SortDirection;
  // New props for row selection
  selectedItemId?: string | number | null;
  onRowSelect?: (id: string | number) => void;
}

export function Table<T extends { id: string | number }>({
  columns,
  data,
  isLoading = false,
  error = null,
  emptyStateMessage = "No data found.",
  initialSortColumn,
  initialSortDirection = "desc",
  selectedItemId,
  onRowSelect,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState(initialSortColumn);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(initialSortDirection);

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      const order = sortDirection === "asc" ? 1 : -1;

      if (aValue instanceof Date && bValue instanceof Date) {
        return (aValue.getTime() - bValue.getTime()) * order;
      }

      if (aValue < bValue) return -1 * order;
      if (aValue > bValue) return 1 * order;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    const newSortKey =
      column.sortKey ||
      (typeof column.accessor === "string"
        ? (column.accessor as keyof T)
        : undefined);
    if (!newSortKey) return;

    if (sortColumn === newSortKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(newSortKey);
      setSortDirection("asc");
    }
  };

  const getCellValue = (item: T, column: Column<T>): ReactNode => {
    if (column.render) {
      return column.render(item);
    }
    if (typeof column.accessor === "function") {
      return column.accessor(item);
    }
    return item[column.accessor] as ReactNode;
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider"
                  style={col.headerStyle}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col)}
                      className="flex items-center gap-2"
                    >
                      {col.header}
                      {sortColumn === (col.sortKey || col.accessor) && (
                        <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-8 text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-8 text-red-500"
                >
                  {error}
                </td>
              </tr>
            )}
            {!isLoading && !error && sortedData.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-8 text-gray-500"
                >
                  {emptyStateMessage}
                </td>
              </tr>
            )}
            {!isLoading &&
              !error &&
              sortedData.map((item) => (
                <tr
                  key={item.id}
                  data-id={item.id} // Add data-id for easy access if needed
                  className={`hover:bg-gray-100 ${selectedItemId === item.id ? 'bg-blue-100' : ''} ${onRowSelect ? 'cursor-pointer' : ''}`}
                  onClick={onRowSelect ? () => onRowSelect(item.id) : undefined}
                >
                  {columns.map((col, index) => (
                    <td
                      key={index}
                      className="px-6 py-4 whitespace-nowrap"
                      style={col.cellStyle}
                    >
                      {getCellValue(item, col)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
