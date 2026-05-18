import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

interface BulkEntry {
  guest_name: string;
  category: string;
}

interface BulkResult {
  guest_name: string;
  slug: string;
  status: "created" | "skipped";
  reason?: string;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { guests } = body as { guests?: unknown };
  if (!Array.isArray(guests) || guests.length === 0) {
    return NextResponse.json({ error: "Array guests wajib diisi" }, { status: 400 });
  }
  if (guests.length > 200) {
    return NextResponse.json({ error: "Maksimal 200 tamu sekaligus" }, { status: 400 });
  }

  const validCategories = ["FAMILY", "FRIEND", "COLLEAGUE", "TECH"];
  const results: BulkResult[] = [];

  for (const entry of guests as BulkEntry[]) {
    const name = typeof entry.guest_name === "string" ? entry.guest_name.trim() : "";
    if (!name) {
      results.push({ guest_name: "", slug: "", status: "skipped", reason: "Nama kosong" });
      continue;
    }

    const cat =
      typeof entry.category === "string" && validCategories.includes(entry.category.toUpperCase())
        ? entry.category.toUpperCase()
        : "FRIEND";

    let slug = toSlug(name);

    // Make slug unique
    const existing = await prisma.guest.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    try {
      await prisma.guest.create({
        data: {
          guest_name: name,
          slug,
          category: cat as "FAMILY" | "FRIEND" | "COLLEAGUE" | "TECH",
        },
      });
      results.push({ guest_name: name, slug, status: "created" });
    } catch {
      results.push({ guest_name: name, slug, status: "skipped", reason: "Gagal disimpan" });
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  return NextResponse.json({ created, skipped, results }, { status: 201 });
}
