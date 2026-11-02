/**
 * Central place for JWT secrets.
 *
 * In development we fall back to a fixed dev secret (with a warning) so the
 * project runs straight after cloning. In production (NODE_ENV=production)
 * missing secrets are a hard error instead of a silent, guessable default.
 */
const isProduction = process.env.NODE_ENV === "production";

const DEV_USER_SECRET = "nova_dev_only_user_secret_change_me";
const DEV_ADMIN_SECRET = "nova_dev_only_admin_secret_change_me";

let warned = false;

function warnOnce(name) {
  if (!warned) {
    console.warn(
      `[security] ${name} is not set — using a development-only fallback. Set it in backend/.env before deploying.`
    );
    warned = true;
  }
}

function getUserSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (isProduction) throw new Error("JWT_SECRET must be set in production");
  warnOnce("JWT_SECRET");
  return DEV_USER_SECRET;
}

function getAdminSecret() {
  if (process.env.ADMIN_SECRET) return process.env.ADMIN_SECRET;
  if (process.env.JWT_SECRET) return `${process.env.JWT_SECRET}::admin`;
  if (isProduction) throw new Error("ADMIN_SECRET must be set in production");
  warnOnce("ADMIN_SECRET");
  return DEV_ADMIN_SECRET;
}

module.exports = { getUserSecret, getAdminSecret, isProduction };
