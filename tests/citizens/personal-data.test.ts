import { test } from "node:test";
import assert from "node:assert/strict";

// Fixed secrets for the tests, set before any module reads them.
process.env.STAFF_PASSWORD_PEPPER = "11".repeat(32);
process.env.DATA_ENCRYPTION_KEY = "22".repeat(32);
process.env.ALTCHA_HMAC_KEY = "33".repeat(32);
process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/aici";

const load = {
  confirm: () => import("../../src/features/citizens/confirm-word"),
  crypto: () => import("../../src/server/security/crypto"),
  data: () => import("../../src/features/citizens/personal-data"),
};

const REPORT = "11111111-2222-3333-4444-555555555555";
const EVENT = "66666666-7777-8888-9999-000000000000";

async function row(over: Record<string, unknown> = {}) {
  const { encryptText } = await load.crypto();
  return {
    id: REPORT,
    category: "groapa",
    description: encryptText("Groapă lângă bloc", `report:${REPORT}:description`),
    location: encryptText("47.01234,28.86789", `report:${REPORT}:location`),
    status: "in_lucru",
    created_at: "2026-09-17T08:00:00.000Z",
    duplicate_of: null,
    public_lat: 47.012,
    public_lng: 28.868,
    has_photo: true,
    events: [
      {
        id: EVENT,
        status: "in_lucru",
        previous: "nou",
        note: encryptText("Am trimis echipa.", `event:${EVENT}:note`),
        at: "2026-09-17T09:00:00.000Z",
      },
    ],
    ...over,
  };
}

test("the confirmation word takes both spellings, nothing else", async () => {
  const { confirmMatches } = await load.confirm();
  assert.ok(confirmMatches("STERGE"));
  assert.ok(confirmMatches("ȘTERGE"));
  assert.ok(confirmMatches("  sterge "));
  assert.ok(!confirmMatches("sterg"));
  assert.ok(!confirmMatches("sterge contul"));
  assert.ok(!confirmMatches(""));
});

test("an exported report carries the decrypted text and both points", async () => {
  const { shapeReport } = await load.data();
  const out = shapeReport(await row());

  assert.equal(out.description, "Groapă lângă bloc");
  assert.deepEqual(out.exact_location, { lat: 47.01234, lng: 28.86789 });
  assert.deepEqual(out.public_location, { lat: 47.012, lng: 28.868 });
  assert.equal(out.photo, `/api/media/${REPORT}`);
  assert.equal(out.history[0].message, "Am trimis echipa.");
  assert.equal(out.history[0].previous, "nou");
});

test("a report without a photo carries no link to one", async () => {
  const { shapeReport } = await load.data();
  const out = shapeReport(await row({ has_photo: false }));
  assert.equal(out.photo, null);
});

test("an old report saved before encryption still exports", async () => {
  const { shapeReport } = await load.data();
  const out = shapeReport(await row({ description: "text vechi", location: null, events: [] }));

  assert.equal(out.description, "text vechi");
  assert.equal(out.exact_location, null);
  assert.deepEqual(out.history, []);
});

test("a value encrypted for another report does not decrypt into this one", async () => {
  const { encryptText } = await load.crypto();
  const { shapeReport } = await load.data();
  const stolen = encryptText("47.5,28.5", "report:99999999-9999-9999-9999-999999999999:location");

  const out = shapeReport(await row({ location: stolen }));
  assert.equal(out.exact_location, null);
});
