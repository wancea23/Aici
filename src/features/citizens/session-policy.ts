// How long a citizen stays signed in. docs/PRIVACY.md promises the same numbers.
export const IDLE_SEC = 60 * 60;
export const ABSOLUTE_SEC = 30 * 24 * 60 * 60;

// How often the idle timer is pushed forward. Much shorter than IDLE_SEC, so someone
// who keeps using the site is never signed out halfway through a report.
export const REFRESH_SEC = 5 * 60;
