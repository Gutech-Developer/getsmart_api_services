import { NextFunction, Request, Response } from "express";
import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { verifyAccessToken } from "../utils/jwt";
import { SystemRoleEnum } from "../types/enums";
import { sendError } from "../utils/response";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      sendError(res, 401, "Unauthorized - Token tidak ditemukan");
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      sendError(res, 401, "Token sudah kedaluwarsa");
      return;
    }

    if (error instanceof JsonWebTokenError) {
      sendError(res, 403, "Token tidak valid");
      return;
    }

    sendError(res, 500, "Authentication error");
  }
};

export const authorize = (...roles: SystemRoleEnum[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, "Unauthorized");
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 403, "Forbidden - Anda tidak memiliki akses ke resource ini");
      return;
    }

    next();
  };
};
