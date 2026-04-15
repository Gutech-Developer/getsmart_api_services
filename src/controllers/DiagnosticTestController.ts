import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response";
import DiagnosticTestService from "../services/DiagnosticTestService";
import {
  CreateDiagnosticTestInput,
  UpdateDiagnosticTestInput,
} from "../types/diagnosticTest.types";
import { Teacher } from "../models";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const resolveTeacherId = async (req: Request, res: Response): Promise<string | null> => {
  const userId = req.user!.userId;
  const teacher = await Teacher.findOne({ where: { userId }, attributes: ["id"] });
  if (!teacher) {
    sendError(res, 403, "Profil guru tidak ditemukan untuk akun ini");
    return null;
  }
  return teacher.id;
}

class DiagnosticTestController {  
  public createDiagnosticTest = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = await resolveTeacherId(req, res);
      if (!teacherId) return;

      const result = await DiagnosticTestService.createDiagnosticTest(teacherId, req.body as CreateDiagnosticTestInput);
      sendSuccess(res, 201, "Tes diagnostik berhasil dibuat", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal membuat tes diagnostik");
    }
  };
  
  public getAllDiagnosticTests = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || DEFAULT_PAGE);
      const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit as string) || DEFAULT_LIMIT));
      const search = req.query.search as string | undefined;

      const result = await DiagnosticTestService.getAllDiagnosticTests(page, limit, search);
      sendSuccess(res, 200, "Daftar tes diagnostik berhasil didapatkan", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal mendapatkan daftar tes diagnostik");
    }
  };
  
  public getDiagnosticTestsByTeacher = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = req.params.teacherId as string;
      const page = Math.max(1, parseInt(req.query.page as string) || DEFAULT_PAGE);
      const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit as string) || DEFAULT_LIMIT));

      const result = await DiagnosticTestService.getDiagnosticTestsByTeacher(teacherId, page, limit);
      sendSuccess(res, 200, "Daftar tes diagnostik guru berhasil didapatkan", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal mendapatkan tes diagnostik guru");
    }
  };
  
  public getDiagnosticTestById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await DiagnosticTestService.getDiagnosticTestById(id);
      sendSuccess(res, 200, "Detail tes diagnostik berhasil didapatkan", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal mendapatkan tes diagnostik");
    }
  };
  
  public updateDiagnosticTest = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = await resolveTeacherId(req, res);
      if (!teacherId) return;

      const id = req.params.id as string;
      const result = await DiagnosticTestService.updateDiagnosticTest(id, teacherId, req.body as UpdateDiagnosticTestInput);
      sendSuccess(res, 200, "Tes diagnostik berhasil diperbarui", result);
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal memperbarui tes diagnostik");
    }
  };
  
  public deleteDiagnosticTest = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId = await resolveTeacherId(req, res);
      if (!teacherId) return;

      const id = req.params.id as string;
      await DiagnosticTestService.deleteDiagnosticTest(id, teacherId);
      sendSuccess(res, 200, "Tes diagnostik berhasil dihapus");
    } catch (error: any) {
      sendError(res, error.status || 500, error.message || "Gagal menghapus tes diagnostik");
    }
  };
  
}

export default new DiagnosticTestController();
