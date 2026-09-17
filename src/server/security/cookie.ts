// Chrome refuses __Host- cookies on http://localhost, so the prefix is only used in production.
// Kept apart from session.ts so the proxy can read it without pulling in the database.
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-aici_session" : "aici_session";

// Citizens have their own cookie, so a staff session and a citizen one never mix.
export const CITIZEN_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-aici_citizen" : "aici_citizen";
