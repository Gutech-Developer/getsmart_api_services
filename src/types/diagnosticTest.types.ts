export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Create Diagnostic Test (nested) ───

export interface CreateTestOptionInput {
  option: string;         // "A" | "B" | "C" | "D"
  textAnswer?: string;
  imageAnswerUrl?: string;
  isCorrect: boolean;
}

export interface CreateTestQuestionDiscussionInput {
  textDiscussion?: string;
  videoUrl?: string;
}

export interface CreateTestQuestionInput {
  questionNumber: number;
  textQuestion?: string;
  imageQuestionUrl?: string;
  pembahasan: string;
  videoUrl: string;
  options: CreateTestOptionInput[];
  discussion?: CreateTestQuestionDiscussionInput;
}

export interface CreateTestQuestionPackageInput {
  packageName?: string;
  questions: CreateTestQuestionInput[];
}

export interface CreateDiagnosticTestInput {
  testName: string;
  description?: string;
  packages: CreateTestQuestionPackageInput[];
}

export interface UpsertTestOptionInput {
  id?: string;           
  option: string;        
  textAnswer?: string;
  imageAnswerUrl?: string;
  isCorrect: boolean;
}

export interface UpsertTestQuestionDiscussionInput {
  textDiscussion?: string;
  videoUrl?: string;
}

export interface UpsertTestQuestionInput {
  id?: string;          
  questionNumber: number;
  textQuestion?: string;
  imageQuestionUrl?: string;
  pembahasan: string;
  videoUrl: string;
  options: UpsertTestOptionInput[];
  discussion?: UpsertTestQuestionDiscussionInput | null;
}

export interface UpsertTestQuestionPackageInput {
  id?: string;          
  packageName?: string;
  questions: UpsertTestQuestionInput[];
}

export interface UpdateDiagnosticTestInput {
  testName?: string;
  description?: string | null;
  packages?: UpsertTestQuestionPackageInput[];
}
