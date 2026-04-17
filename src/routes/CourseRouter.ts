import express from "express";
import { validate } from "../middleware/validate";
import CourseController from "../controllers/CourseController";
import {
  courseIdSchema,
  courseByTeacherSchema,
  courseBySlugSchema,
  createCourseSchema,
  updateCourseSchema,
} from "../validation/course";
import { authenticate, authorize } from "../middleware/auth";
import { SystemRoleEnum } from "../types/enums";
import { paginationQuery } from "../validation/pagination";

class CourseRouter {
  public courseRouter: express.Router;

  constructor() {
    this.courseRouter = express.Router();
    this.routes();
  }

  private routes() {
    this.courseRouter.post(
      "/",
      authenticate,
      authorize(SystemRoleEnum.TEACHER),
      validate(createCourseSchema),
      CourseController.createCourse,
    );

    this.courseRouter.get(
      "/",
      authenticate,
      authorize(SystemRoleEnum.ADMIN),
      validate(paginationQuery),
      CourseController.getAllCourses,
    );
    
    this.courseRouter.get(
      "/my",
      authenticate,
      authorize(SystemRoleEnum.TEACHER),
      validate(paginationQuery),
      validate(paginationQuery),
      CourseController.getMyCoursesAsTeacher,
    );
    
    this.courseRouter.get(
      "/teacher/:teacherId",
      authenticate,
      authorize(SystemRoleEnum.TEACHER, SystemRoleEnum.ADMIN),
      validate(courseByTeacherSchema),
      validate(paginationQuery),
      CourseController.getCoursesByTeacher,
    );
    
    this.courseRouter.get(
      "/slug/:slug",
      authenticate,
      authorize(SystemRoleEnum.TEACHER, SystemRoleEnum.ADMIN, SystemRoleEnum.STUDENT),
      validate(courseBySlugSchema),
      CourseController.getCourseBySlug,
    );
    
    this.courseRouter.get(
      "/:id",
      authenticate,
      authorize(SystemRoleEnum.TEACHER, SystemRoleEnum.ADMIN, SystemRoleEnum.STUDENT),
      validate(courseIdSchema),
      CourseController.getCourseById,
    );
    
    this.courseRouter.patch(
      "/:id",
      authenticate,
      authorize(SystemRoleEnum.TEACHER),
      validate(updateCourseSchema),
      CourseController.updateCourse,
    );
    
    this.courseRouter.patch(
      "/:id/archive",
      authenticate,
      authorize(SystemRoleEnum.TEACHER, SystemRoleEnum.ADMIN),
      validate(courseIdSchema),
      CourseController.archiveCourse,
    );
    
    this.courseRouter.patch(
      "/:id/unarchive",
      authenticate,
      authorize(SystemRoleEnum.TEACHER, SystemRoleEnum.ADMIN),
      validate(courseIdSchema),
      CourseController.unarchiveCourse,
    );
    
    this.courseRouter.delete(
      "/:id",
      authenticate,
      authorize(SystemRoleEnum.TEACHER, SystemRoleEnum.ADMIN),
      validate(courseIdSchema),
      CourseController.deleteCourse,
    );
  }
}

export default new CourseRouter().courseRouter;
