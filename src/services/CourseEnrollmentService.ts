import { Op } from "sequelize";
import { Course, CourseEnrollment, Student, Teacher } from "../models";
import {
  EnrollCourseInput,
  PaginatedEnrollmentsResult,
} from "../types/courseEnrollment.types";

const MAX_LIMIT = 50;

const buildPagination = (page: number, limit: number, count: number) => ({
  currentPage: page,
  totalPages: Math.ceil(count / limit),
  totalItems: count,
  itemsPerPage: limit,
  hasNextPage: page < Math.ceil(count / limit),
  hasPrevPage: page > 1,
});

class CourseEnrollmentService {
  public enrollCourse = async (studentId: string, input: EnrollCourseInput) => {
    const student = await Student.findByPk(studentId);
    if (!student) {
      throw {
        status: 404,
        message:
          "Data siswa tidak ditemukan. Pastikan akun Anda memiliki profil siswa.",
      };
    }

    const course = await Course.findByPk(input.courseId);
    if (!course) throw { status: 404, message: "Kelas tidak ditemukan" };
    if (course.isArchived) {
      throw {
        status: 403,
        message: "Kelas ini sudah diarsipkan dan tidak menerima anggota baru",
      };
    }

    const existing = await CourseEnrollment.findOne({
      where: { studentId, courseId: input.courseId },
    });

    if (existing) {
      if (existing.isActive) {
        throw { status: 409, message: "Anda sudah terdaftar di kelas ini" };
      }
      await existing.update({ isActive: true });
      return existing;
    }

    const enrollment = await CourseEnrollment.create({
      studentId,
      courseId: input.courseId,
    });
    return enrollment;
  };

  public unenrollCourse = async (studentId: string, courseId: string) => {
    const enrollment = await CourseEnrollment.findOne({
      where: { studentId, courseId, isActive: true },
    });
    if (!enrollment) {
      throw { status: 404, message: "Anda tidak terdaftar di kelas ini" };
    }

    await enrollment.update({ isActive: false });
  };

  public getEnrollmentsByStudent = async (
    studentId: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<PaginatedEnrollmentsResult> => {
    const student = await Student.findByPk(studentId);
    if (!student) {
      throw { status: 404, message: "Data siswa tidak ditemukan." };
    }
    const offset = (page - 1) * limit;

    const courseWhere: any = {};
    if (search) {
      courseWhere[Op.or] = [
        { courseName: { [Op.iLike]: `%${search}%` } },
        { courseCode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows: enrollments, count } = await CourseEnrollment.findAndCountAll(
      {
        where: { studentId, isActive: true },
        include: [
          {
            model: Course,
            as: "course",
            attributes: [
              "id",
              "courseName",
              "courseCode",
              "joinLink",
              "slug",
              "isArchived",
              "schoolName",
            ],
            where: Object.keys(courseWhere).length ? courseWhere : undefined,
            include: [
              {
                model: Teacher,
                as: "teacher",
                attributes: ["id", "fullName", "NIP", "schoolName"],
              },
            ],
          },
        ],
        limit,
        offset,
        order: [["enrolledAt", "DESC"]],
        distinct: true,
      },
    );

    return { enrollments, pagination: buildPagination(page, limit, count) };
  };

  public getEnrollmentsByCourse = async (
    courseId: string,
    requesterId: string,
    isAdmin: boolean,
    page: number,
    limit: number,
    search?: string,
  ): Promise<PaginatedEnrollmentsResult> => {
    const course = await Course.findByPk(courseId);
    if (!course) throw { status: 404, message: "Kelas tidak ditemukan" };

    if (!isAdmin && course.teacherId !== requesterId) {
      throw {
        status: 403,
        message:
          "Anda tidak memiliki akses untuk melihat data enrollment kelas ini",
      };
    }
    const offset = (page - 1) * limit;

    const studentWhere: any = {};
    if (search) {
      studentWhere[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { NIS: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows: enrollments, count } = await CourseEnrollment.findAndCountAll(
      {
        where: { courseId, isActive: true },
        include: [
          {
            model: Student,
            as: "student",
            attributes: ["id", "fullName", "NIS", "schoolName", "city"],
            where: Object.keys(studentWhere).length ? studentWhere : undefined,
          },
        ],
        limit: limit,
        offset,
        order: [["enrolledAt", "DESC"]],
        distinct: true,
      },
    );

    return {
      enrollments,
      pagination: buildPagination(page, limit, count),
    };
  };
}

export default new CourseEnrollmentService();
