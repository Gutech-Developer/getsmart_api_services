import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export const verifyInternalApiKey = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const clientKey = req.headers["x-internal-api-key"] as string;
    const serverKey = process.env.INTERNAL_API_SECRET;

    if (!clientKey) {
      res.status(401).json({
        status: 401,
        message: "Missing internal API key",
      });
      return;
    }

    if (!serverKey) {
      throw new Error("INTERNAL_API_SECRET is not defined");
    }

    const clientBuffer = Buffer.from(clientKey);
    const serverBuffer = Buffer.from(serverKey);

    // 🛡️ Prevent length mismatch crash
    if (clientBuffer.length !== serverBuffer.length) {
      res.status(403).json({
        status: 403,
        message: "Invalid internal API key",
      });
      return;
    }

    const isMatch = crypto.timingSafeEqual(clientBuffer, serverBuffer);

    if (!isMatch) {
      res.status(403).json({
        status: 403,
        message: "Invalid internal API key",
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Internal API authentication error",
    });
  }
};
