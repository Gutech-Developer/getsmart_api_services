import { z } from "zod";
import { paginationQuery } from "./pagination";

const uuidParam = (name: string) =>
  z.string().uuid(`${name} harus berupa UUID yang valid`);

const eLKPDBodyShape = z.object({
  title: z
    .string()
    .min(1, "Judul E-LKPD minimal 1 karakter")
    .max(255, "Judul E-LKPD maksimal 255 karakter"),
  description: z.string().max(2000, "Deskripsi maksimal 2000 karakter").optional(),
  fileUrl: z.string().pipe(z.url("fileUrl harus URL yang valid")),
});

export const createSubjectSchema = z.object({
  body: z.object({
    subjectName: z
      .string()
      .min(1, "Nama materi minimal 1 karakter")
      .max(255, "Nama materi maksimal 255 karakter"),
    description: z.string().max(2000, "Deskripsi maksimal 2000 karakter").optional(),
    subjectFileUrl: z.string().pipe(z.url("subjectFileUrl harus URL yang valid")),
    videoUrl: z.string().pipe(z.url("videoUrl harus URL yang valid")).optional(),
    eLKPD: eLKPDBodyShape.optional(),
  }),
});

export const updateSubjectSchema = z.object({
  params: z.object({ id: uuidParam("Subject ID") }),
  body: z
    .object({
      subjectName: z
        .string()
        .min(1, "Nama materi minimal 1 karakter")
        .max(255, "Nama materi maksimal 255 karakter")
        .optional(),
      description: z.string().max(2000, "Deskripsi maksimal 2000 karakter").optional(),
      subjectFileUrl: z.string().pipe(z.url("subjectFileUrl harus URL yang valid")).optional(),
      videoUrl: z
        .string()
        .pipe(z.url("videoUrl harus URL yang valid"))
        .nullable()
        .optional(),
    })
    .refine((d) => Object.values(d).some((v) => v !== undefined), {
      message: "Minimal satu field harus diisi untuk update",
    }),
});

export const subjectIdSchema = z.object({
  params: z.object({ id: uuidParam("Subject ID") }),
});

export const subjectByTeacherSchema = z.object({
  params: z.object({ teacherId: uuidParam("Teacher ID") }),
  query: paginationQuery,
});

export const mySubjectAsTeacherSchema = z.object({
  query: paginationQuery,
});

export const addELKPDSchema = z.object({
  params: z.object({ subjectId: uuidParam("Subject ID") }),
  body: eLKPDBodyShape,
});

export const updateELKPDSchema = z.object({
  params: z.object({
    subjectId: uuidParam("Subject ID"),
    elkpdId: uuidParam("E-LKPD ID"),
  }),
  body: z
    .object({
      title: z
        .string()
        .min(1, "Judul E-LKPD minimal 1 karakter")
        .max(255, "Judul E-LKPD maksimal 255 karakter")
        .optional(),
      description: z.string().max(2000, "Deskripsi maksimal 2000 karakter").optional(),
      fileUrl: z.string().pipe(z.url("fileUrl harus URL yang valid")).optional(),
    })
    .refine((d) => Object.values(d).some((v) => v !== undefined), {
      message: "Minimal satu field harus diisi untuk update",
    }),
});

export const elkpdParamsSchema = z.object({
  params: z.object({
    subjectId: uuidParam("Subject ID"),
    elkpdId: uuidParam("E-LKPD ID"),
  }),
});

export const moduleSubmissionsSchema = z.object({
  params: z.object({ courseModuleId: uuidParam("Course Module ID") }),
  query: paginationQuery,
});

export const gradeELKPDSubmissionSchema = z.object({
  params: z.object({
    courseModuleId: uuidParam("Course Module ID"),
    submissionId: uuidParam("Submission ID"),
  }),
  body: z.object({
    score: z
      .number({ error: "Nilai wajib diisi dan harus berupa angka" })
      .min(0, "Nilai minimal 0")
      .max(100, "Nilai maksimal 100"),
    teacherNote: z.string().max(2000, "Catatan guru maksimal 2000 karakter").optional(),
  }),
});

export const courseModuleIdSchema = z.object({
  params: z.object({ courseModuleId: uuidParam("Course Module ID") }),
});

export const submitELKPDSchema = z.object({
  params: z.object({ courseModuleId: uuidParam("Course Module ID") }),
  body: z.object({
    eLKPDId: z.string().uuid("E-LKPD ID harus berupa UUID yang valid"),
    submissionFileUrl: z
      .string()
      .pipe(z.url("submissionFileUrl harus URL yang valid")),
  }),
});

export const createELKPDSchema = z.object({ body: eLKPDBodyShape });
export const diagnosticTestIdSchema = z.object({ params: z.object({ id: uuidParam("ID") }) });
export const diagnosticTestByTeacherSchema = z.object({
  params: z.object({ teacherId: uuidParam("Teacher ID") }),
  query: paginationQuery,
});