import nodemailer from "nodemailer";

export function konfiguracjaSmtp(env = process.env) {
  const port = Number(env.SMTP_PORT || 587);
  return /** @type {import("nodemailer").SMTPTransportOptions} */ ({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}

export function nadawca(env = process.env) {
  return env.SMTP_FROM || env.SMTP_USER;
}

export function utworzTransportSmtp(env = process.env) {
  const port = Number(env.SMTP_PORT || 587);
  if (
    !env.SMTP_HOST ||
    !env.SMTP_USER ||
    !env.SMTP_PASS ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error("Brak poprawnej konfiguracji SMTP.");
  }
  return nodemailer.createTransport(konfiguracjaSmtp(env));
}
