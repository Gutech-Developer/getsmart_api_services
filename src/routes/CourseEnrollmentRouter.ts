import express from "express";
import { validate } from "../middleware/validate";
import CourseEnrollmentController from "../controllers/CourseEnrollmentController";
import {
  enrollCourseSchema,
  unenrollCourseSchema,
  enrollmentsByCourseSchema,
  paginationQuerySchema,
} from "../validation/courseEnrollment";
import { authenticate, authorize } from "../middleware/auth";
import { SystemRoleEnum } from "../types/enums";

class CourseEnrollmentRouter {
  public courseEnrollmentRouter: express.Router;

  constructor() {
    this.courseEnrollmentRouter = express.Router();
    this.routes();
  }

  private routes() {
    this.courseEnrollmentRouter.post(
      "/",
      authenticate,
      authorize(SystemRoleEnum.STUDENT),
      validate(enrollCourseSchema),
      CourseEnrollmentController.enrollCourse,
    );
    
    this.courseEnrollmentRouter.get(
      "/my",
      authenticate,
      authorize(SystemRoleEnum.STUDENT),
      validate(paginationQuerySchema),
      CourseEnrollmentController.getMyEnrollments,
    );
    
    this.courseEnrollmentRouter.get(
      "/course/:courseId",
      authenticate,
      authorize(SystemRoleEnum.TEACHER, SystemRoleEnum.ADMIN),
      validate(enrollmentsByCourseSchema),
      CourseEnrollmentController.getEnrollmentsByCourse,
    );
    
    this.courseEnrollmentRouter.delete(
      "/:courseId",
      authenticate,
      authorize(SystemRoleEnum.STUDENT),
      validate(unenrollCourseSchema),
      CourseEnrollmentController.unenrollCourse,
    );
  }
}

export default new CourseEnrollmentRouter().courseEnrollmentRouter;
