"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/components/auth/api";

export default function LogoutButton({
  className,
  endpoint = "/api/auth/logout",
  to = "/login",
}: {
  className?: string;
  endpoint?: string;
  to?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await sendJson(endpoint);
    router.push(to);
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
