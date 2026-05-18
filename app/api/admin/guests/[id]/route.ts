import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guestId = parseInt(id, 10);
  if (isNaN(guestId) || guestId < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { guest_name, category, attendance_status, pax } = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (typeof guest_name === "string" && guest_name.trim()) {
    data.guest_name = guest_name.trim();
  }

  const validCategories = ["FAMILY", "FRIEND", "COLLEAGUE", "TECH"];
  if (typeof category === "string" && validCategories.includes(category)) {
    data.category = category;
  }

  const validStatuses = ["PENDING", "ATTENDING", "NOT_ATTENDING"];
  if (typeof attendance_status === "string" && validStatuses.includes(attendance_status)) {
    data.attendance_status = attendance_status;
  }

  if (typeof pax === "number" && Number.isInteger(pax) && pax >= 0) {
    data.pax = pax;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang diupdate" }, { status: 400 });
  }

  const guest = await prisma.guest.update({ where: { id: guestId }, data });
  return NextResponse.json(guest);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guestId = parseInt(id, 10);
  if (isNaN(guestId) || guestId < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await prisma.wish.deleteMany({ where: { guest_id: guestId } });
  await prisma.guest.delete({ where: { id: guestId } });
  return NextResponse.json({ ok: true });
}
