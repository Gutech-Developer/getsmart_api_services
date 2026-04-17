import { Request, Response } from "express";
import { Course, Student, Teacher } from "../models";
import { sendError } from "./response";

export const p = (req: Request, key: string) => req.params[key] as string;

export const parsePagination = (req: Request) => ({
  page:  Math.max(1, parseInt(req.query.page as string) || 1),
  limit: Math.max(1, parseInt(req.query.limit as string) || 10),
  search: req.query.search as string | undefined,
});

export const resolveTeacherId = async (req: Request, res: Response): Promise<string | null> => {
  const teacher = await Teacher.findOne({
    where: { userId: req.user!.userId },
    attributes: ["id"],
  });
  if (!teacher) {
    sendError(res, 403, "Profil guru tidak ditemukan untuk akun ini");
    return null;
  }
  return teacher.id;
};

export const resolveStudentId = async (
  req: Request,
  res: Response,
): Promise<string | null> => {
  const userId = req.user!.userId;
  const student = await Student.findOne({
    where: { userId },
    attributes: ["id"],
  });
  if (!student) {
    sendError(res, 403, "Profil siswa tidak ditemukan untuk akun ini");
    return null;
  }
  return student.id;
};

export const generateSlug = (courseName: string): string => {
  const base = courseName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const suffix = crypto.randomUUID().split("-")[0];
  return `${base}-${suffix}`;
};

export const generateCourseCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const generateUniqueCode = async (): Promise<string> => {
  let code: string;
  let exists: Course | null;
  do {
    code = generateCourseCode();
    exists = await Course.findOne({ where: { courseCode: code } });
  } while (exists);
  return code;
};

export const buildPagination = (page: number, limit: number, count: number) => ({
  currentPage: page,
  totalPages: Math.ceil(count / limit),
  totalItems: count,
  itemsPerPage: limit,
  hasNextPage: page < Math.ceil(count / limit),
  hasPrevPage: page > 1,
});