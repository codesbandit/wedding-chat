import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const wishes = await prisma.wish.findMany({
    orderBy: { created_at: "desc" },
    include: {
      guest: { select: { guest_name: true, slug: true } },
    },
  });
  return NextResponse.json(wishes);
}
