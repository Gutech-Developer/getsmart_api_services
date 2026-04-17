import z from "zod";

export const paginationQuery = z.object({
  page: z.string().regex(/^\d+$/, "Page harus berupa angka").optional().default("1"),
  limit: z.string().regex(/^\d+$/, "Limit harus berupa angka").optional().default("10"),
  search: z.string().optional(),
});