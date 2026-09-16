import { test } from "node:test";
import assert from "node:assert/strict";
import { answerDeadline, deadlineText } from "../src/lib/deadline";
import { formatDay } from "../src/lib/format";
import { statusInput } from "../src/lib/validation";

const at = (iso: string) => new Date(iso).getTime();

test("the city hall has 30 calendar days from the day of the report", () => {
  const d = answerDeadline("2026-09-16T11:08:00Z", "nou", at("2026-09-16T20:00:00Z"))!;
  assert.equal(formatDay(d.due), "16.10.2026");
  assert.equal(d.daysLeft, 30);
  assert.equal(answerDeadline("2026-09-16T11:08:00Z", "in_lucru", at("2026-10-16T20:00:00Z"))!.daysLeft, 0);
  assert.equal(answerDeadline("2026-09-16T11:08:00Z", "nou", at("2026-10-19T08:00:00Z"))!.daysLeft, -3);
});

test("days are counted in Chisinau time", () => {
  // 01:30 on 17 September in Chisinau, still the 16th in UTC
  const d = answerDeadline("2026-09-16T22:30:00Z", "nou", at("2026-09-16T22:45:00Z"))!;
  assert.equal(formatDay(d.due), "17.10.2026");
  assert.equal(d.daysLeft, 30);
  // the clocks go back on 25 October, a day is still a day
  const winter = answerDeadline("2026-10-20T09:00:00Z", "nou", at("2026-11-18T09:00:00Z"))!;
  assert.equal(formatDay(winter.due), "19.11.2026");
  assert.equal(winter.daysLeft, 1);
});

test("a resolved or rejected report has no deadline", () => {
  assert.equal(answerDeadline("2026-09-16T11:08:00Z", "rezolvat"), null);
  assert.equal(answerDeadline("2026-09-16T11:08:00Z", "respins"), null);
});

test("deadline wording", () => {
  assert.equal(deadlineText(30), "încă 30 de zile");
  assert.equal(deadlineText(2), "încă 2 zile");
  assert.equal(deadlineText(1), "încă o zi");
  assert.equal(deadlineText(0), "termenul e azi");
  assert.equal(deadlineText(-1), "depășit cu o zi");
  assert.equal(deadlineText(-3), "depășit cu 3 zile");
});

test("a rejection needs a reason, other statuses don't", () => {
  const rejected = statusInput.safeParse({ status: "respins", note: "   " });
  assert.equal(rejected.success, false);
  assert.equal(rejected.error?.issues[0].path[0], "note");

  assert.equal(statusInput.safeParse({ status: "respins", note: "Nu ține de primărie" }).success, true);
  const plain = statusInput.safeParse({ status: "in_lucru" });
  assert.equal(plain.success, true);
  assert.equal(plain.data?.note, "");
  assert.equal(statusInput.safeParse({ status: "in_lucru", note: "x".repeat(1001) }).success, false);
  assert.equal(statusInput.safeParse({ status: "sters" }).success, false);
});

test("the status email points to the account and carries no message", async () => {
  const { statusMail } = await import("../src/lib/mail");
  const update = { category: "Groapă în drum", reportedOn: "16.09.2026", status: "În lucru", statusChanged: true, hasNote: true };
  const mail = statusMail("ion@mail.md", update, "https://aici.example");
  assert.equal(mail.to, "ion@mail.md");
  assert.equal(mail.subject, "Sesizarea ta: În lucru");
  assert.ok(mail.text.includes("https://aici.example/profil"));
  assert.ok(mail.text.includes("are un status nou: În lucru"));
  assert.ok(mail.text.includes("ți-a lăsat și un mesaj"));

  const noteOnly = statusMail("ion@mail.md", { ...update, statusChanged: false }, "https://aici.example");
  assert.equal(noteOnly.subject, "Ai un mesaj despre sesizarea ta");
  assert.ok(!noteOnly.text.includes("status nou"));
});
