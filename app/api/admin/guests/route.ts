import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const guests = await prisma.guest.findMany({
    orderBy: { created_at: "desc" },
    include: { _count: { select: { wishes: true } } },
  });
  return NextResponse.json(guests);
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { guest_name, category, slug: customSlug } = body as Record<string, unknown>;

  if (typeof guest_name !== "string" || guest_name.trim().length === 0) {
    return NextResponse.json({ error: "Nama tamu wajib diisi" }, { status: 400 });
  }

  const validCategories = ["FAMILY", "FRIEND", "COLLEAGUE", "TECH"];
  const cat =
    typeof category === "string" && validCategories.includes(category) ? category : "FRIEND";

  let slug =
    typeof customSlug === "string" && customSlug.trim()
      ? customSlug
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "")
      : toSlug(guest_name.trim());

  // Ensure slug is unique
  const existing = await prisma.guest.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const guest = await prisma.guest.create({
    data: {
      guest_name: guest_name.trim(),
      slug,
      category: cat as "FAMILY" | "FRIEND" | "COLLEAGUE" | "TECH",
    },
    include: { _count: { select: { wishes: true } } },
  });

  return NextResponse.json(guest, { status: 201 });
}
