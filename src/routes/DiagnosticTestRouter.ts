import express from "express";
import { validate } from "../middleware/validate";
import DiagnosticTestController from "../controllers/DiagnosticTestController";
import {
  paginationQuerySchema,
  diagnosticTestIdSchema,
  diagnosticTestByTeacherSchema,
  createDiagnosticTestSchema,
  updateDiagnosticTestSchema,
} from "../validation/diagnosticTest";
import { authenticate, authorize } from "../middleware/auth";
import { SystemRoleEnum } from "../types/enums";

class DiagnosticTestRouter {
  public diagnosticTestRouter: express.Router;

  constructor() {
    this.diagnosticTestRouter = express.Router();
    this.routes();
  }

  private routes() {
    this.diagnosticTestRouter.post(
      "/",
      authenticate,
      authorize(SystemRoleEnum.TEACHER),
      validate(createDiagnosticTestSchema),
      DiagnosticTestController.createDiagnosticTest,
    );

    this.diagnosticTestRouter.get(
      "/",      
      authenticate,
      authorize(SystemRoleEnum.TEACHER, SystemRoleEnum.ADMIN),
      validate(paginationQuerySchema),
      DiagnosticTestController.getAllDiagnosticTests,
    );

    this.diagnosticTestRouter.get(
      "/teacher/:teacherId",
      authenticate,
      authorize(SystemRoleEnum.TEACHER, SystemRoleEnum.ADMIN),
      validate(diagnosticTestByTeacherSchema),
      DiagnosticTestController.getDiagnosticTestsByTeacher,
    );

    this.diagnosticTestRouter.get(
      "/:id",
      authenticate,
      authorize(SystemRoleEnum.TEACHER, SystemRoleEnum.ADMIN),
      validate(diagnosticTestIdSchema),
      DiagnosticTestController.getDiagnosticTestById,
    );

    this.diagnosticTestRouter.patch(
      "/:id",
      authenticate,
      authorize(SystemRoleEnum.TEACHER),
      validate(updateDiagnosticTestSchema),
      DiagnosticTestController.updateDiagnosticTest,
    );

    this.diagnosticTestRouter.delete(
      "/:id",
      authenticate,
      authorize(SystemRoleEnum.TEACHER),
      validate(diagnosticTestIdSchema),
      DiagnosticTestController.deleteDiagnosticTest,
    );
  }
}

export default new DiagnosticTestRouter().diagnosticTestRouter;
