export interface PaginatedResponse<T> {
  data: T[];                     // Array of items
  total: number;                 // Total count for pagination
  page: number;                  // Current page (1-indexed)
  pageSize: number;              // Items per page
  totalPages: number;            // Total number of pages
}

export interface PaginationParams {
  page: number;                  // Page number (1-indexed)
  pageSize: number;              // Items per page
  sortBy?: string;               // Field to sort by
  sortOrder?: 'asc' | 'desc';    // Sort direction
}