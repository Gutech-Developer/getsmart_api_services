import User from "./User";
import Student from "./Student";
import Teacher from "./Teacher";
import Parent from "./Parent";
import SystemRole from "./SystemRole";
import SystemUserRole from "./SystemUserRole";
import RefreshToken from "./RefreshToken";
import MagicLinkToken from "./MagicLinkToken";
import Course from "./Course";
import Subject from "./Subject";
import ELKPD from "./ELKPD";
import DiagnosticTest from "./DiagnosticTest";
import TestQuestionPackage from "./TestQuestionPackage";
import TestQuestion from "./TestQuestion";
import TestQuestionDiscussion from "./TestQuestionDiscussion";
import TestOption from "./TestOption";
import NotificationType from "./NotificationType";
import Notification from "./Notification";
import CourseModule from "./CourseModule";
import CourseEnrollment from "./CourseEnrollment";
import ParentStudent from "./ParentStudent";
import StudentTestAttempt from "./StudentTestAttempt";
import StudentTestAnswer from "./StudentTestAnswer";
import StudentELKPDSubmission from "./StudentELKPDSubmission";
import StudentModuleProgress from "./StudentModuleProgress";

// =====================================================
// ASSOCIATIONS
// =====================================================

const setupAssociations = (): void => {
  // ---- User → Profile tables (1:1) ----
  User.hasOne(Student, { foreignKey: "userId", as: "student" });
  Student.belongsTo(User, { foreignKey: "userId", as: "user" });

  User.hasOne(Teacher, { foreignKey: "userId", as: "teacher" });
  Teacher.belongsTo(User, { foreignKey: "userId", as: "user" });

  User.hasOne(Parent, { foreignKey: "userId", as: "parent" });
  Parent.belongsTo(User, { foreignKey: "userId", as: "user" });

  // ---- User → SystemUserRole → SystemRole (RBAC) ----
  User.hasOne(SystemUserRole, { foreignKey: "userId", as: "systemUserRole" });
  SystemUserRole.belongsTo(User, { foreignKey: "userId", as: "user" });

  SystemRole.hasMany(SystemUserRole, { foreignKey: "systemRoleId", as: "systemUserRoles" });
  SystemUserRole.belongsTo(SystemRole, { foreignKey: "systemRoleId", as: "systemRole" });

  // ---- User → Auth tokens ----
  User.hasMany(RefreshToken, { foreignKey: "userId", as: "refreshTokens" });
  RefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });

  // ---- User → Notifications ----
  User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
  Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

  NotificationType.hasMany(Notification, { foreignKey: "notificationTypeId", as: "notifications" });
  Notification.belongsTo(NotificationType, { foreignKey: "notificationTypeId", as: "notificationType" });

  // ---- Teacher → Course ----
  Teacher.hasMany(Course, { foreignKey: "teacherId", as: "courses" });
  Course.belongsTo(Teacher, { foreignKey: "teacherId", as: "teacher" });

  // ---- Teacher → Subject (bank subject guru) ----
  Teacher.hasMany(Subject, { foreignKey: "teacherId", as: "subjects" });
  Subject.belongsTo(Teacher, { foreignKey: "teacherId", as: "teacher" });

  // ---- Teacher → DiagnosticTest ----
  Teacher.hasMany(DiagnosticTest, { foreignKey: "teacherId", as: "diagnosticTests" });
  DiagnosticTest.belongsTo(Teacher, { foreignKey: "teacherId", as: "teacher" });

  // ---- Subject → ELKPD (worksheet per subject) ----
  Subject.hasMany(ELKPD, { foreignKey: "subjectId", as: "eLKPDs" });
  ELKPD.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });

  // ---- DiagnosticTest → TestQuestionPackage → TestQuestion ----
  DiagnosticTest.hasMany(TestQuestionPackage, { foreignKey: "diagnosticTestId", as: "packages" });
  TestQuestionPackage.belongsTo(DiagnosticTest, { foreignKey: "diagnosticTestId", as: "diagnosticTest" });

  TestQuestionPackage.hasMany(TestQuestion, { foreignKey: "testPackageId", as: "questions" });
  TestQuestion.belongsTo(TestQuestionPackage, { foreignKey: "testPackageId", as: "package" });

  // ---- TestQuestion → TestQuestionDiscussion (1:1) ----
  TestQuestion.hasOne(TestQuestionDiscussion, { foreignKey: "testQuestionId", as: "discussion" });
  TestQuestionDiscussion.belongsTo(TestQuestion, { foreignKey: "testQuestionId", as: "testQuestion" });

  // ---- TestQuestion → TestOption ----
  TestQuestion.hasMany(TestOption, { foreignKey: "testQuestionId", as: "options" });
  TestOption.belongsTo(TestQuestion, { foreignKey: "testQuestionId", as: "testQuestion" });

  // ---- Course → CourseModule ----
  Course.hasMany(CourseModule, { foreignKey: "courseId", as: "modules" });
  CourseModule.belongsTo(Course, { foreignKey: "courseId", as: "course" });

  Subject.hasMany(CourseModule, { foreignKey: "subjectId", as: "courseModules" });
  CourseModule.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });

  DiagnosticTest.hasMany(CourseModule, { foreignKey: "diagnosticTestId", as: "courseModules" });
  CourseModule.belongsTo(DiagnosticTest, { foreignKey: "diagnosticTestId", as: "diagnosticTest" });

  // ---- CourseEnrollment (Student ↔ Course M:N) ----
  Student.hasMany(CourseEnrollment, { foreignKey: "studentId", as: "enrollments" });
  CourseEnrollment.belongsTo(Student, { foreignKey: "studentId", as: "student" });

  Course.hasMany(CourseEnrollment, { foreignKey: "courseId", as: "enrollments" });
  CourseEnrollment.belongsTo(Course, { foreignKey: "courseId", as: "course" });

  Student.belongsToMany(Course, { through: CourseEnrollment, foreignKey: "studentId", as: "courses" });
  Course.belongsToMany(Student, { through: CourseEnrollment, foreignKey: "courseId", as: "students" });

  // ---- ParentStudent (Parent ↔ Student M:N) ----
  Parent.hasMany(ParentStudent, { foreignKey: "parentId", as: "parentStudentLinks" });
  ParentStudent.belongsTo(Parent, { foreignKey: "parentId", as: "parent" });

  Student.hasMany(ParentStudent, { foreignKey: "studentId", as: "parentStudentLinks" });
  ParentStudent.belongsTo(Student, { foreignKey: "studentId", as: "student" });

  Parent.belongsToMany(Student, { through: ParentStudent, foreignKey: "parentId", as: "children" });
  Student.belongsToMany(Parent, { through: ParentStudent, foreignKey: "studentId", as: "parents" });

  // ---- StudentTestAttempt ----
  Student.hasMany(StudentTestAttempt, { foreignKey: "studentId", as: "testAttempts" });
  StudentTestAttempt.belongsTo(Student, { foreignKey: "studentId", as: "student" });

  DiagnosticTest.hasMany(StudentTestAttempt, { foreignKey: "diagnosticTestId", as: "attempts" });
  StudentTestAttempt.belongsTo(DiagnosticTest, { foreignKey: "diagnosticTestId", as: "diagnosticTest" });

  TestQuestionPackage.hasMany(StudentTestAttempt, { foreignKey: "testQuestionPackageId", as: "attempts" });
  StudentTestAttempt.belongsTo(TestQuestionPackage, { foreignKey: "testQuestionPackageId", as: "testQuestionPackage" });

  CourseModule.hasMany(StudentTestAttempt, { foreignKey: "courseModuleId", as: "testAttempts" });
  StudentTestAttempt.belongsTo(CourseModule, { foreignKey: "courseModuleId", as: "courseModule" });

  // ---- StudentTestAnswer ----
  StudentTestAttempt.hasMany(StudentTestAnswer, { foreignKey: "attemptId", as: "answers" });
  StudentTestAnswer.belongsTo(StudentTestAttempt, { foreignKey: "attemptId", as: "attempt" });

  TestQuestion.hasMany(StudentTestAnswer, { foreignKey: "testQuestionId", as: "studentAnswers" });
  StudentTestAnswer.belongsTo(TestQuestion, { foreignKey: "testQuestionId", as: "testQuestion" });

  TestOption.hasMany(StudentTestAnswer, { foreignKey: "selectedOptionId", as: "studentSelections" });
  StudentTestAnswer.belongsTo(TestOption, { foreignKey: "selectedOptionId", as: "selectedOption" });

  // ---- StudentELKPDSubmission (siswa submit E-LKPD, guru beri nilai) ----
  Student.hasMany(StudentELKPDSubmission, { foreignKey: "studentId", as: "eLKPDSubmissions" });
  StudentELKPDSubmission.belongsTo(Student, { foreignKey: "studentId", as: "student" });

  ELKPD.hasMany(StudentELKPDSubmission, { foreignKey: "eLKPDId", as: "submissions" });
  StudentELKPDSubmission.belongsTo(ELKPD, { foreignKey: "eLKPDId", as: "eLKPD" });

  CourseModule.hasMany(StudentELKPDSubmission, { foreignKey: "courseModuleId", as: "eLKPDSubmissions" });
  StudentELKPDSubmission.belongsTo(CourseModule, { foreignKey: "courseModuleId", as: "courseModule" });

  Teacher.hasMany(StudentELKPDSubmission, { foreignKey: "gradedBy", as: "gradedSubmissions" });
  StudentELKPDSubmission.belongsTo(Teacher, { foreignKey: "gradedBy", as: "grader" });

  // ---- StudentModuleProgress (track progress baca file, video, E-LKPD per course module) ----
  Student.hasMany(StudentModuleProgress, { foreignKey: "studentId", as: "moduleProgress" });
  StudentModuleProgress.belongsTo(Student, { foreignKey: "studentId", as: "student" });

  CourseModule.hasMany(StudentModuleProgress, { foreignKey: "courseModuleId", as: "studentProgress" });
  StudentModuleProgress.belongsTo(CourseModule, { foreignKey: "courseModuleId", as: "courseModule" });
};

// Call setup immediately
setupAssociations();

export {
  User,
  Student,
  Teacher,
  Parent,
  SystemRole,
  SystemUserRole,
  RefreshToken,
  MagicLinkToken,
  Course,
  Subject,
  ELKPD,
  DiagnosticTest,
  TestQuestionPackage,
  TestQuestion,
  TestQuestionDiscussion,
  TestOption,
  NotificationType,
  Notification,
  CourseModule,
  CourseEnrollment,
  ParentStudent,
  StudentTestAttempt,
  StudentTestAnswer,
  StudentELKPDSubmission,
  StudentModuleProgress,
};
