import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response";
import CourseEnrollmentService from "../services/CourseEnrollmentService";
import { EnrollCourseInput } from "../types/courseEnrollment.types";
import { SystemRoleEnum } from "../types/enums";
import { p, parsePagination, resolveStudentId, resolveTeacherId } from "../utils/helpers";

class CourseEnrollmentController {
  public enrollCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = await resolveStudentId(req, res);
      if (!studentId) return;

      const result = await CourseEnrollmentService.enrollCourse(
        studentId,
        req.body as EnrollCourseInput,
      );
      sendSuccess(res, 201, "Berhasil mendaftar ke kelas", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal mendaftar ke kelas");
    }
  };

  public unenrollCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = await resolveStudentId(req, res);
      if (!studentId) return;

      await CourseEnrollmentService.unenrollCourse(studentId, p(req, "courseId"));
      sendSuccess(res, 200, "Berhasil keluar dari kelas", null);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal keluar dari kelas");
    }
  };

  public getMyEnrollments = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = await resolveStudentId(req, res);
      if (!studentId) return;

      const { page, limit, search } = parsePagination(req);
      const result = await CourseEnrollmentService.getEnrollmentsByStudent(
        studentId,
        page,
        limit,
        search,
      );
      sendSuccess(res, 200, "Daftar kelas yang diikuti berhasil didapatkan", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal mendapatkan daftar kelas");
    }
  };

  public getEnrollmentsByCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const isAdmin = req.user!.role === SystemRoleEnum.ADMIN;
      let requesterId: string;

      if (isAdmin) {
        requesterId = req.user!.userId;
      } else {
        const teacherId = await resolveTeacherId(req, res);
        if (!teacherId) return;
        requesterId = teacherId;
      }

      const { page, limit, search } = parsePagination(req);
      const result = await CourseEnrollmentService.getEnrollmentsByCourse(
        p(req, "courseId"),
        requesterId,
        isAdmin,
        page,
        limit,
        search,
      );
      sendSuccess(res, 200, "Daftar siswa terdaftar berhasil didapatkan", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal mendapatkan daftar siswa");
    }
  };
}

export default new CourseEnrollmentController();
