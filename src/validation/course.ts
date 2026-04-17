import { z } from "zod";
import { paginationQuery } from "./pagination";

const uuidParam = (name: string) =>
  z.string().uuid(`${name} harus berupa UUID yang valid`);

export const createCourseSchema = z.object({
  body: z.object({
    courseName: z
      .string()
      .min(1, "Nama kelas minimal 1 karakter")
      .max(255, "Nama kelas maksimal 255 karakter"),
  }),
});

export const updateCourseSchema = z.object({
  params: z.object({ id: uuidParam("Course ID") }),
  body: z
    .object({
      courseName: z
        .string()
        .min(1, "Nama kelas minimal 1 karakter")
        .max(255, "Nama kelas maksimal 255 karakter")
        .optional(),
    })
    .refine((d) => Object.values(d).some((v) => v !== undefined), {
      message: "Minimal satu field harus diisi untuk update",
    }),
});

export const courseIdSchema = z.object({
  params: z.object({ id: uuidParam("Course ID") }),
});

export const courseByTeacherSchema = z.object({
  params: z.object({ teacherId: uuidParam("Teacher ID") }),
  query: paginationQuery,
});

export const courseBySlugSchema = z.object({
  params: z.object({ slug: z.string().min(1, "Slug tidak boleh kosong") }),
});

export const paginationQuerySchema = z.object({
  query: paginationQuery,
});
