import "server-only";
import nodemailer from "nodemailer";
import { mailEnv } from "@/lib/env";

export type Mail = { to: string; subject: string; text: string };

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

// Without SMTP_HOST, development prints each message in the terminal. Production refuses.
export function canSendMail() {
  return Boolean(mailEnv().SMTP_HOST) || process.env.NODE_ENV !== "production";
}

// Links in emails start from APP_URL and never from the Host header of the request,
// or a forged header could mail someone a working token that points to another site.
export function appUrl(req: Request): string | null {
  const { APP_URL } = mailEnv();
  if (APP_URL) return APP_URL.replace(/\/+$/, "");
  return process.env.NODE_ENV === "production" ? null : new URL(req.url).origin;
}

export async function sendMail(mail: Mail) {
  const env = mailEnv();
  if (!env.SMTP_HOST) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP_HOST is not set");
    console.log(`\n[mail] to ${mail.to}: ${mail.subject}\n\n${mail.text}\n`);
    return;
  }
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // port 465 starts with TLS, any other port has to switch to it with STARTTLS or give up
    secure: env.SMTP_PORT === 465,
    requireTLS: true,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? "" } : undefined,
  });
  await transport.sendMail({ from: env.MAIL_FROM ?? env.SMTP_USER, ...mail });
}

export function signupMail(email: string, link: string): Mail {
  return {
    to: email,
    subject: "Confirmă contul tău Aici",
    text: [
      "Bună ziua,",
      "",
      `Cineva, probabil tu, a creat un cont Aici cu adresa ${email}.`,
      "Ca să îl confirmi, deschide linkul de mai jos:",
      "",
      link,
      "",
      "Linkul e valabil 24 de ore și merge o singură dată.",
      "Dacă nu ai creat tu contul, nu deschide linkul. Fără confirmare contul nu se creează.",
      "",
      "Echipa Aici",
    ].join("\n"),
  };
}

export function existingAccountMail(email: string, base: string): Mail {
  return {
    to: email,
    subject: "Ai deja un cont Aici",
    text: [
      "Bună ziua,",
      "",
      `Cineva a încercat să creeze un cont Aici cu adresa ${email}, dar ai deja un cont confirmat cu ea.`,
      `Te poți conecta aici: ${base}/conectare`,
      "",
      "Dacă nu ai fost tu, ignoră mesajul. Contul tău nu s-a schimbat.",
      "",
      "Echipa Aici",
    ].join("\n"),
  };
}

export type StatusUpdate = {
  category: string;
  // the day of the report, already formatted
  reportedOn: string;
  status: string;
  statusChanged: boolean;
  hasNote: boolean;
};

// Says only that something changed. The message from the city hall stays behind the login,
// so a mailbox never holds more about the report than its category and day.
export function statusMail(email: string, update: StatusUpdate, base: string): Mail {
  const report = `„${update.category}” din ${update.reportedOn}`;
  const news = update.statusChanged
    ? [`Sesizarea ta ${report} are un status nou: ${update.status}.`]
    : [`Primăria ți-a scris despre sesizarea ta ${report}.`];
  if (update.statusChanged && update.hasNote) news.push("Primăria ți-a lăsat și un mesaj.");

  return {
    to: email,
    subject: update.statusChanged ? `Sesizarea ta: ${update.status}` : "Ai un mesaj despre sesizarea ta",
    text: [
      "Bună ziua,",
      "",
      ...news,
      `Vezi detaliile în contul tău: ${base}/profil`,
      "",
      "Primești acest email pentru că ai trimis sesizarea din contul tău Aici.",
      "",
      "Echipa Aici",
    ].join("\n"),
  };
}
