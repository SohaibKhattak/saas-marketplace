import type { Request, Response, NextFunction } from "express";

const requests = new Map<string, { count: number; resetAt: number }>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requests) {
    if (now > entry.resetAt) {
      requests.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export function rateLimit(windowMs = 60_000, maxRequests = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const entry = requests.get(key);

    if (!entry || now > entry.resetAt) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      res.status(429).json({
        error: {
          message: "Too many requests, please try again later",
          code: "RATE_LIMITED",
        },
      });
      return;
    }

    entry.count++;
    next();
  };
}

// Stricter rate limits for auth endpoints
export const authRateLimit = {
  login: rateLimit(15 * 60 * 1000, 5),        // 5 attempts per 15 minutes
  register: rateLimit(60 * 60 * 1000, 3),      // 3 registrations per hour
  forgotPassword: rateLimit(60 * 60 * 1000, 3), // 3 reset requests per hour
};
