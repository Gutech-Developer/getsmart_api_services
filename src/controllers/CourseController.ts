import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response";
import CourseService from "../services/CourseService";
import {
  CreateCourseInput,
  UpdateCourseInput,
} from "../types/course.types";
import { SystemRoleEnum } from "../types/enums";
import { p, parsePagination, resolveTeacherId } from "../utils/helpers";

class CourseController {  
  public getAllCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, search } = parsePagination(req);
      const result = await CourseService.getAllCourses(page, limit, search);
      sendSuccess(res, 200, "Daftar kelas berhasil didapatkan", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal mendapatkan daftar kelas");
    }
  };
  
  public getCoursesByTeacher = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const teacherId = p(req, "teacherId");
      const { page, limit, search } = parsePagination(req);
      const result = await CourseService.getCoursesByTeacher(teacherId, page, limit, search);
      sendSuccess(res, 200, "Daftar kelas guru berhasil didapatkan", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal mendapatkan kelas guru");
    }
  };

  public getMyCoursesAsTeacher = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const teacherId = await resolveTeacherId(req, res);
      if (!teacherId) return;

      const { page, limit, search } = parsePagination(req);
      const result = await CourseService.getCoursesByTeacher(teacherId, page, limit, search);
      sendSuccess(res, 200, "Daftar kelas Anda berhasil didapatkan", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal mendapatkan kelas");
    }
  };

  public getCourseById = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await CourseService.getCourseById(p(req, "id"));
      sendSuccess(res, 200, "Detail kelas berhasil didapatkan", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal mendapatkan kelas");
    }
  };

  public getCourseBySlug = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const result = await CourseService.getCourseBySlug(p(req, "slug"));
      sendSuccess(res, 200, "Detail kelas berhasil didapatkan", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal mendapatkan kelas");
    }
  };
  
  public createCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = await resolveTeacherId(req, res);
      if (!teacherId) return;

      const result = await CourseService.createCourse(
        teacherId,
        req.body as CreateCourseInput,
      );
      sendSuccess(res, 201, "Kelas berhasil dibuat", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal membuat kelas");
    }
  };
  
  public updateCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = await resolveTeacherId(req, res);
      if (!teacherId) return;

      const result = await CourseService.updateCourse(
        p(req, "id"),
        teacherId,
        req.body as UpdateCourseInput,
      );
      sendSuccess(res, 200, "Kelas berhasil diperbarui", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal memperbarui kelas");
    }
  };
  
  public archiveCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const isAdmin = req.user!.role === SystemRoleEnum.ADMIN;
      let teacherId: string | null = null;
      if (!isAdmin) {
        teacherId = await resolveTeacherId(req, res);
        if (!teacherId) return;
      }
      const result = await CourseService.archiveCourse(p(req, "id"), teacherId, isAdmin);
      sendSuccess(res, 200, "Kelas berhasil diarsipkan", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal mengarsipkan kelas");
    }
  };
  
  public unarchiveCourse = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const isAdmin = req.user!.role === SystemRoleEnum.ADMIN;
      let teacherId: string | null = null;
      if (!isAdmin) {
        teacherId = await resolveTeacherId(req, res);
        if (!teacherId) return;
      }
      const result = await CourseService.unarchiveCourse(p(req, "id"), teacherId, isAdmin);
      sendSuccess(res, 200, "Kelas berhasil diaktifkan kembali", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal mengaktifkan kelas");
    }
  };
  
  public deleteCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const isAdmin = req.user!.role === SystemRoleEnum.ADMIN;
      let teacherId: string | null = null;
      if (!isAdmin) {
        teacherId = await resolveTeacherId(req, res);
        if (!teacherId) return;
      }
      await CourseService.deleteCourse(p(req, "id"), teacherId, isAdmin);
      sendSuccess(res, 200, "Kelas berhasil dihapus", null);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal menghapus kelas");
    }
  };
}

export default new CourseController();
