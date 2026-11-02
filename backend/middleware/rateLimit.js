/**
 * Tiny in-memory rate limiter (no extra dependency).
 * Good enough for a single server; use a shared store (e.g. Redis) if you scale out.
 */
function rateLimit({ windowMs = 15 * 60 * 1000, max = 20, name = "default", message } = {}) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs).unref();

  return function rateLimitMiddleware(req, res, next) {
    const key = `${name}:${req.ip}`;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        success: false,
        message: message || `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
      });
    }
    return next();
  };
}

module.exports = rateLimit;
