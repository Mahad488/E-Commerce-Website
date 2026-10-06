const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authorization = req.headers.authorization;
  const [scheme, token] =
    typeof authorization === "string" ? authorization.split(" ") : [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
    return res.status(500).json({
      success: false,
      message: "Authentication is not configured",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (
      typeof payload !== "object" ||
      payload === null ||
      !Number.isSafeInteger(payload.id) ||
      payload.id <= 0
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    req.user = { id: payload.id };
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}

module.exports = verifyToken;
