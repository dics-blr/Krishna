import type { NextFunction, Request, Response } from 'express';

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  message?: string;
}

interface RateBucket {
  count: number;
  resetAtMs: number;
}

const MAX_TRACKED_KEYS = 10_000;

function extractClientKey(req: Request): string {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return ip.trim() || 'unknown';
}

export function createRateLimiter(options: RateLimiterOptions) {
  const windowMs = Math.max(1000, options.windowMs);
  const maxRequests = Math.max(1, options.maxRequests);
  const message =
    options.message || 'Too many requests. Please wait before trying again.';
  const buckets = new Map<string, RateBucket>();

  const pruneExpired = (now: number) => {
    if (buckets.size <= MAX_TRACKED_KEYS) return;
    for (const [k, bucket] of buckets) {
      if (bucket.resetAtMs <= now) {
        buckets.delete(k);
      }
    }
    while (buckets.size > MAX_TRACKED_KEYS) {
      const oldestKey = buckets.keys().next().value;
      if (!oldestKey) break;
      buckets.delete(oldestKey);
    }
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    pruneExpired(now);

    const key = `${options.keyPrefix}:${extractClientKey(req)}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAtMs <= now) {
      bucket = { count: 0, resetAtMs: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, maxRequests - bucket.count);
    const resetSeconds = Math.ceil((bucket.resetAtMs - now) / 1000);

    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAtMs / 1000)));

    if (bucket.count > maxRequests) {
      res.setHeader('Retry-After', String(Math.max(1, resetSeconds)));
      res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: Math.max(1, resetSeconds),
      });
      return;
    }

    next();
  };
}
