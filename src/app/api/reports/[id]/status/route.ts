import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { statusInput } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  const parsed = statusInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "status invalid" }, { status: 400 });
  }

  const result = await sql`
    update reports
    set status = ${parsed.data.status}
    where id = ${params.id}
    returning id
  `;

  if (result.length === 0) {
    return NextResponse.json({ error: "sesizare inexistentă" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
