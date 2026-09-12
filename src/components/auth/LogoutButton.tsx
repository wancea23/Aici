"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/components/auth/api";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await sendJson("/api/auth/logout");
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className={className ?? "text-sm text-slate-500 hover:text-slate-800"}
    >
      Ieși
    </button>
  );
}
