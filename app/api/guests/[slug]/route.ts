import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug || typeof slug !== "string" || slug.length > 120) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const guest = await prisma.guest.findUnique({
    where: { slug },
    select: { id: true, guest_name: true, category: true, attendance_status: true },
  });

  if (!guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  return NextResponse.json(guest);
}
