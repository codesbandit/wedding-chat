"use client";

import { useRouter, usePathname } from "next/navigation";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  const navItems = [
    { href: "/admin/guests", label: "Tamu" },
    { href: "/admin/wishes", label: "Ucapan" },
    { href: "/admin/models", label: "Model AI" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--canvas)",
        fontFamily: "var(--font-mono), monospace",
      }}
    >
      {/* Top nav */}
      <nav
        style={{
          borderBottom: "1px solid var(--hairline)",
          background: "var(--surface-soft)",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "52px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span
            style={{
              color: "var(--ink)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => router.push("/admin/guests")}
          >
            🌸 Admin
          </span>
          <div style={{ display: "flex", gap: "2px" }}>
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: "4px",
                    border: "none",
                    background: active ? "var(--surface-card)" : "transparent",
                    color: active ? "var(--ink)" : "var(--muted)",
                    fontSize: "12px",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    fontWeight: active ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "5px 12px",
            border: "1px solid var(--hairline)",
            borderRadius: "4px",
            background: "transparent",
            color: "var(--muted)",
            fontSize: "11px",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Keluar
        </button>
      </nav>

      <main
        style={{
          padding: "28px 24px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
