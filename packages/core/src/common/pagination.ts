export type ContentPagination = { page: number; size: number };
export type ContentFilter = { [field: string]: string | number | boolean };
export type ContentSort = { field: string; sort: 'asc' | 'desc' }[];

export type PaginationMetadata = {
  /**
   * The current page index (starting from 0).
   */
  pageNumber: number;

  /**
   * The number of items requested per page.
   */
  pageSize: number;

  /**
   * The total number of items matching the search criteria across all pages.
   */
  totalElements: number;

  /**
   * The total number of pages available.
   */
  totalPages: number;

  /**
   * True, if this is the last page.
   */
  isLast: boolean;
};

export type PagedResponse<T> = {
  content: T[];
  pagination: PaginationMetadata;
};

export function emptyPagedResponse<T>(page: number, size: number): PagedResponse<T> {
  return {
    content: [],
    pagination: {
      pageNumber: page,
      pageSize: size,
      totalElements: 0,
      totalPages: 0,
      isLast: true,
    },
  };
}
