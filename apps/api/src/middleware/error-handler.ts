import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error | any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError || err.statusCode) {
    res.status(err.statusCode || 500).json({
      error: {
        message: err.message,
        code: err.code || "INTERNAL_ERROR",
      },
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: {
      message: "Internal server error: " + (err?.message || String(err)),
      code: "INTERNAL_ERROR",
      stack: err?.stack,
    },
  });
}
