"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide";
import Icon from "@/ui/Icon";
import { sendJson } from "@/ui/api";

// withIcon: the icon sits inside the button, so it is clickable too
export default function LogoutButton({
  className,
  endpoint = "/api/auth/logout",
  to = "/login",
  withIcon = false,
}: {
  className?: string;
  endpoint?: string;
  to?: string;
  withIcon?: boolean;
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
      className={className ?? "font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface"}
    >
      {withIcon && <Icon node={LogOut} className="h-4 w-4" />}
      Ieși
    </button>
  );
}
