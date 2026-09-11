const attempts = new Map();

function createSimpleRateLimit({ windowMs = 60_000, max = 20 } = {}) {
  return function rateLimit(req, res, next) {
    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || 'unknown';

    const record = attempts.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }

    record.count += 1;
    attempts.set(key, record);

    if (record.count > max) {
      return res.status(429).json({ message: 'Too many requests. Please try again soon.' });
    }

    return next();
  };
}

module.exports = { createSimpleRateLimit };
