import { NextRequest, NextResponse } from "next/server";

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page and login API without auth
  if (pathname === "/admin" || pathname.startsWith("/api/admin/login")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const session = req.cookies.get("admin_session")?.value;
    const password = process.env.ADMIN_PASSWORD ?? "";

    if (!password) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Admin tidak dikonfigurasi" }, { status: 503 });
      }
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    const expectedHash = await sha256(password);

    if (session !== expectedHash) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
