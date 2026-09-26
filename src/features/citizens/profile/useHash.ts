"use client";

import { useSyncExternalStore } from "react";

// The profile's sections (reports, messages) live in the URL hash, so the sidebar and the
// list agree on which one is open without sharing state, and the back button works.
function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export type ProfileSection = "reports" | "messages";

const sectionHashes: Record<string, ProfileSection> = { "#sesizari": "reports", "#mesaje": "messages" };

// Other anchors on the page, like #setari or #fisa, only scroll: the open section stays as it was.
let lastSection: ProfileSection = "reports";

function currentSection() {
  lastSection = sectionHashes[window.location.hash] ?? lastSection;
  return lastSection;
}

// The server never sees the hash, so it always renders the reports list first.
export default function useSection() {
  return useSyncExternalStore(subscribe, currentSection, () => "reports" as const);
}
