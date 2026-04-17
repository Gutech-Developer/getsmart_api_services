import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit, { Options } from "express-rate-limit";

import authRouter from "./routes/AuthRouter";
import diagnosticTestRouter from "./routes/DiagnosticTestRouter";
import { verifyInternalApiKey } from "./middleware/apikey";

import "./models";
import SubjectRouter from "./routes/SubjectRouter";
import CourseRouter from "./routes/CourseRouter";
import CourseEnrollmentRouter from "./routes/CourseEnrollmentRouter";

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.config();
    this.middlewares();
    this.routes();
  }

  private config(): void {
    this.app.set("trust proxy", 1);
  }

  private createLimiter(
    windowMinutes: number,
    maxRequests: number,
    message = "Too many requests, please try again later.",
  ) {
    return rateLimit({
      windowMs: windowMinutes * 60 * 1000,
      max: maxRequests,

      standardHeaders: true,
      legacyHeaders: false,

      message: {
        status: 429,
        message,
      },

      keyGenerator: (req) => req.ip,
    } as Partial<Options>);
  }

  private middlewares(): void {
    this.app.use(helmet());

    this.app.use(
      cors({
        origin:
          process.env.NODE_ENV === "development"
            ? "*"
            : ["https://yourdomain.com"],
        credentials: true,
      }),
    );

    this.app.use(hpp());

    this.app.use(express.json({ limit: "10kb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10kb" }));

    this.app.use("/", verifyInternalApiKey);

    this.app.use("/api", this.createLimiter(15, 100));

    this.app.use(
      "/api/auth/login",
      this.createLimiter(10, 10, "Terlalu banyak percobaan login. Coba lagi nanti."),
    );

    this.app.use(
      "/api/auth/register",
      this.createLimiter(15, 5, "Terlalu banyak percobaan registrasi. Coba lagi nanti."),
    );
  }

  private routes(): void {
    this.app.get("/", (req: Request, res: Response) => {
      res.json({
        message: "GetSmart API",
        timestamp: new Date().toISOString(),
      });
    });

    this.app.use("/api/auth", authRouter);
    this.app.use("/api/diagnostic-tests", diagnosticTestRouter);
    this.app.use("/api/subjects", SubjectRouter);
    this.app.use("/api/courses", CourseRouter);
    this.app.use("/api/course-enrollments", CourseEnrollmentRouter);
  }
}

export default new App().app;
