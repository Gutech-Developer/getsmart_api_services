import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response";
import { Teacher } from "../models";
import {
  CreateSubjectInput,
  UpdateSubjectInput,
  CreateELKPDInput,
  UpdateELKPDInput,
} from "../types/subject.types";
import SubjectService from "../services/SubjectService";
import { p, parsePagination, resolveTeacherId } from "../utils/helpers";

class SubjectController {

  public createSubject = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = await resolveTeacherId(req, res);
      if (!teacherId) return;

      const result = await SubjectService.createSubjectService(
        teacherId,
        req.body as CreateSubjectInput,
      );
      sendSuccess(res, 201, "Materi berhasil dibuat", result);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || "Gagal membuat materi",
      );
    }
  };

  public getAllSubjects = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { page, limit, search } = parsePagination(req);
      const result = await SubjectService.getAllSubjects(page, limit, search);
      sendSuccess(res, 200, "Daftar materi berhasil didapatkan", result);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || "Gagal mendapatkan daftar materi",
      );
    }
  };

  public getMySubjectsAsTeacher = async (req: Request, res: Response): Promise<void> => {
    const teacherId = await resolveTeacherId(req, res);
    if (!teacherId) return;
    try {
      const { page, limit, search } = parsePagination(req);
      const result = await SubjectService.getSubjectsByTeacher(
        teacherId,
        page,
        limit,
        search,
      );
      sendSuccess(res, 200, "Daftar materi guru berhasil didapatkan", result);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || "Gagal mendapatkan materi guru",
      );
    }
  };

  public getSubjectsByTeacher = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { page, limit, search } = parsePagination(req);
      const result = await SubjectService.getSubjectsByTeacher(
        p(req, "teacherId"),
        page,
        limit,
        search,
      );
      sendSuccess(res, 200, "Daftar materi guru berhasil didapatkan", result);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || "Gagal mendapatkan materi guru",
      );
    }
  };

  public getSubjectById = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const result = await SubjectService.getSubjectById(p(req, "id"));
      sendSuccess(res, 200, "Detail materi berhasil didapatkan", result);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || "Gagal mendapatkan materi",
      );
    }
  };

  public updateSubject = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = await resolveTeacherId(req, res);
      if (!teacherId) return;

      const result = await SubjectService.updateSubject(
        p(req, "id"),
        teacherId,
        req.body as UpdateSubjectInput,
      );
      sendSuccess(res, 200, "Materi berhasil diperbarui", result);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || "Gagal mengubah materi",
      );
    }
  };

  public deleteSubject = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = await resolveTeacherId(req, res);
      if (!teacherId) return;

      await SubjectService.deleteSubject(p(req, "id"), teacherId);
      sendSuccess(res, 200, "Materi berhasil dihapus");
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || "Gagal menghapus materi",
      );
    }
  };  

  public addELKPD = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = await resolveTeacherId(req, res);
      if (!teacherId) return;

      const result = await SubjectService.addELKPD(
        p(req, "subjectId"),
        teacherId,
        req.body as CreateELKPDInput,
      );
      sendSuccess(res, 201, "E-LKPD berhasil ditambahkan", result);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || "Gagal menambahkan E-LKPD",
      );
    }
  };

  public updateELKPD = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = await resolveTeacherId(req, res);
      if (!teacherId) return;

      const result = await SubjectService.updateELKPD(
        p(req, "subjectId"),
        p(req, "elkpdId"),
        teacherId,
        req.body as UpdateELKPDInput,
      );
      sendSuccess(res, 200, "E-LKPD berhasil diperbarui", result);
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || "Gagal mengubah E-LKPD",
      );
    }
  };

  public deleteELKPD = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = await resolveTeacherId(req, res);
      if (!teacherId) return;

      await SubjectService.deleteELKPD(
        p(req, "subjectId"),
        p(req, "elkpdId"),
        teacherId,
      );
      sendSuccess(res, 200, "E-LKPD berhasil dihapus");
    } catch (error: any) {
      sendError(
        res,
        error.status || 500,
        error.message || "Gagal menghapus E-LKPD",
      );
    }
  };

  // ── Teacher: submissions & grading ──────────────────────────────────────

  // public getModuleSubmissions = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const teacherId = await resolveTeacherId(req, res);
  //     if (!teacherId) return;

  //     const { page, limit } = parsePagination(req);
  //     const result = await SubjectService.getModuleSubmissions(
  //       p(req, "courseModuleId"),
  //       teacherId,
  //       page,
  //       limit,
  //     );
  //     sendSuccess(res, 200, "Daftar pengumpulan E-LKPD berhasil didapatkan", result);
  //   } catch (error: any) {
  //     sendError(res, error.status || 500, error.message || "Gagal mendapatkan daftar pengumpulan");
  //   }
  // };

  // public gradeELKPDSubmission = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const teacherId = await resolveTeacherId(req, res);
  //     if (!teacherId) return;

  //     const result = await SubjectService.gradeELKPDSubmission(
  //       p(req, "courseModuleId"),
  //       p(req, "submissionId"),
  //       teacherId,
  //       req.body as GradeELKPDSubmissionInput,
  //     );
  //     sendSuccess(res, 200, "Nilai E-LKPD berhasil diberikan", result);
  //   } catch (error: any) {
  //     sendError(res, error.status || 500, error.message || "Gagal memberikan nilai E-LKPD");
  //   }
  // };

  // ── Student: module progress ─────────────────────────────────────────────

  // public markFileRead = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const studentId = await resolveStudentId(req, res);
  //     if (!studentId) return;

  //     const result = await SubjectService.markFileRead(p(req, "courseModuleId"), studentId);
  //     sendSuccess(res, 200, "File berhasil ditandai telah dibaca", result);
  //   } catch (error: any) {
  //     sendError(res, error.status || 500, error.message || "Gagal menandai file");
  //   }
  // };

  // public markVideoWatched = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const studentId = await resolveStudentId(req, res);
  //     if (!studentId) return;

  //     const result = await SubjectService.markVideoWatched(p(req, "courseModuleId"), studentId);
  //     sendSuccess(res, 200, "Video berhasil ditandai telah ditonton", result);
  //   } catch (error: any) {
  //     sendError(res, error.status || 500, error.message || "Gagal menandai video");
  //   }
  // };

  // public submitELKPD = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const studentId = await resolveStudentId(req, res);
  //     if (!studentId) return;

  //     const result = await SubjectService.submitELKPD(
  //       p(req, "courseModuleId"),
  //       studentId,
  //       req.body as SubmitELKPDInput,
  //     );
  //     sendSuccess(res, 200, "E-LKPD berhasil dikumpulkan", result);
  //   } catch (error: any) {
  //     sendError(res, error.status || 500, error.message || "Gagal mengumpulkan E-LKPD");
  //   }
  // };

  // public getModuleProgress = async (req: Request, res: Response): Promise<void> => {
  //   try {
  //     const studentId = await resolveStudentId(req, res);
  //     if (!studentId) return;

  //     const result = await SubjectService.getModuleProgress(
  //       p(req, "courseModuleId"),
  //       studentId,
  //     );
  //     sendSuccess(res, 200, "Progress modul berhasil didapatkan", result);
  //   } catch (error: any) {
  //     sendError(res, error.status || 500, error.message || "Gagal mendapatkan progress modul");
  //   }
  // };
}

export default new SubjectController();
