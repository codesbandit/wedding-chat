import { NextRequest, NextResponse } from "next/server";

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { password } = body as Record<string, unknown>;
  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Keyword diperlukan" }, { status: 400 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: "Keyword salah" }, { status: 401 });
  }

  const token = await sha256(adminPassword);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  return res;
}
