export interface CreateCourseInput {
  courseName: string;
}

export interface UpdateCourseInput {
  courseName?: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedCoursesResult {
  courses: any[];
  pagination: PaginationMeta;
}
