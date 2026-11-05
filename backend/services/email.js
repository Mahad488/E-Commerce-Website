/**
 * Transactional email over SMTP (Gmail, Brevo, Resend, Mailgun …) with Nodemailer.
 *
 * Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM in backend/.env.
 * Without SMTP_HOST nothing is sent: in development every email is printed to the
 * terminal (its HTML is saved to backend/.email-previews/ so you can open it), and in
 * production a one-line warning is logged instead (no codes or addresses in the logs).
 *
 * Routes call queueEmail(), which runs after the response has gone out and never throws,
 * so a slow or broken mail server can't hold up a request.
 */
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { isProduction } = require("../config/secrets");

const TEMPLATE_DIR = path.join(__dirname, "..", "emails");
const PREVIEW_DIR = path.join(__dirname, "..", ".email-previews");

function smtpConfig() {
  const host = (process.env.SMTP_HOST || "").trim();
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = (process.env.SMTP_USER || "").trim();
  return {
    host,
    port,
    // Port 465 uses TLS from the start; 587 and 25 upgrade with STARTTLS.
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: user ? { user, pass: process.env.SMTP_PASS || "" } : undefined,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  };
}

function mailFrom() {
  if (process.env.MAIL_FROM) return process.env.MAIL_FROM;
  const user = process.env.SMTP_USER || "";
  return `NOVA <${user.includes("@") ? user : "no-reply@novastore.com"}>`;
}

/** Where links in emails point (the storefront), without a trailing slash. */
function storeUrl() {
  const first = (process.env.STORE_URL || process.env.CLIENT_URL || "").split(",")[0].trim();
  return (first || "http://localhost:5173").replace(/\/+$/, "");
}

function supportEmail() {
  return process.env.SUPPORT_EMAIL || "support@novastore.com";
}

let transporter = null;
function getTransporter() {
  if (!transporter) transporter = nodemailer.createTransport(smtpConfig());
  return transporter;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** "a***@gmail.com" — enough to tell emails apart in logs without storing the address. */
function maskEmail(email) {
  const [name, domain] = String(email).split("@");
  return domain ? `${name.slice(0, 1)}***@${domain}` : "***";
}

const templateCache = new Map();
function readTemplate(file) {
  // Re-read in development so template edits show up without a restart.
  if (isProduction && templateCache.has(file)) return templateCache.get(file);
  const source = fs.readFileSync(path.join(TEMPLATE_DIR, file), "utf8");
  templateCache.set(file, source);
  return source;
}

/**
 * {{name}} is replaced with an escaped value, {{{name}}} with a raw one (for blocks of
 * HTML the senders build themselves from escaped parts). Unknown names become "".
 */
function fill(template, data, escape) {
  return template.replace(/\{\{\{\s*(\w+)\s*\}\}\}|\{\{\s*(\w+)\s*\}\}/g, (_, raw, key) =>
    raw ? String(data[raw] ?? "") : escape(data[key])
  );
}

const plain = (value) => String(value ?? "");

/** Renders emails/<name>.html and .txt inside the shared _layout files. */
function renderEmail(name, data) {
  const shared = { storeUrl: storeUrl(), supportEmail: supportEmail(), year: new Date().getFullYear(), ...data };
  const html = fill(readTemplate("_layout.html"), { ...shared, content: fill(readTemplate(`${name}.html`), shared, escapeHtml) }, escapeHtml);
  const text = fill(readTemplate("_layout.txt"), { ...shared, content: fill(readTemplate(`${name}.txt`), shared, plain) }, plain);
  return { html, text: text.replace(/\n{3,}/g, "\n\n").trim() + "\n" };
}

/** Saves the HTML for opening in a browser and returns its path relative to the project. */
function savePreview(template, html) {
  try {
    fs.mkdirSync(PREVIEW_DIR, { recursive: true });
    const file = path.join(PREVIEW_DIR, `${template}.html`);
    fs.writeFileSync(file, html);
    return path.relative(path.join(__dirname, "..", ".."), file);
  } catch {
    return ""; // previews are a convenience; never let them break a request
  }
}

function printPreview({ to, subject, text, savedTo }) {
  const rule = "─".repeat(64);
  const lines = [
    `┌${rule}`,
    "│ EMAIL PREVIEW (SMTP is not configured, so this was not sent)",
    `│ To:      ${to}`,
    `│ Subject: ${subject}`,
    ...(savedTo ? [`│ HTML:    ${savedTo}`] : []),
    `├${rule}`,
    ...text.trimEnd().split("\n").map((line) => `│ ${line}`),
    `└${rule}`,
  ];
  console.log(lines.join("\n"));
}

async function sendViaBrevo({ to, subject, html, text }) {
  const apiKey = (process.env.BREVO_API_KEY || "").trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || "muhammadmahad2021@gmail.com";
  const senderName = process.env.MAIL_FROM_NAME || "NOVA Store";

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || `Brevo API HTTP ${res.status}`);
  }
  return { delivered: true, messageId: body.messageId || "brevo-sent" };
}

async function sendViaResend({ to, subject, html, text }) {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const from = process.env.RESEND_FROM || "NOVA Store <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || `Resend API HTTP ${res.status}`);
  }
  return { delivered: true, messageId: body.id || "resend-sent" };
}

/**
 * Renders and sends one email. Resolves to { delivered: true, messageId } when delivered
 * via Brevo API, Resend API, or SMTP, or { delivered: false } when unconfigured.
 */
async function sendEmail({ to, subject, template, data = {} }) {
  const { html, text } = renderEmail(template, { subject, ...data });

  // 1. Brevo REST API (HTTPS Port 443 — works smoothly on Render Free Tier)
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await sendViaBrevo({ to, subject, html, text });
      console.log(`[email:brevo] Sent "${template}" to ${maskEmail(to)}`);
      return res;
    } catch (err) {
      console.error(`[email:brevo] Failed to send "${template}" to ${maskEmail(to)}:`, err.message);
      return { delivered: false, error: err.message };
    }
  }

  // 2. Resend REST API (HTTPS Port 443 — works smoothly on Render Free Tier)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await sendViaResend({ to, subject, html, text });
      console.log(`[email:resend] Sent "${template}" to ${maskEmail(to)}`);
      return res;
    } catch (err) {
      console.error(`[email:resend] Failed to send "${template}" to ${maskEmail(to)}:`, err.message);
      return { delivered: false, error: err.message };
    }
  }

  // 3. Fallback to Nodemailer SMTP
  if (!smtpConfig()) {
    if (isProduction) {
      console.warn(`[email] No email service configured (BREVO_API_KEY, RESEND_API_KEY or SMTP_HOST); "${template}" to ${maskEmail(to)} was not sent.`);
    } else {
      printPreview({ to, subject, text, savedTo: savePreview(template, html) });
    }
    return { delivered: false };
  }

  try {
    const info = await getTransporter().sendMail({
      from: mailFrom(),
      replyTo: supportEmail(),
      to,
      subject,
      html,
      text,
    });
    console.log(`[email] Sent "${template}" to ${maskEmail(to)} (${info.messageId})`);
    return { delivered: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[email] SMTP send failed: ${err.message}`);
    return { delivered: false, error: err.message };
  }
}

/**
 * Runs an email task after the current request has been answered. Failures are logged,
 * never thrown, so they can't break the request that triggered them.
 */
function queueEmail(label, task) {
  setImmediate(() => {
    Promise.resolve()
      .then(task)
      .catch((error) => console.error(`[email] Could not send ${label}:`, error.message));
  });
}

/** Logs at startup whether email will be sent, and checks the SMTP login if it will. */
async function checkEmailTransport() {
  const config = smtpConfig();
  if (!config) {
    const message = isProduction
      ? "[email] SMTP_HOST is not set: customers will NOT receive order, status, password-reset or contact emails."
      : "[email] SMTP is not configured: emails are printed to this terminal instead of being sent.";
    (isProduction ? console.warn : console.log)(message);
    return false;
  }
  try {
    await getTransporter().verify();
    console.log(`[email] SMTP ready on ${config.host}:${config.port} (from ${mailFrom()})`);
    return true;
  } catch (error) {
    console.error(`[email] SMTP login to ${config.host}:${config.port} failed: ${error.message}`);
    return false;
  }
}

module.exports = {
  sendEmail,
  queueEmail,
  checkEmailTransport,
  renderEmail,
  escapeHtml,
  storeUrl,
  supportEmail,
  getTransporter,
  smtpConfig,
};
