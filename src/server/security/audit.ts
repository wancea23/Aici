import "server-only";
import type { JSONValue } from "postgres";
import sql from "@/server/db/owner";
import type { ClientInfo } from "@/server/http/request";

type AuditEntry = {
  action: string;
  status: "success" | "failure";
  actorId?: string | null;
  targetType?: string;
  targetId?: string | null;
  client?: ClientInfo;
  details?: Record<string, unknown>;
};

// A failed log write is reported but never blocks the action itself.
export async function audit(entry: AuditEntry) {
  try {
    await sql`
      insert into staff_audit_log (actor_id, action, target_type, target_id, status, ip, user_agent, details)
      values (
        ${entry.actorId ?? null}, ${entry.action}, ${entry.targetType ?? null}, ${entry.targetId ?? null},
        ${entry.status}, ${entry.client?.ip ?? null}, ${entry.client?.userAgent ?? null},
        ${sql.json((entry.details ?? {}) as JSONValue)}
      )
    `;
  } catch (err) {
    console.error("audit write failed", entry.action, err);
  }
}
