const jwt = require("jsonwebtoken");
const { getUserSecret } = require("../config/secrets");

function readBearer(req) {
  const authorization = req.headers.authorization;
  const [scheme, token] = typeof authorization === "string" ? authorization.split(" ") : [];
  return scheme === "Bearer" && token ? token : null;
}

function decodeUser(token) {
  const payload = jwt.verify(token, getUserSecret());
  if (typeof payload !== "object" || payload === null || !Number.isSafeInteger(payload.id) || payload.id <= 0) {
    return null;
  }
  return { id: payload.id };
}

/**
 * Requires a valid customer JWT and sets req.user = { id }.
 */
function verifyToken(req, res, next) {
  const token = readBearer(req);
  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication token is required" });
  }

  try {
    const user = decodeUser(token);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid authentication token" });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
  }
}

/**
 * Like verifyToken, but lets anonymous requests through (req.user stays undefined).
 */
function optionalToken(req, res, next) {
  const token = readBearer(req);
  if (token) {
    try {
      const user = decodeUser(token);
      if (user) req.user = user;
    } catch {
      // ignore invalid tokens on optional routes
    }
  }
  return next();
}

module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.optionalToken = optionalToken;
