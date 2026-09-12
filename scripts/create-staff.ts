// Creates a staff account from the server's shell, so the first admin never needs a setup page.
//   npm run staff:create nume@primaria.md admin
//   npm run staff:create -- --email=nume@primaria.md --role=admin   (bash)
// PowerShell drops the "--", so npm keeps --email for itself and hands it over as
// npm_config_email. All three forms are read.
// The password is asked for without echo, or read from the first line of stdin when piped.
import { parseArgs } from "node:util";
import sql from "@/lib/db";
import { hashPassword, validateNewPassword } from "@/lib/auth/password";
import { audit } from "@/lib/auth/audit";

function askHidden(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    let value = "";

    const done = (err?: Error) => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write("\n");
      if (err) reject(err);
      else resolve(value);
    };
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") return done();
        if (ch === "") return done(new Error("Anulat."));
        if (ch === "" || ch === "\b") value = [...value].slice(0, -1).join("");
        else value += ch;
      }
    };

    process.stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.on("data", onData);
    stdin.resume();
  });
}

// PowerShell can put a byte order mark in front of piped text, which would end up in the hash.
async function readPiped() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data.replace(/^﻿/, "").split(/\r?\n/)[0] ?? "";
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { email: { type: "string" }, role: { type: "string" } },
  });
  const email = (values.email ?? positionals[0] ?? process.env.npm_config_email ?? "").trim().toLowerCase();
  const role = values.role ?? positionals[1] ?? process.env.npm_config_role ?? "admin";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (role !== "admin" && role !== "operator")) {
    console.error("Folosire: npm run staff:create nume@primaria.md admin|operator");
    process.exitCode = 1;
    return;
  }

  const [existing] = await sql`select id from staff_users where lower(email) = ${email}`;
  if (existing) {
    console.error("Există deja un cont cu acest email.");
    process.exitCode = 1;
    return;
  }

  let password: string;
  if (process.stdin.isTTY) {
    password = await askHidden("Parola: ");
    if ((await askHidden("Repetă parola: ")) !== password) {
      console.error("Parolele nu coincid.");
      process.exitCode = 1;
      return;
    }
  } else {
    password = await readPiped();
  }

  const problem = await validateNewPassword(password, email);
  if (problem) {
    console.error(problem);
    process.exitCode = 1;
    return;
  }

  const [user] = await sql`
    insert into staff_users (email, password_hash, role)
    values (${email}, ${await hashPassword(password)}, ${role})
    returning id
  `;
  await audit({
    action: "staff.bootstrap",
    status: "success",
    targetType: "staff_user",
    targetId: user.id,
    client: { ip: null, userAgent: "cli" },
    details: { email, role },
  });
  console.log(`Cont creat pentru ${email} (${role}). Se poate autentifica la /login.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
