import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const modelId = parseInt(id, 10);
  if (isNaN(modelId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { label, model_id, enabled, priority } = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (typeof label === "string" && label.trim()) data.label = label.trim();
  if (typeof model_id === "string" && model_id.trim()) data.model_id = model_id.trim();
  if (typeof enabled === "boolean") data.enabled = enabled;
  if (typeof priority === "number" && Number.isInteger(priority) && priority >= 0)
    data.priority = priority;

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "Tidak ada field yang diupdate" }, { status: 400 });

  const updated = await prisma.aiModel.update({ where: { id: modelId }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const modelId = parseInt(id, 10);
  if (isNaN(modelId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // Prevent deleting the last enabled model
  const enabledCount = await prisma.aiModel.count({ where: { enabled: true } });
  const target = await prisma.aiModel.findUnique({ where: { id: modelId } });
  if (target?.enabled && enabledCount <= 1) {
    return NextResponse.json(
      { error: "Harus ada minimal 1 model aktif" },
      { status: 400 }
    );
  }

  await prisma.aiModel.delete({ where: { id: modelId } });
  return NextResponse.json({ ok: true });
}
