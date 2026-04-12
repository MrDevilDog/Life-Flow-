/**
 * Rate Limiting Middleware for Security
 * Prevents brute force attacks and spam
 */

interface RateLimitEntry {
  count: number;
  lastReset: number;
  blockedUntil?: number;
}

class RateLimiter {
  private static instance: RateLimiter;
  private store: Map<string, RateLimitEntry> = new Map();

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - IP address, email, or phone
   * @param maxRequests - Maximum requests allowed in time window
   * @param windowMs - Time window in milliseconds
   * @param blockDurationMs - How long to block if limit exceeded
   */
  checkLimit(
    identifier: string,
    maxRequests: number = 5,
    windowMs: number = 5 * 60 * 1000, // 5 minutes
    blockDurationMs: number = 15 * 60 * 1000 // 15 minutes
  ): { allowed: boolean; remaining: number; resetTime: number; blockedUntil?: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // Check if currently blocked
    if (entry?.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockedUntil,
        blockedUntil: entry.blockedUntil
      };
    }

    // Create new entry or reset if window expired
    if (!entry || now - entry.lastReset > windowMs) {
      const newEntry: RateLimitEntry = {
        count: 1,
        lastReset: now
      };
      this.store.set(identifier, newEntry);
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs
      };
    }

    // Increment count
    entry.count++;
    this.store.set(identifier, entry);

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      // Block for specified duration
      entry.blockedUntil = now + blockDurationMs;
      this.store.set(identifier, entry);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockedUntil,
        blockedUntil: entry.blockedUntil
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.lastReset + windowMs
    };
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      // Delete entries that are no longer blocked and have expired
      if (!entry.blockedUntil && now - entry.lastReset > 24 * 60 * 60 * 1000) { // 24 hours
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.store.delete(key));
  }
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  forgotPassword: {
    maxRequests: 3, // 3 requests per 5 minutes
    windowMs: 5 * 60 * 1000,
    blockDurationMs: 15 * 60 * 1000, // 15 minutes block
    message: "Too many password reset attempts. Please try again later."
  },
  otpVerification: {
    maxRequests: 10, // 10 attempts per 5 minutes
    windowMs: 5 * 60 * 1000,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes block
    message: "Too many verification attempts. Please try again later."
  },
  passwordReset: {
    maxRequests: 3, // 3 resets per hour
    windowMs: 60 * 60 * 1000,
    blockDurationMs: 60 * 60 * 1000, // 1 hour block
    message: "Too many password reset attempts. Please try again later."
  }
} as const;

/**
 * Rate limiting middleware for API routes
 */
export function createRateLimiter(config: typeof RATE_LIMITS[keyof typeof RATE_LIMITS]) {
  const limiter = RateLimiter.getInstance();

  return (identifier: string): { allowed: boolean; error?: string; headers?: Record<string, string> } => {
    const result = limiter.checkLimit(
      identifier,
      config.maxRequests,
      config.windowMs,
      config.blockDurationMs
    );

    if (!result.allowed) {
      return {
        allowed: false,
        error: config.message,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.blockedUntil! - Date.now()) / 1000).toString()
        }
      };
    }

    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString()
      }
    };
  };
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: Request): string {
  // Try various headers for client IP
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const clientIP = req.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (clientIP) {
    return clientIP;
  }
  
  // Fallback to a default (in production, you'd want proper IP detection)
  return 'unknown';
}

// Cleanup expired entries every hour
setInterval(() => {
  RateLimiter.getInstance().cleanup();
}, 60 * 60 * 1000);
