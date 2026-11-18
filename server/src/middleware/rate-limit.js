import rateLimit from 'express-rate-limit';

// Rate limiter for authentication endpoints: max 10 requests per minute per IP.
// Protects against brute-force password guessing and registration spam.
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // limit each IP to 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        statusCode: 429,
        message: 'Too many requests, please try again later',
      },
    });
  },
});
