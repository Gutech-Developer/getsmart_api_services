import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { z } from "zod";

export const validate = (schema: z.ZodSchema) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: 400,
          message: "Validation Error",
          errors: error.issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
        return;
      }
      res.status(500).json({
        status: 500,
        message: "Internal server error during validation",
      });
      return;
    }
  };
};
