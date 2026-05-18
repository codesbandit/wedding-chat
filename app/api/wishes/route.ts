import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { guest_id, message } = body as Record<string, unknown>;

  if (typeof guest_id !== "number" || !Number.isInteger(guest_id) || guest_id < 1) {
    return NextResponse.json({ error: "Invalid guest_id" }, { status: 400 });
  }

  if (typeof message !== "string" || message.trim().length === 0 || message.length > 1000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const wish = await prisma.wish.create({
    data: {
      guest_id,
      message: message.trim(),
    },
    select: { id: true },
  });

  return NextResponse.json({ id: wish.id });
}
