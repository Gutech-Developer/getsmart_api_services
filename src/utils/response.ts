import { Response } from "express";

interface ApiResponse<T = undefined> {
  success: boolean;
  status: number;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    status: statusCode,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: Array<{ field: string; message: string }>,
): Response => {
  const response: ApiResponse = {
    success: false,
    status: statusCode,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
