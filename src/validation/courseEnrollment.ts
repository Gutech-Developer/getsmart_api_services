import { z } from "zod";
import { paginationQuery } from "./pagination";

const uuidParam = (name: string) =>
  z.string().uuid(`${name} harus berupa UUID yang valid`);

export const enrollCourseSchema = z.object({
  body: z.object({
    courseId: z.string().uuid("courseId harus berupa UUID yang valid"),
  }),
});

export const unenrollCourseSchema = z.object({
  params: z.object({ courseId: uuidParam("Course ID") }),
});

export const enrollmentsByCourseSchema = z.object({
  params: z.object({ courseId: uuidParam("Course ID") }),
  query: paginationQuery,
});

export const paginationQuerySchema = z.object({
  query: paginationQuery,
});
