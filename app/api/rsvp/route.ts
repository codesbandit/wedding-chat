import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { slug, attendance_status, pax } = body as Record<string, unknown>;

  if (typeof slug !== "string" || slug.length > 120) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  if (attendance_status !== "ATTENDING" && attendance_status !== "NOT_ATTENDING") {
    return NextResponse.json({ error: "Invalid attendance_status" }, { status: 400 });
  }

  const parsedPax = typeof pax === "number" ? Math.min(Math.max(Math.floor(pax), 0), 99) : 0;

  const updated = await prisma.guest.update({
    where: { slug },
    data: {
      attendance_status: attendance_status as "ATTENDING" | "NOT_ATTENDING",
      pax: parsedPax,
    },
    select: { id: true, attendance_status: true, pax: true },
  });

  return NextResponse.json(updated);
}
