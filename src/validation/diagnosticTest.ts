import { z } from "zod";

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, "Page harus berupa angka").optional().default("1"),
    limit: z.string().regex(/^\d+$/, "Limit harus berupa angka").optional().default("10"),
    search: z.string().optional(),
  }),
});

export const diagnosticTestIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID harus berupa UUID yang valid"),
  }),
});

export const diagnosticTestByTeacherSchema = z.object({
  params: z.object({
    teacherId: z.string().uuid("Teacher ID harus berupa UUID yang valid"),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/, "Page harus berupa angka").optional().default("1"),
    limit: z.string().regex(/^\d+$/, "Limit harus berupa angka").optional().default("10"),
  }),
});

const VALID_OPTIONS = ["A", "B", "C", "D", "E"] as const;

const testOptionSchema = z.object({
  option: z.string().refine(
    (val) => (VALID_OPTIONS as readonly string[]).includes(val.toUpperCase()),
    { message: "Option harus A, B, C, D, atau E" },
  ),
  textAnswer: z.string().optional(),
  imageAnswerUrl: z.string().pipe(z.url("imageAnswerUrl harus URL yang valid")).optional().or(z.literal("")),
  isCorrect: z.boolean(),
});

const testQuestionDiscussionSchema = z.object({
  textDiscussion: z.string().optional(),
  videoUrl: z.string().pipe(z.url("videoUrl pembahasan harus URL yang valid")).optional().or(z.literal("")),
}).refine(
  (d) => d.textDiscussion || d.videoUrl,
  { message: "Discussion harus memiliki minimal textDiscussion atau videoUrl" },
);

const testQuestionSchema = z.object({
  questionNumber: z.number().int().positive("questionNumber harus bilangan bulat positif"),
  textQuestion: z.string().optional(),
  imageQuestionUrl: z.string().pipe(z.url("imageQuestionUrl harus URL yang valid")).optional().or(z.literal("")),
  pembahasan: z.string().min(1, "Pembahasan wajib diisi"),
  videoUrl: z.string().pipe(z.url("videoUrl harus URL yang valid")),
  options: z.array(testOptionSchema)
    .min(2, "Setiap soal harus memiliki minimal 2 opsi jawaban")
    .max(5, "Maksimal 5 opsi jawaban per soal")
    .refine(
      (opts) => opts.filter((o) => o.isCorrect).length === 1,
      { message: "Setiap soal harus memiliki tepat 1 jawaban benar (isCorrect: true)" },
    )
    .refine(
      (opts) => {
        const labels = opts.map((o) => o.option.toUpperCase());
        return new Set(labels).size === labels.length;
      },
      { message: "Opsi jawaban (option) tidak boleh duplikat dalam satu soal" },
    ),
  discussion: testQuestionDiscussionSchema.optional(),
}).refine(
  (q) => q.textQuestion || q.imageQuestionUrl,
  { message: "Soal harus memiliki minimal textQuestion atau imageQuestionUrl" },
);

const testQuestionPackageSchema = z.object({
  packageName: z.string().optional(),
  questions: z.array(testQuestionSchema)
    .min(1, "Setiap paket harus memiliki minimal 1 soal")
    .refine(
      (qs) => {
        const nums = qs.map((q) => q.questionNumber);
        return new Set(nums).size === nums.length;
      },
      { message: "questionNumber tidak boleh duplikat dalam satu paket" },
    ),
});

export const createDiagnosticTestSchema = z.object({
  body: z.object({
    testName: z.string().min(3, "Nama tes minimal 3 karakter").max(255, "Nama tes maksimal 255 karakter"),
    description: z.string().max(2000, "Deskripsi maksimal 2000 karakter").optional(),
    packages: z.array(testQuestionPackageSchema)
      .min(1, "Minimal 1 paket soal harus dibuat"),
  }),
});


const upsertTestOptionSchema = z.object({
  id: z.string().uuid("Option ID harus UUID yang valid").optional(),
  option: z.string().refine(
    (val) => (VALID_OPTIONS as readonly string[]).includes(val.toUpperCase()),
    { message: "Option harus A, B, C, D, atau E" },
  ),
  textAnswer: z.string().optional(),
  imageAnswerUrl: z.string().pipe(z.url("imageAnswerUrl harus URL yang valid")).optional().or(z.literal("")),
  isCorrect: z.boolean(),
});

const upsertTestQuestionSchema = z.object({
  id: z.string().uuid("Question ID harus UUID yang valid").optional(),
  questionNumber: z.number().int().positive("questionNumber harus bilangan bulat positif"),
  textQuestion: z.string().optional(),
  imageQuestionUrl: z.string().pipe(z.url("imageQuestionUrl harus URL yang valid")).optional().or(z.literal("")),
  pembahasan: z.string().min(1, "Pembahasan wajib diisi"),
  videoUrl: z.string().pipe(z.url("videoUrl harus URL yang valid")),
  options: z.array(upsertTestOptionSchema)
    .min(2, "Setiap soal harus memiliki minimal 2 opsi jawaban")
    .max(5, "Maksimal 5 opsi jawaban per soal")
    .refine(
      (opts) => opts.filter((o) => o.isCorrect).length === 1,
      { message: "Setiap soal harus memiliki tepat 1 jawaban benar (isCorrect: true)" },
    )
    .refine(
      (opts) => {
        const labels = opts.map((o) => o.option.toUpperCase());
        return new Set(labels).size === labels.length;
      },
      { message: "Opsi jawaban (option) tidak boleh duplikat dalam satu soal" },
    ),
  discussion: testQuestionDiscussionSchema.nullable().optional(),
}).refine(
  (q) => q.textQuestion || q.imageQuestionUrl,
  { message: "Soal harus memiliki minimal textQuestion atau imageQuestionUrl" },
);

const upsertTestQuestionPackageSchema = z.object({
  id: z.string().uuid("Package ID harus UUID yang valid").optional(),
  packageName: z.string().optional(),
  questions: z.array(upsertTestQuestionSchema)
    .min(1, "Setiap paket harus memiliki minimal 1 soal")
    .refine(
      (qs) => {
        const nums = qs.map((q) => q.questionNumber);
        return new Set(nums).size === nums.length;
      },
      { message: "questionNumber tidak boleh duplikat dalam satu paket" },
    ),
});

export const updateDiagnosticTestSchema = z.object({
  params: z.object({
    id: z.string().uuid("ID harus berupa UUID yang valid"),
  }),
  body: z.object({
    testName: z.string().min(3, "Nama tes minimal 3 karakter").max(255, "Nama tes maksimal 255 karakter").optional(),
    description: z.string().max(2000, "Deskripsi maksimal 2000 karakter").nullable().optional(),
    packages: z.array(upsertTestQuestionPackageSchema)
      .min(1, "Minimal 1 paket soal harus dikirimkan jika packages disertakan")
      .optional(),
  }).refine(
    (b) => b.testName !== undefined || b.description !== undefined || b.packages !== undefined,
    { message: "Minimal satu field (testName, description, atau packages) harus dikirimkan" },
  ),
});