import express from "express";
import { validate } from "../middleware/validate";
import { authenticate, authorize } from "../middleware/auth";
import { SystemRoleEnum } from "../types/enums";
import {
  createSubjectSchema,
  updateSubjectSchema,
  subjectIdSchema,
  subjectByTeacherSchema,
  addELKPDSchema,
  updateELKPDSchema,
  elkpdParamsSchema,
  moduleSubmissionsSchema,
  gradeELKPDSubmissionSchema,
  courseModuleIdSchema,
  submitELKPDSchema,
  paginationQuerySchema,
} from "../validation/subject";
import SubjectController from "../controllers/SubjectController";

class SubjectRouter {
  public subjectRouter: express.Router;

  constructor() {
    this.subjectRouter = express.Router();
    this.routes();
  }

  private routes() {
    this.subjectRouter.post(
      "/",
      authenticate,
      authorize(SystemRoleEnum.TEACHER),
      validate(createSubjectSchema),
      SubjectController.createSubject,
    );

    this.subjectRouter.get(
      "/",
      authenticate,
      validate(paginationQuerySchema),
      SubjectController.getAllSubjects,
    );

    this.subjectRouter.get(
      "/teacher/:teacherId",
      authenticate,
      validate(subjectByTeacherSchema),
      SubjectController.getSubjectsByTeacher,
    );

    this.subjectRouter.get(
      "/:id",
      authenticate,
      validate(subjectIdSchema),
      SubjectController.getSubjectById,
    );

    this.subjectRouter.put(
      "/:id",
      authenticate,
      authorize(SystemRoleEnum.TEACHER),
      validate(updateSubjectSchema),
      SubjectController.updateSubject,
    );

    this.subjectRouter.delete(
      "/:id",
      authenticate,
      authorize(SystemRoleEnum.TEACHER),
      validate(subjectIdSchema),
      SubjectController.deleteSubject,
    );

    // ── Teacher: E-LKPD management ────────────────────────────────────────
    this.subjectRouter.post(
      "/:subjectId/elkpd",
      authenticate,
      authorize(SystemRoleEnum.TEACHER),
      validate(addELKPDSchema),
      SubjectController.addELKPD,
    );

    this.subjectRouter.put(
      "/:subjectId/elkpd/:elkpdId",
      authenticate,
      authorize(SystemRoleEnum.TEACHER),
      validate(updateELKPDSchema),
      SubjectController.updateELKPD,
    );

    this.subjectRouter.delete(
      "/:subjectId/elkpd/:elkpdId",
      authenticate,
      authorize(SystemRoleEnum.TEACHER),
      validate(elkpdParamsSchema),
      SubjectController.deleteELKPD,
    );

    // ── Teacher: ELKPD grading ────────────────────────────────────────────
    // this.subjectRouter.get(
    //   "/modules/:courseModuleId/submissions",
    //   authenticate,
    //   authorize(SystemRoleEnum.TEACHER),
    //   validate(moduleSubmissionsSchema),
    //   SubjectController.getModuleSubmissions,
    // );

    // this.subjectRouter.put(
    //   "/modules/:courseModuleId/submissions/:submissionId/grade",
    //   authenticate,
    //   authorize(SystemRoleEnum.TEACHER),
    //   validate(gradeELKPDSubmissionSchema),
    //   SubjectController.gradeELKPDSubmission,
    // );

    // ── Student: module progress ──────────────────────────────────────────
    // this.subjectRouter.post(
    //   "/modules/:courseModuleId/mark-file-read",
    //   authenticate,
    //   authorize(SystemRoleEnum.STUDENT),
    //   validate(courseModuleIdSchema),
    //   SubjectController.markFileRead,
    // );

    // this.subjectRouter.post(
    //   "/modules/:courseModuleId/mark-video-watched",
    //   authenticate,
    //   authorize(SystemRoleEnum.STUDENT),
    //   validate(courseModuleIdSchema),
    //   SubjectController.markVideoWatched,
    // );

    // this.subjectRouter.post(
    //   "/modules/:courseModuleId/elkpd/submit",
    //   authenticate,
    //   authorize(SystemRoleEnum.STUDENT),
    //   validate(submitELKPDSchema),
    //   SubjectController.submitELKPD,
    // );

    // this.subjectRouter.get(
    //   "/modules/:courseModuleId/progress",
    //   authenticate,
    //   authorize(SystemRoleEnum.STUDENT),
    //   validate(courseModuleIdSchema),
    //   SubjectController.getModuleProgress,
    // );
  }
}

export default new SubjectRouter().subjectRouter;
