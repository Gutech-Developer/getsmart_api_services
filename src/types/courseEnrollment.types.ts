export interface EnrollCourseInput {
  courseId: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedEnrollmentsResult {
  enrollments: any[];
  pagination: PaginationMeta;
}
