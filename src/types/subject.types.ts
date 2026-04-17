export interface CreateELKPDInput {
  title: string;
  description?: string;
  fileUrl: string;
}

export interface CreateSubjectInput {
  subjectName: string;
  description?: string;
  subjectFileUrl: string;
  videoUrl?: string;
  eLKPD?: CreateELKPDInput;
}

export interface UpdateSubjectInput {
  subjectName?: string;
  description?: string;
  subjectFileUrl?: string;
  videoUrl?: string;
}

export interface UpdateELKPDInput {
  title?: string;
  description?: string;
  fileUrl?: string;
}

export interface SubmitELKPDInput {
  eLKPDId: string;
  submissionFileUrl: string;
}

export interface GradeELKPDSubmissionInput {
  score: number;
  teacherNote?: string;
}