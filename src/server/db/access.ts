import "server-only";
import type postgres from "postgres";
import getAppSql from "@/server/db/app";

export type AccessContext = {
  citizenId?: string;
  staff?: boolean;
  publicDetails?: boolean;
};

// Runs fn on the restricted app_data connection (see server/db/app.ts), with the caller's
// identity set as session-local facts the row-level security policies in db/init.sql read:
// app.citizen_id, app.is_staff, app.public_details. set_config's third argument scopes each
// one to this one transaction, so nothing leaks onto a pooled connection's next transaction.
export async function withAccess<T>(
  ctx: AccessContext,
  fn: (tx: postgres.TransactionSql) => Promise<T>
): Promise<T> {
  // begin()'s declared return type is UnwrapPromiseArray<T>, which only differs from T when T
  // itself is an array — never the case for anything this function is used for.
  return getAppSql().begin<T>(async (tx) => {
    if (ctx.citizenId) await tx`select set_config('app.citizen_id', ${ctx.citizenId}, true)`;
    if (ctx.staff) await tx`select set_config('app.is_staff', 'true', true)`;
    if (ctx.publicDetails) await tx`select set_config('app.public_details', 'true', true)`;
    return fn(tx);
  }) as Promise<T>;
}
