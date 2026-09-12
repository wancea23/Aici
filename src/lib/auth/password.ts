import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { availableParallelism } from "node:os";
import { hash, parseOptions, verify } from "@node-rs/argon2";
import { authEnv } from "@/lib/auth/env";

export const MIN_LENGTH = 15;
export const MAX_LENGTH = 128;

// Argon2id with the OWASP minimum. Algorithm is a const enum the library can't
// export under isolatedModules, so 2 is Argon2id written out.
const ARGON = { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 } as const;

export function normalizePassword(password: string) {
  return password.normalize("NFKC");
}

// Local rules only. Returns a message for the user, or null when the password is fine.
export function checkPasswordRules(password: string, email?: string): string | null {
  const pw = normalizePassword(password);
  const length = [...pw].length;
  if (length < MIN_LENGTH) return `Parola trebuie să aibă cel puțin ${MIN_LENGTH} caractere.`;
  if (length > MAX_LENGTH) return `Parola poate avea cel mult ${MAX_LENGTH} caractere.`;
  if (/^(.)\1*$/su.test(pw)) return "Parola nu poate fi un singur caracter repetat.";

  const local = email?.split("@")[0]?.toLowerCase() ?? "";
  if (local.length >= 3 && pw.toLowerCase().includes(local)) {
    return "Parola nu poate conține adresa de email.";
  }
  return null;
}

// Have I Been Pwned range API. Only the first five hex characters of the SHA-1 leave
// the server, and padding hides how many matches came back. If the check can't run,
// the password is refused rather than let through unchecked.
export async function isBreached(password: string): Promise<boolean> {
  const sha1 = createHash("sha1").update(normalizePassword(password)).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { "Add-Padding": "true", "User-Agent": "aici-staff-auth" },
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HIBP answered ${res.status}`);

  for (const line of (await res.text()).split("\n")) {
    const [hashSuffix, count] = line.trim().split(":");
    if (hashSuffix === suffix && Number(count) > 0) return true;
  }
  return false;
}

export async function validateNewPassword(password: string, email?: string): Promise<string | null> {
  const ruleError = checkPasswordRules(password, email);
  if (ruleError) return ruleError;
  try {
    if (await isBreached(password)) {
      return "Parola apare în scurgeri de date publice. Alege alta.";
    }
  } catch (err) {
    console.error("breach check failed", err);
    return "Nu am putut verifica parola acum. Încearcă din nou peste un minut.";
  }
  return null;
}

// The pepper lives in .env, not in the database, so a stolen table alone can't be cracked offline.
// Base64 because the library's verify() only takes text, while hash() also takes raw bytes.
function peppered(password: string) {
  const key = Buffer.from(authEnv().STAFF_PASSWORD_PEPPER, "hex");
  return createHmac("sha256", key).update(normalizePassword(password)).digest("base64");
}

// Each hash takes about 19 MB and some CPU, so only a few run at once.
const slots = Math.max(1, availableParallelism() - 1);
let running = 0;
const waiting: (() => void)[] = [];

async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (running >= slots) await new Promise<void>((resolve) => waiting.push(resolve));
  running++;
  try {
    return await task();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

export function hashPassword(password: string) {
  return limited(() => hash(peppered(password), ARGON));
}

// A malformed stored hash counts as a wrong password instead of a crash.
export function verifyPassword(passwordHash: string, password: string) {
  return limited(async () => {
    try {
      return await verify(passwordHash, peppered(password));
    } catch {
      return false;
    }
  });
}

// True when the stored hash was made with older settings and should be redone after login.
export function needsRehash(passwordHash: string) {
  try {
    const o = parseOptions(passwordHash);
    return (
      o.memoryCost !== ARGON.memoryCost ||
      o.timeCost !== ARGON.timeCost ||
      o.parallelism !== ARGON.parallelism
    );
  } catch {
    return true;
  }
}

// Unknown emails still pay for one verification, so response time doesn't tell
// an attacker which addresses have an account.
let dummyHash: Promise<string> | null = null;

export async function burnPasswordCheck(password: string) {
  dummyHash ??= hash(randomBytes(32), ARGON);
  await verifyPassword(await dummyHash, password);
  return false;
}
