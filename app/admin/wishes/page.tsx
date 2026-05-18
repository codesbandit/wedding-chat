"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";

interface Wish {
  id: number;
  message: string;
  created_at: string;
  guest: {
    guest_name: string;
    slug: string;
  };
}

export default function WishesPage() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/wishes")
      .then((r) => r.json())
      .then((data) => {
        setWishes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = wishes.filter(
    (w) =>
      !search ||
      w.guest.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      w.message.toLowerCase().includes(search.toLowerCase())
  );

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <AdminShell>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            color: "var(--ink)",
            fontSize: "18px",
            fontWeight: 600,
            margin: 0,
          }}
        >
          Ucapan & Doa
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "4px" }}>
          {wishes.length} ucapan diterima dari tamu
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "16px" }}>
        <input
          style={{
            padding: "7px 10px",
            background: "var(--canvas)",
            border: "1px solid var(--hairline)",
            borderRadius: "4px",
            color: "var(--ink)",
            fontSize: "12px",
            fontFamily: "var(--font-mono), monospace",
            outline: "none",
            width: "280px",
            maxWidth: "100%",
          }}
          placeholder="Cari nama tamu atau isi ucapan…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div
          style={{
            padding: "60px",
            textAlign: "center",
            color: "var(--muted)",
            fontSize: "13px",
          }}
        >
          Memuat ucapan…
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: "60px",
            textAlign: "center",
            color: "var(--muted)",
            fontSize: "13px",
          }}
        >
          {search ? "Tidak ada ucapan yang cocok" : "Belum ada ucapan"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((w) => (
            <div
              key={w.id}
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--hairline)",
                borderRadius: "6px",
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "10px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    color: "var(--ink)",
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono), monospace",
                  }}
                >
                  {w.guest.guest_name}
                </span>
                <span
                  style={{
                    color: "var(--dim)",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono), monospace",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDate(w.created_at)}
                </span>
              </div>
              <p
                style={{
                  color: "var(--ink)",
                  fontSize: "13px",
                  margin: 0,
                  lineHeight: 1.6,
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                {w.message}
              </p>
            </div>
          ))}
        </div>
      )}

      <p
        style={{
          color: "var(--dim)",
          fontSize: "11px",
          marginTop: "16px",
          textAlign: "right",
          fontFamily: "var(--font-mono), monospace",
        }}
      >
        {filtered.length} dari {wishes.length} ucapan
      </p>
    </AdminShell>
  );
}
