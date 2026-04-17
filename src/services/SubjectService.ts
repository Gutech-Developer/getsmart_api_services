import { Op, Transaction } from "sequelize";
import {
  Teacher,
  Subject,
  ELKPD,
  CourseModule,
  Student,
  StudentELKPDSubmission,
  StudentModuleProgress,
} from "../models";
import { sequelize } from "../config/database";
import {
  CreateSubjectInput,
  UpdateSubjectInput,
  CreateELKPDInput,
  UpdateELKPDInput,
  SubmitELKPDInput,
  GradeELKPDSubmissionInput,
} from "../types/subject.types";
import { ModuleTypeEnum } from "../types/enums";

const MAX_LIMIT = 50;

/**
 * Verify that the courseModule is of type SUBJECT and belongs to the teacher
 * (via Course → Teacher).  Returns the module or throws.
 */
const resolveSubjectModule = async (
  courseModuleId: string,
  options: { teacherId?: string; transaction?: Transaction } = {},
) => {
  const { teacherId, transaction } = options;
  const module = await CourseModule.findByPk(courseModuleId, {
    include: [
      {
        model: Subject,
        as: "subject",
        include: [{ model: ELKPD, as: "eLKPDs" }],
      },
    ],
    transaction,
  });
  if (!module) throw { status: 404, message: "Course module tidak ditemukan" };
  if (module.type !== ModuleTypeEnum.SUBJECT)
    throw { status: 400, message: "Course module ini bukan bertipe SUBJECT" };
  if (!module.subjectId)
    throw { status: 400, message: "Course module tidak memiliki materi" };

  if (teacherId) {
    const subject = (module as any).subject as Subject;
    if (!subject || subject.teacherId !== teacherId)
      throw { status: 403, message: "Anda tidak memiliki akses ke modul ini" };
  }
  return module;
};

/**
 * After any progress field update, check if all requirements are met and
 * auto-complete the module if so.
 */
const checkAndCompleteModule = async (
  progress: StudentModuleProgress,
  courseModule: CourseModule,
  transaction: Transaction,
) => {
  const subject = (courseModule as any).subject as Subject & {
    eLKPDs: ELKPD[];
  };
  if (!subject) return;

  const eLKPDs: ELKPD[] = subject.eLKPDs ?? [];

  const fileOk = !!progress.fileReadAt;
  const videoOk = !subject.videoUrl || !!progress.videoWatchedAt;
  const elkpdOk = eLKPDs.length === 0 || !!progress.eLKPDSubmittedAt;

  if (fileOk && videoOk && elkpdOk && !progress.isCompleted) {
    await progress.update(
      { isCompleted: true, completedAt: new Date() },
      { transaction },
    );
  }
};

class SubjectService {
  public createSubjectService = async (
    teacherId: string,
    input: CreateSubjectInput,
  ) => {
    const t = await sequelize.transaction();
    try {
      const subject = await Subject.create(
        {
          teacherId,
          subjectName: input.subjectName,
          description: input.description,
          subjectFileUrl: input.subjectFileUrl,
          videoUrl: input.videoUrl,
        },
        { transaction: t },
      );

      let eLKPD: ELKPD | undefined;
      if (input.eLKPD) {
        eLKPD = await ELKPD.create(
          { ...input.eLKPD, subjectId: subject.id },
          { transaction: t },
        );
      }

      await t.commit();
      return { subject, eLKPD };
    } catch (error) {
      await t.rollback();
      console.error("Create subject error:", error);
      throw { status: 500, message: "Gagal membuat materi" };
    }
  };

  public getAllSubjects = async (page: number, limit: number) => {
    try {
      const safeLimit = Math.min(limit, MAX_LIMIT);
      const offset = (page - 1) * safeLimit;

      const { count, rows } = await Subject.findAndCountAll({
        limit: safeLimit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      const totalPages = Math.ceil(count / safeLimit);

      return {
        subjects: rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Get all subjects error:", error);
      throw { status: 500, message: "Gagal mendapatkan daftar materi" };
    }
  };

  public getSubjectsByTeacher = async (
    teacherId: string,
    page: number,
    limit: number,
  ) => {
    try {
      const safeLimit = Math.min(limit, MAX_LIMIT);
      const offset = (page - 1) * safeLimit;

      const { count, rows } = await Subject.findAndCountAll({
        where: { teacherId },
        limit: safeLimit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      return {
        subjects: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / safeLimit),
          totalItems: count,
          itemsPerPage: safeLimit,
          hasNextPage: page * safeLimit < count,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Get subjects error:", error);
      throw { status: 500, message: "Gagal mendapatkan materi" };
    }
  };

  public getSubjectById = async (id: string) => {
    try {
      const subject = await Subject.findByPk(id, {
        include: [
          {
            model: ELKPD,
            as: "eLKPDs",
            attributes: ["id", "title", "description", "fileUrl", "createdAt"],
          },
        ],
      });
      if (!subject) throw { status: 404, message: "Materi tidak ditemukan" };
      return subject;
    } catch (error: any) {
      if (error.status) throw error;
      console.error("Get subject by ID error:", error);
      throw { status: 500, message: "Gagal mendapatkan materi" };
    }
  };

  public updateSubject = async (
    id: string,
    teacherId: string,
    input: UpdateSubjectInput,
  ) => {
    try {
      const subject = await Subject.findByPk(id);
      if (!subject) throw { status: 404, message: "Materi tidak ditemukan" };
      if (subject.teacherId !== teacherId)
        throw {
          status: 403,
          message: "Anda tidak memiliki akses ke materi ini",
        };

      await subject.update(input);
      return subject;
    } catch (error: any) {
      if (error.status) throw error;
      console.error("Update subject error:", error);
      throw { status: 500, message: "Gagal mengubah materi" };
    }
  };

  public deleteSubject = async (id: string, teacherId: string) => {
    try {
      const subject = await Subject.findByPk(id);
      if (!subject) throw { status: 404, message: "Materi tidak ditemukan" };
      if (subject.teacherId !== teacherId)
        throw {
          status: 403,
          message: "Anda tidak memiliki akses ke materi ini",
        };

      await subject.destroy();
    } catch (error: any) {
      if (error.status) throw error;
      console.error("Delete subject error:", error);
      throw { status: 500, message: "Gagal menghapus materi" };
    }
  };

  public addELKPD = async (
    subjectId: string,
    teacherId: string,
    input: CreateELKPDInput,
  ) => {
    try {
      const subject = await Subject.findByPk(subjectId);
      if (!subject) throw { status: 404, message: "Materi tidak ditemukan" };
      if (subject.teacherId !== teacherId)
        throw {
          status: 403,
          message: "Anda tidak memiliki akses ke materi ini",
        };

      const eLKPD = await ELKPD.create({ ...input, subjectId });
      return eLKPD;
    } catch (error: any) {
      if (error.status) throw error;
      console.error("Add ELKPD error:", error);
      throw { status: 500, message: "Gagal menambahkan E-LKPD" };
    }
  };

  public updateELKPD = async (
    subjectId: string,
    elkpdId: string,
    teacherId: string,
    input: UpdateELKPDInput,
  ) => {
    try {
      const subject = await Subject.findByPk(subjectId);
      if (!subject) throw { status: 404, message: "Materi tidak ditemukan" };
      if (subject.teacherId !== teacherId)
        throw {
          status: 403,
          message: "Anda tidak memiliki akses ke materi ini",
        };

      const eLKPD = await ELKPD.findOne({ where: { id: elkpdId, subjectId } });
      if (!eLKPD) throw { status: 404, message: "E-LKPD tidak ditemukan" };

      await eLKPD.update(input);
      return eLKPD;
    } catch (error: any) {
      if (error.status) throw error;
      console.error("Update ELKPD error:", error);
      throw { status: 500, message: "Gagal mengubah E-LKPD" };
    }
  };

  public deleteELKPD = async (
    subjectId: string,
    elkpdId: string,
    teacherId: string,
  ) => {
    try {
      const subject = await Subject.findByPk(subjectId);
      if (!subject) throw { status: 404, message: "Materi tidak ditemukan" };
      if (subject.teacherId !== teacherId)
        throw {
          status: 403,
          message: "Anda tidak memiliki akses ke materi ini",
        };

      const eLKPD = await ELKPD.findOne({ where: { id: elkpdId, subjectId } });
      if (!eLKPD) throw { status: 404, message: "E-LKPD tidak ditemukan" };

      await eLKPD.destroy();
    } catch (error: any) {
      if (error.status) throw error;
      console.error("Delete ELKPD error:", error);
      throw { status: 500, message: "Gagal menghapus E-LKPD" };
    }
  };

  // ── Teacher: ELKPD submission management ──────────────────────────────────

  /** List all ELKPD submissions for a course module (teacher view) */
  // public getModuleSubmissions = async (
  //   courseModuleId: string,
  //   teacherId: string,
  //   page: number,
  //   limit: number,
  // ) => {
  //   try {
  //     await resolveSubjectModule(courseModuleId, { teacherId });

  //     const safeLimit = Math.min(limit, MAX_LIMIT);
  //     const offset    = (page - 1) * safeLimit;

  //     const { count, rows } = await StudentELKPDSubmission.findAndCountAll({
  //       where: { courseModuleId },
  //       include: [
  //         { model: Student, as: "student", attributes: ["id", "fullName"] },
  //         { model: ELKPD, as: "eLKPD", attributes: ["id", "title"] },
  //         { model: Teacher, as: "grader", attributes: ["id"] },
  //       ],
  //       limit: safeLimit,
  //       offset,
  //       order: [["submittedAt", "DESC"]],
  //     });

  //     return {
  //       submissions: rows,
  //       pagination: {
  //         currentPage:  page,
  //         totalPages:   Math.ceil(count / safeLimit),
  //         totalItems:   count,
  //         itemsPerPage: safeLimit,
  //         hasNextPage:  page * safeLimit < count,
  //         hasPrevPage:  page > 1,
  //       },
  //     };
  //   } catch (error: any) {
  //     if (error.status) throw error;
  //     console.error("Get module submissions error:", error);
  //     throw { status: 500, message: "Gagal mendapatkan daftar pengumpulan E-LKPD" };
  //   }
  // };

  // /** Grade (nilai) a single ELKPD submission */
  // public gradeELKPDSubmission = async (
  //   courseModuleId: string,
  //   submissionId: string,
  //   teacherId: string,
  //   input: GradeELKPDSubmissionInput,
  // ) => {
  //   try {
  //     await resolveSubjectModule(courseModuleId, { teacherId });

  //     const submission = await StudentELKPDSubmission.findOne({
  //       where: { id: submissionId, courseModuleId },
  //     });
  //     if (!submission) throw { status: 404, message: "Pengumpulan E-LKPD tidak ditemukan" };

  //     await submission.update({
  //       score:       input.score,
  //       teacherNote: input.teacherNote ?? null,
  //       gradedAt:    new Date(),
  //       gradedBy:    teacherId,
  //     });

  //     return submission;
  //   } catch (error: any) {
  //     if (error.status) throw error;
  //     console.error("Grade ELKPD submission error:", error);
  //     throw { status: 500, message: "Gagal memberikan nilai E-LKPD" };
  //   }
  // };

  // ── Student: progress tracking ─────────────────────────────────────────────

  /** Upsert progress row, return [record, isNew] */
  // private upsertProgress = async (
  //   studentId: string,
  //   courseModuleId: string,
  //   transaction: Transaction,
  // ): Promise<[StudentModuleProgress, boolean]> => {
  //   return StudentModuleProgress.findOrCreate({
  //     where: { studentId, courseModuleId },
  //     defaults: { studentId, courseModuleId },
  //     transaction,
  //   });
  // };

  // public markFileRead = async (courseModuleId: string, studentId: string) => {
  //   const t = await sequelize.transaction();
  //   try {
  //     const courseModule = await resolveSubjectModule(courseModuleId, { transaction: t });
  //     const [progress]   = await this.upsertProgress(studentId, courseModuleId, t);

  //     if (!progress.fileReadAt) {
  //       await progress.update({ fileReadAt: new Date() }, { transaction: t });
  //     }

  //     await checkAndCompleteModule(progress, courseModule, t);
  //     await t.commit();

  //     return progress;
  //   } catch (error: any) {
  //     await t.rollback();
  //     if (error.status) throw error;
  //     console.error("Mark file read error:", error);
  //     throw { status: 500, message: "Gagal menandai file telah dibaca" };
  //   }
  // };

  // public markVideoWatched = async (courseModuleId: string, studentId: string) => {
  //   const t = await sequelize.transaction();
  //   try {
  //     const courseModule = await resolveSubjectModule(courseModuleId, { transaction: t });
  //     const subject      = (courseModule as any).subject as Subject;

  //     if (!subject.videoUrl) throw { status: 400, message: "Materi ini tidak memiliki video" };

  //     const [progress] = await this.upsertProgress(studentId, courseModuleId, t);

  //     if (!progress.videoWatchedAt) {
  //       await progress.update({ videoWatchedAt: new Date() }, { transaction: t });
  //     }

  //     await checkAndCompleteModule(progress, courseModule, t);
  //     await t.commit();

  //     return progress;
  //   } catch (error: any) {
  //     await t.rollback();
  //     if (error.status) throw error;
  //     console.error("Mark video watched error:", error);
  //     throw { status: 500, message: "Gagal menandai video telah ditonton" };
  //   }
  // };

  // public submitELKPD = async (
  //   courseModuleId: string,
  //   studentId: string,
  //   input: SubmitELKPDInput,
  // ) => {
  //   const t = await sequelize.transaction();
  //   try {
  //     const courseModule = await resolveSubjectModule(courseModuleId, { transaction: t });
  //     const subject      = (courseModule as any).subject as (Subject & { eLKPDs: ELKPD[] });

  //     // Ensure the ELKPD belongs to this module's subject
  //     const eLKPD = subject.eLKPDs?.find((e) => e.id === input.eLKPDId);
  //     if (!eLKPD)
  //       throw { status: 404, message: "E-LKPD tidak ditemukan pada materi ini" };

  //     // Upsert submission (student can re-submit)
  //     const [submission, created] = await StudentELKPDSubmission.findOrCreate({
  //       where: { studentId, eLKPDId: input.eLKPDId, courseModuleId },
  //       defaults: {
  //         studentId,
  //         eLKPDId:           input.eLKPDId,
  //         courseModuleId,
  //         submissionFileUrl: input.submissionFileUrl,
  //         submittedAt:       new Date(),
  //       },
  //       transaction: t,
  //     });

  //     if (!created) {
  //       // Re-submission: reset grading
  //       await submission.update(
  //         {
  //           submissionFileUrl: input.submissionFileUrl,
  //           submittedAt:       new Date(),
  //           score:             null,
  //           teacherNote:       null,
  //           gradedAt:          null,
  //           gradedBy:          null,
  //         },
  //         { transaction: t },
  //       );
  //     }

  //     // Check if ALL ELKPDs for this subject have been submitted
  //     const eLKPDIds       = subject.eLKPDs.map((e) => e.id);
  //     const submittedCount = await StudentELKPDSubmission.count({
  //       where: { studentId, courseModuleId, eLKPDId: { [Op.in]: eLKPDIds } },
  //       transaction: t,
  //     });

  //     const [progress] = await this.upsertProgress(studentId, courseModuleId, t);

  //     if (submittedCount >= eLKPDIds.length && !progress.eLKPDSubmittedAt) {
  //       await progress.update({ eLKPDSubmittedAt: new Date() }, { transaction: t });
  //     }

  //     await checkAndCompleteModule(progress, courseModule, t);
  //     await t.commit();

  //     return { submission, progress };
  //   } catch (error: any) {
  //     await t.rollback();
  //     if (error.status) throw error;
  //     console.error("Submit ELKPD error:", error);
  //     throw { status: 500, message: "Gagal mengumpulkan E-LKPD" };
  //   }
  // };

  // public getModuleProgress = async (courseModuleId: string, studentId: string) => {
  //   try {
  //     const courseModule = await resolveSubjectModule(courseModuleId);

  //     const progress = await StudentModuleProgress.findOne({
  //       where: { studentId, courseModuleId },
  //     });

  //     const submissions = await StudentELKPDSubmission.findAll({
  //       where: { studentId, courseModuleId },
  //       include: [{ model: ELKPD, as: "eLKPD", attributes: ["id", "title"] }],
  //       attributes: ["id", "eLKPDId", "submissionFileUrl", "score", "teacherNote", "submittedAt", "gradedAt"],
  //       order: [["submittedAt", "DESC"]],
  //     });

  //     return { progress, submissions };
  //   } catch (error: any) {
  //     if (error.status) throw error;
  //     console.error("Get module progress error:", error);
  //     throw { status: 500, message: "Gagal mendapatkan progress modul" };
  //   }
  // };
}

export default new SubjectService();
