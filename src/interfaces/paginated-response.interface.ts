export interface PaginatedResponse<T> {
  count: number; // total items (without pagination)
  rows: T[]; // actual paginated data
}
