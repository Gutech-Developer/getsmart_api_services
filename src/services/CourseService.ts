import { Op } from "sequelize";
import crypto from "crypto";
import {
  Course,
  CourseEnrollment,
  CourseModule,
  Teacher,
} from "../models";
import { sequelize } from "../config/database";
import {
  CreateCourseInput,
  UpdateCourseInput,
  PaginatedCoursesResult,
} from "../types/course.types";
import { buildPagination, generateSlug, generateUniqueCode } from "../utils/helpers";
const courseIncludes = [
  {
    model: Teacher,
    as: "teacher",
    attributes: ["id", "fullName", "NIP", "schoolName"],
  },
];

class CourseService {  
  public getAllCourses = async (
    page: number,
    limit: number,
    search?: string,
  ): Promise<PaginatedCoursesResult> => {
    const offset = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { courseName: { [Op.iLike]: `%${search}%` } },
        { courseCode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows: courses, count } = await Course.findAndCountAll({
      where,
      include: courseIncludes,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });

    return { courses, pagination: buildPagination(page, limit, count) };
  };
  
  public getCoursesByTeacher = async (
    teacherId: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<PaginatedCoursesResult> => {
    const teacher = await Teacher.findByPk(teacherId);
    if (!teacher) throw { status: 404, message: "Guru tidak ditemukan" };

    const offset = (page - 1) * limit;

    const where: any = { teacherId };
    if (search) {
      where[Op.or] = [
        { courseName: { [Op.iLike]: `%${search}%` } },
        { courseCode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows: courses, count } = await Course.findAndCountAll({
      where,
      include: courseIncludes,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });

    return { courses, pagination: buildPagination(page, limit, count) };
  };
  
  public getCourseById = async (id: string) => {
    const course = await Course.findByPk(id, {
      include: [
        ...courseIncludes,
        { model: CourseModule, as: "modules" },
      ],
    });
    if (!course) throw { status: 404, message: "Kelas tidak ditemukan" };

    const enrolledCount = await CourseEnrollment.count({ where: { courseId: id } });
    return { ...course.toJSON(), enrolledCount };
  };
  
  public getCourseBySlug = async (slug: string) => {
    const course = await Course.findOne({
      where: { slug },
      include: [
        ...courseIncludes,
        { model: CourseModule, as: "modules" },
      ],
    });
    if (!course) throw { status: 404, message: "Kelas tidak ditemukan" };

    const enrolledCount = await CourseEnrollment.count({ where: { courseId: course.id } });
    return { ...course.toJSON(), enrolledCount };
  };
  
  public createCourse = async (
    teacherId: string,
    input: CreateCourseInput,
  ) => {
    const teacher = await Teacher.findByPk(teacherId);
    if (!teacher) {
      throw {
        status: 404,
        message: "Data guru tidak ditemukan. Pastikan akun Anda memiliki profil guru.",
      };
    }

    const courseCode = await generateUniqueCode();
    const slug = generateSlug(input.courseName);
    const joinLink = `${process.env.FRONTEND_URL ?? ""}/join/${courseCode}`;

    const transaction = await sequelize.transaction();
    try {
      const course = await Course.create(
        {
          courseName: input.courseName,
          teacherId,
          schoolId: teacher.schoolId,
          schoolName: teacher.schoolName,
          isArchived: false,
          slug,
          courseCode,
          joinLink,
        },
        { transaction },
      );

      await transaction.commit();

      return await this.getCourseById(course.id);
    } catch (error: any) {
      await transaction.rollback();
      if (error.status) throw error;
      throw { status: 500, message: "Gagal membuat kelas" };
    }
  };
  
  public updateCourse = async (
    id: string,
    teacherId: string,
    input: UpdateCourseInput,
  ) => {
    const course = await Course.findByPk(id);
    if (!course) throw { status: 404, message: "Kelas tidak ditemukan" };
    if (course.teacherId !== teacherId) {
      throw { status: 403, message: "Anda tidak memiliki akses untuk mengubah kelas ini" };
    }

    const updates: Partial<typeof course> | any = {};
    if (input.courseName) {
      updates.courseName = input.courseName;
      updates.slug = generateSlug(input.courseName);
    }

    await course.update(updates);
    return await this.getCourseById(id);
  };
  
  public archiveCourse = async (id: string, teacherId: string | null, isAdmin: boolean) => {
    const course = await Course.findByPk(id);
    if (!course) throw { status: 404, message: "Kelas tidak ditemukan" };
    if (!isAdmin && course.teacherId !== teacherId) {
      throw { status: 403, message: "Anda tidak memiliki akses untuk mengarsipkan kelas ini" };
    }
    if (course.isArchived) throw { status: 409, message: "Kelas sudah diarsipkan" };

    const transaction = await sequelize.transaction();
    try {
      await course.update({ isArchived: true }, { transaction });
      await CourseEnrollment.update(
        { isActive: false },
        { where: { courseId: id }, transaction },
      );
      await transaction.commit();
    } catch (error: any) {
      await transaction.rollback();
      if (error.status) throw error;
      throw { status: 500, message: "Gagal mengarsipkan kelas" };
    }

    return await this.getCourseById(id);
  };
  
  public unarchiveCourse = async (id: string, teacherId: string | null, isAdmin: boolean) => {
    const course = await Course.findByPk(id);
    if (!course) throw { status: 404, message: "Kelas tidak ditemukan" };
    if (!isAdmin && course.teacherId !== teacherId) {
      throw { status: 403, message: "Anda tidak memiliki akses untuk mengaktifkan kelas ini" };
    }
    if (!course.isArchived) throw { status: 409, message: "Kelas tidak sedang diarsipkan" };

    const transaction = await sequelize.transaction();
    try {
      await course.update({ isArchived: false }, { transaction });
      await CourseEnrollment.update(
        { isActive: true },
        { where: { courseId: id }, transaction },
      );
      await transaction.commit();
    } catch (error: any) {
      await transaction.rollback();
      if (error.status) throw error;
      throw { status: 500, message: "Gagal mengaktifkan kelas" };
    }

    return await this.getCourseById(id);
  };
  
  public deleteCourse = async (id: string, teacherId: string | null, isAdmin: boolean) => {
    const course = await Course.findByPk(id);
    if (!course) throw { status: 404, message: "Kelas tidak ditemukan" };
    if (!isAdmin && course.teacherId !== teacherId) {
      throw { status: 403, message: "Anda tidak memiliki akses untuk menghapus kelas ini" };
    }

    await course.destroy();
  };

}

export default new CourseService();
