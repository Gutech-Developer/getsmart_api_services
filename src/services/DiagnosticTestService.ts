import { Transaction } from "sequelize";
import crypto from "crypto";
import {
  DiagnosticTest,
  TestQuestionPackage,
  TestQuestion,
  TestQuestionDiscussion,
  TestOption,
  Teacher,
} from "../models";
import { sequelize } from "../config/database";
import {
  CreateDiagnosticTestInput,
  UpdateDiagnosticTestInput,
  UpsertTestQuestionPackageInput,
} from "../types/diagnosticTest.types";

const diagnosticTestIncludes = [
  {
    model: Teacher,
    as: "teacher",
    attributes: ["id", "fullName", "NIP", "schoolName"],
  },
  {
    model: TestQuestionPackage,
    as: "packages",
  separate: true, 
    order: [["packageName", "ASC"]] as [string, string][],
    include: [
      {
        model: TestQuestion,
        as: "questions",
        separate: true,
        order: [["questionNumber", "ASC"]] as [string, string][],
        include: [
          {
            model: TestQuestionDiscussion,
          as: "discussion", 
          },
          {
            model: TestOption,
            as: "options",
            separate: true,
            order: [["option", "ASC"]] as [string, string][],
          },
        ],
      },
    ],
  },
];

class DiagnosticTestService {      
  
  public createDiagnosticTest = async (teacherId: string, input: CreateDiagnosticTestInput) => {    
    const teacher = await Teacher.findByPk(teacherId);
    if (!teacher) {
      throw { status: 404, message: "Data guru tidak ditemukan. Pastikan akun Anda memiliki profil guru." };
    }

    const transaction = await sequelize.transaction();

    try {      
      const diagnosticTest = await DiagnosticTest.create(
        { testName: input.testName, description: input.description ?? null, teacherId },
        { transaction },
      );
      
      const packageRecords = await TestQuestionPackage.bulkCreate(
        input.packages.map((pkg) => ({
          packageName: pkg.packageName ?? null,
          diagnosticTestId: diagnosticTest.id,
        })),
        { transaction, returning: true },
      );
      
      const questionPayloads: Array<{
        questionNumber: number;
        textQuestion: string | null;
        imageQuestionUrl: string | null;
        pembahasan: string;
        videoUrl: string;
        testPackageId: string;
      _pkgIndex: number; 
        _qIndex: number;
      }> = [];

      input.packages.forEach((pkg, pkgIdx) => {
        const packageId = packageRecords[pkgIdx].id;
        pkg.questions.forEach((q, qIdx) => {
          questionPayloads.push({
            questionNumber: q.questionNumber,
            textQuestion: q.textQuestion ?? null,
            imageQuestionUrl: q.imageQuestionUrl ?? null,
            pembahasan: q.pembahasan,
            videoUrl: q.videoUrl,
            testPackageId: packageId,
            _pkgIndex: pkgIdx,
            _qIndex: qIdx,
          });
        });
      });

      const questionRecords = await TestQuestion.bulkCreate(
        questionPayloads.map(({ _pkgIndex, _qIndex, ...q }) => q),
        { transaction, returning: true },
      );
      
      const optionPayloads: Array<{
        option: string;
        textAnswer: string | null;
        imageAnswerUrl: string | null;
        isCorrect: boolean;
        testQuestionId: string;
      }> = [];

      const discussionPayloads: Array<{
        testQuestionId: string;
        textDiscussion: string | null;
        videoUrl: string | null;
      }> = [];

      questionPayloads.forEach((qPayload, globalIdx) => {
        const questionId = questionRecords[globalIdx].id;
        const originalQuestion = input.packages[qPayload._pkgIndex].questions[qPayload._qIndex];
        
        for (const opt of originalQuestion.options) {
          optionPayloads.push({
            option: opt.option.toUpperCase(),
            textAnswer: opt.textAnswer ?? null,
            imageAnswerUrl: opt.imageAnswerUrl ?? null,
            isCorrect: opt.isCorrect,
            testQuestionId: questionId,
          });
        }
        
        if (originalQuestion.discussion) {
          discussionPayloads.push({
            testQuestionId: questionId,
            textDiscussion: originalQuestion.discussion.textDiscussion ?? null,
            videoUrl: originalQuestion.discussion.videoUrl ?? null,
          });
        }
      });
      
      await Promise.all([
        optionPayloads.length > 0
          ? TestOption.bulkCreate(optionPayloads, { transaction })
          : Promise.resolve(),
        discussionPayloads.length > 0
          ? TestQuestionDiscussion.bulkCreate(discussionPayloads, { transaction })
          : Promise.resolve(),
      ]);

      await transaction.commit();
      
      const result = await DiagnosticTest.findByPk(diagnosticTest.id, {
        include: diagnosticTestIncludes,
      });

      return result;
    } catch (error: any) {
      await transaction.rollback();
      
      if (error.status) throw error;

      console.error("Create diagnostic test error:", error);
      throw { status: 500, message: "Gagal membuat tes diagnostik" };
    }
  };   

  public getAllDiagnosticTests = async (page: number, limit: number, search?: string) => {
    const offset = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (search) {
      const { Op } = await import("sequelize");
      where.testName = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await DiagnosticTest.findAndCountAll({
      where,
      attributes: ["id", "teacherId", "testName", "description", "createdAt", "updatedAt"],
      include: [
        {
          model: Teacher,
          as: "teacher",
          attributes: ["id", "fullName", "NIP", "schoolName"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    distinct: true, 
    });
    
    const testIds = rows.map((r) => r.id);
    let questionCountMap: Record<string, number> = {};

    if (testIds.length > 0) {
      const { sequelize } = await import("../config/database");
      const [results] = await sequelize.query(`
        SELECT dt.id AS "diagnosticTestId", COUNT(tq.id)::int AS "questionCount"
        FROM "diagnosticTests" dt
        LEFT JOIN "testQuestionPackages" tqp ON tqp."diagnosticTestId" = dt.id
        LEFT JOIN "testQuestions" tq ON tq."testPackageId" = tqp.id
        WHERE dt.id IN (:testIds)
        GROUP BY dt.id
      `, {
        replacements: { testIds },
      });

      questionCountMap = (results as any[]).reduce((acc: Record<string, number>, r: any) => {
        acc[r.diagnosticTestId] = r.questionCount;
        return acc;
      }, {} as Record<string, number>);
    }

    const totalPages = Math.ceil(count / limit);

    return {
      diagnosticTests: rows.map((test) => ({
        ...test.toJSON(),
        totalQuestions: questionCountMap[test.id] || 0,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  };
      
  public getDiagnosticTestById = async (id: string) => {
    const diagnosticTest = await DiagnosticTest.findByPk(id, {
      include: diagnosticTestIncludes,
    });

    if (!diagnosticTest) {
      throw { status: 404, message: "Tes diagnostik tidak ditemukan" };
    }

    return diagnosticTest;
  };
      
  public getDiagnosticTestsByTeacher = async (teacherId: string, page: number, limit: number) => {
    const offset = (page - 1) * limit;

    const { count, rows } = await DiagnosticTest.findAndCountAll({
      where: { teacherId },
      attributes: ["id", "teacherId", "testName", "description", "createdAt", "updatedAt"],
      include: [
        {
          model: Teacher,
          as: "teacher",
          attributes: ["id", "fullName", "NIP", "schoolName"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });
    
    const testIds = rows.map((r) => r.id);
    let questionCountMap: Record<string, number> = {};

    if (testIds.length > 0) {
      const { sequelize } = await import("../config/database");
      const [results] = await sequelize.query(`
        SELECT dt.id AS "diagnosticTestId", COUNT(tq.id)::int AS "questionCount"
        FROM "diagnosticTests" dt
        LEFT JOIN "testQuestionPackages" tqp ON tqp."diagnosticTestId" = dt.id
        LEFT JOIN "testQuestions" tq ON tq."testPackageId" = tqp.id
        WHERE dt.id IN (:testIds)
        GROUP BY dt.id
      `, {
        replacements: { testIds },
      });

      questionCountMap = (results as any[]).reduce((acc: Record<string, number>, r: any) => {
        acc[r.diagnosticTestId] = r.questionCount;
        return acc;
      }, {} as Record<string, number>);
    }

    const totalPages = Math.ceil(count / limit);

    return {
      diagnosticTests: rows.map((test) => ({
        ...test.toJSON(),
        totalQuestions: questionCountMap[test.id] || 0,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  };
                    
  public updateDiagnosticTest = async (
    id: string,
    teacherId: string,
    input: UpdateDiagnosticTestInput,
  ) => {    
    const current = await DiagnosticTest.findOne({
      where: { id, teacherId },
      include: [
        {
          model: TestQuestionPackage,
          as: "packages",
          attributes: ["id"],
          include: [
            {
              model: TestQuestion,
              as: "questions",
              attributes: ["id"],
              include: [
                { model: TestOption, as: "options", attributes: ["id"] },
                { model: TestQuestionDiscussion, as: "discussion", attributes: ["id", "testQuestionId"] },
              ],
            },
          ],
        },
      ],
    });

    if (!current) {
      throw { status: 404, message: "Tes diagnostik tidak ditemukan atau Anda tidak memiliki akses" };
    }

    const transaction = await sequelize.transaction();
    try {      
      if (input.testName !== undefined) current.testName = input.testName;
      if (input.description !== undefined) current.description = input.description ?? null;
      await current.save({ transaction });
      
      if (input.packages !== undefined) {
        await this._reconcileAll(
          id,
          (current as any).packages ?? [],
          input.packages,
          transaction,
        );
      }

      await transaction.commit();
      return DiagnosticTest.findByPk(id, { include: diagnosticTestIncludes });
    } catch (error: any) {
      await transaction.rollback();
      if (error.status) throw error;
      console.error("Update diagnostic test error:", error);
      throw { status: 500, message: "Gagal mengupdate tes diagnostik" };
    }
  };
      
  public deleteDiagnosticTest = async (id: string, teacherId: string) => {
    const diagnosticTest = await DiagnosticTest.findOne({ where: { id, teacherId } });
    if (!diagnosticTest) {
      throw { status: 404, message: "Tes diagnostik tidak ditemukan atau Anda tidak memiliki akses" };
    }
    await diagnosticTest.destroy();
  };
                      
  private async _reconcileAll(
    diagnosticTestId: string,
    existingPkgsData: any[],
    inputPackages: UpsertTestQuestionPackageInput[],
    transaction: Transaction,
  ): Promise<void> {    

    const existingPkgMap = new Map<string, any>(
      existingPkgsData.map((p: any) => [p.id, p]),
    );
    
    const incomingPkgIds = new Set(
      inputPackages
        .filter((p) => p.id && existingPkgMap.has(p.id))
        .map((p) => p.id as string),
    );
    const pkgIdsToDelete = [...existingPkgMap.keys()].filter((id) => !incomingPkgIds.has(id));
        
    const existingQMap = new Map<string, any>();
  const existingDiscMap = new Map<string, string>(); 

    for (const pkg of existingPkgsData) {
      if (!incomingPkgIds.has(pkg.id)) continue;
      for (const q of pkg.questions ?? []) {
        existingQMap.set(q.id, q);
        if (q.discussion) existingDiscMap.set(q.id, q.discussion.id);
      }
    }

    const incomingQIds = new Set(
      inputPackages.flatMap((p) =>
        p.questions
          .filter((q) => q.id && existingQMap.has(q.id))
          .map((q) => q.id as string),
      ),
    );
    const qIdsToDelete = [...existingQMap.keys()].filter((id) => !incomingQIds.has(id));
    
    const existingOptSet = new Set<string>();
    for (const [qId, q] of existingQMap.entries()) {
      if (!incomingQIds.has(qId)) continue;
      for (const o of q.options ?? []) existingOptSet.add(o.id);
    }

    const incomingOptIds = new Set(
      inputPackages.flatMap((p) =>
        p.questions.flatMap((q) =>
          q.options
            .filter((o) => o.id && existingOptSet.has(o.id))
            .map((o) => o.id as string),
        ),
      ),
    );
    const optIdsToDelete = [...existingOptSet].filter((id) => !incomingOptIds.has(id));
    

    type PkgRow  = { id: string; packageName: string | null; diagnosticTestId: string };
    type QRow    = { id: string; questionNumber: number; textQuestion: string | null; imageQuestionUrl: string | null; pembahasan: string; videoUrl: string; testPackageId: string };
    type OptRow  = { id: string; option: string; textAnswer: string | null; imageAnswerUrl: string | null; isCorrect: boolean; testQuestionId: string };
    type DiscRow = { id?: string; testQuestionId: string; textDiscussion: string | null; videoUrl: string | null };

    const pkgRows:  PkgRow[]  = [];
    const qRows:    QRow[]    = [];
    const optRows:  OptRow[]  = [];
    const discRows: DiscRow[] = [];
  const discQIdsToDelete:  string[] = []; 

    for (const pkgInput of inputPackages) {      
      const pkgId = pkgInput.id && existingPkgMap.has(pkgInput.id)
        ? pkgInput.id
        : crypto.randomUUID();

      pkgRows.push({ id: pkgId, packageName: pkgInput.packageName ?? null, diagnosticTestId });

      for (const qInput of pkgInput.questions) {
        const qId = qInput.id && existingQMap.has(qInput.id)
          ? qInput.id
          : crypto.randomUUID();

        qRows.push({
          id: qId,
          questionNumber:    qInput.questionNumber,
          textQuestion:      qInput.textQuestion      ?? null,
          imageQuestionUrl:  qInput.imageQuestionUrl  ?? null,
          pembahasan:        qInput.pembahasan,
          videoUrl:          qInput.videoUrl,
          testPackageId:     pkgId,
        });

        for (const optInput of qInput.options) {
          optRows.push({
            id:            optInput.id && existingOptSet.has(optInput.id) ? optInput.id : crypto.randomUUID(),
            option:        optInput.option.toUpperCase(),
            textAnswer:    optInput.textAnswer    ?? null,
            imageAnswerUrl: optInput.imageAnswerUrl ?? null,
            isCorrect:     optInput.isCorrect,
            testQuestionId: qId,
          });
        }
        
        if (!qInput.discussion) {
          if (existingDiscMap.has(qId)) discQIdsToDelete.push(qId);
        } else {
          discRows.push({            
            ...(existingDiscMap.has(qId) ? { id: existingDiscMap.get(qId) } : {}),
            testQuestionId:  qId,
            textDiscussion:  qInput.discussion.textDiscussion ?? null,
            videoUrl:        qInput.discussion.videoUrl       ?? null,
          });
        }
      }
    }
            
    await Promise.all([
      pkgIdsToDelete.length  > 0 ? TestQuestionPackage.destroy({ where: { id: pkgIdsToDelete  }, transaction }) : Promise.resolve(),
      qIdsToDelete.length    > 0 ? TestQuestion.destroy(       { where: { id: qIdsToDelete    }, transaction }) : Promise.resolve(),
      optIdsToDelete.length  > 0 ? TestOption.destroy(         { where: { id: optIdsToDelete  }, transaction }) : Promise.resolve(),
      discQIdsToDelete.length > 0 ? TestQuestionDiscussion.destroy({ where: { testQuestionId: discQIdsToDelete }, transaction }) : Promise.resolve(),
    ]);
            
    if (pkgRows.length > 0) {
      await TestQuestionPackage.bulkCreate(pkgRows, {
        updateOnDuplicate: ["packageName"],
        transaction,
      });
    }
    if (qRows.length > 0) {
      await TestQuestion.bulkCreate(qRows, {
        updateOnDuplicate: ["questionNumber", "textQuestion", "imageQuestionUrl", "pembahasan", "videoUrl", "testPackageId"],
        transaction,
      });
    }
    await Promise.all([
      optRows.length  > 0
        ? TestOption.bulkCreate(optRows, {
            updateOnDuplicate: ["option", "textAnswer", "imageAnswerUrl", "isCorrect"],
            transaction,
          })
        : Promise.resolve(),
      discRows.length > 0
        ? TestQuestionDiscussion.bulkCreate(discRows, {
            updateOnDuplicate: ["textDiscussion", "videoUrl"],
            transaction,
          })
        : Promise.resolve(),
    ]);
  }
}

export default new DiagnosticTestService();
