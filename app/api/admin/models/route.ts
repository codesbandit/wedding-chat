import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const models = await prisma.aiModel.findMany({ orderBy: { priority: "asc" } });
  return NextResponse.json(models);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { label, model_id } = body as Record<string, unknown>;
  if (typeof label !== "string" || !label.trim()) {
    return NextResponse.json({ error: "Label wajib diisi" }, { status: 400 });
  }
  if (typeof model_id !== "string" || !model_id.trim()) {
    return NextResponse.json({ error: "Model ID wajib diisi" }, { status: 400 });
  }

  // Put new model at the end (highest priority number)
  const last = await prisma.aiModel.findFirst({ orderBy: { priority: "desc" } });
  const priority = (last?.priority ?? -1) + 1;

  const model = await prisma.aiModel.create({
    data: { label: label.trim(), model_id: model_id.trim(), priority },
  });
  return NextResponse.json(model, { status: 201 });
}
