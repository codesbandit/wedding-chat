"use client";

import { useState, useEffect, FormEvent, useMemo } from "react";
import AdminShell from "@/components/admin/AdminShell";

type Category = "FAMILY" | "FRIEND" | "COLLEAGUE" | "TECH";
type AttStatus = "PENDING" | "ATTENDING" | "NOT_ATTENDING";

interface Guest {
  id: number;
  guest_name: string;
  slug: string;
  category: Category;
  attendance_status: AttStatus;
  pax: number;
  visit_count: number;
  last_visited_at: string | null;
  created_at: string;
  _count: { wishes: number };
}

const CATEGORY_LABEL: Record<Category, string> = {
  FAMILY: "Keluarga",
  FRIEND: "Teman",
  COLLEAGUE: "Kolega",
  TECH: "Tech",
};

const STATUS_LABEL: Record<AttStatus, string> = {
  PENDING: "Belum",
  ATTENDING: "Hadir",
  NOT_ATTENDING: "Tidak Hadir",
};

const STATUS_COLOR: Record<AttStatus, string> = {
  PENDING: "#9a9898",
  ATTENDING: "#2d7a2d",
  NOT_ATTENDING: "#c0392b",
};

const baseInput: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "var(--canvas)",
  border: "1px solid var(--hairline-strong)",
  borderRadius: "4px",
  color: "var(--ink)",
  fontSize: "13px",
  fontFamily: "var(--font-mono), monospace",
  outline: "none",
  boxSizing: "border-box",
};

const baseLabel: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "6px",
};

function GuestModal({
  guest,
  onClose,
  onSave,
}: {
  guest: Partial<Guest> | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!guest?.id;
  const [name, setName] = useState(guest?.guest_name ?? "");
  const [slug, setSlug] = useState(guest?.slug ?? "");
  const [category, setCategory] = useState<Category>(guest?.category ?? "FRIEND");
  const [status, setStatus] = useState<AttStatus>(guest?.attendance_status ?? "PENDING");
  const [pax, setPax] = useState(guest?.pax ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate slug from name (only when adding)
  useEffect(() => {
    if (!isEdit && name) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
      );
    }
  }, [name, isEdit]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = isEdit ? `/api/admin/guests/${guest!.id}` : "/api/admin/guests";
      const method = isEdit ? "PATCH" : "POST";
      const body = isEdit
        ? { guest_name: name, category, attendance_status: status, pax }
        : { guest_name: name, slug, category };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError((data as { error?: string }).error ?? "Gagal menyimpan");
        return;
      }
      onSave();
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(32,29,29,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--canvas)",
          border: "1px solid var(--hairline)",
          borderRadius: "8px",
          padding: "28px 32px",
          width: "100%",
          maxWidth: "440px",
          fontFamily: "var(--font-mono), monospace",
        }}
      >
        <h2
          style={{
            color: "var(--ink)",
            fontSize: "14px",
            fontWeight: 600,
            margin: "0 0 24px",
          }}
        >
          {isEdit ? "Edit Tamu" : "Tambah Tamu"}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={baseLabel}>Nama Tamu</label>
            <input
              style={baseInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap tamu"
              required
            />
          </div>

          {!isEdit && (
            <div>
              <label style={baseLabel}>Slug (URL undangan)</label>
              <input
                style={baseInput}
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="nama-tamu"
                required
              />
              <p style={{ color: "var(--dim)", fontSize: "11px", marginTop: "4px" }}>
                Link: /invite/{slug || "…"}
              </p>
            </div>
          )}

          <div>
            <label style={baseLabel}>Kategori</label>
            <select
              style={{ ...baseInput, cursor: "pointer" }}
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              <option value="FRIEND">Teman</option>
              <option value="FAMILY">Keluarga</option>
              <option value="COLLEAGUE">Kolega</option>
              <option value="TECH">Tech</option>
            </select>
          </div>

          {isEdit && (
            <>
              <div>
                <label style={baseLabel}>Status Kehadiran</label>
                <select
                  style={{ ...baseInput, cursor: "pointer" }}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AttStatus)}
                >
                  <option value="PENDING">Belum Konfirmasi</option>
                  <option value="ATTENDING">Hadir</option>
                  <option value="NOT_ATTENDING">Tidak Hadir</option>
                </select>
              </div>
              <div>
                <label style={baseLabel}>Jumlah Tamu (Pax)</label>
                <input
                  style={baseInput}
                  type="number"
                  min={0}
                  max={20}
                  value={pax}
                  onChange={(e) => setPax(parseInt(e.target.value) || 0)}
                />
              </div>
            </>
          )}

          {error && (
            <p style={{ color: "#c0392b", fontSize: "12px", margin: 0 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                border: "1px solid var(--hairline)",
                borderRadius: "4px",
                background: "transparent",
                color: "var(--muted)",
                fontSize: "12px",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !name}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: "4px",
                background: "var(--surface-dark)",
                color: "#fdfcfc",
                fontSize: "12px",
                fontFamily: "inherit",
                cursor: loading || !name ? "not-allowed" : "pointer",
                opacity: loading || !name ? 0.5 : 1,
              }}
            >
              {loading ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const VALID_CATEGORIES = ["FAMILY", "FRIEND", "COLLEAGUE", "TECH"];

interface BulkResult {
  guest_name: string;
  slug: string;
  status: "created" | "skipped";
  reason?: string;
}

interface ParsedRow {
  guest_name: string;
  category: string;
  valid: boolean;
  error?: string;
}

function parseBulkText(text: string): ParsedRow[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|");
      const guest_name = parts[0]?.trim() ?? "";
      const rawCat = parts[1]?.trim().toUpperCase() ?? "FRIEND";
      const category = VALID_CATEGORIES.includes(rawCat) ? rawCat : "FRIEND";
      if (!guest_name) return { guest_name, category, valid: false, error: "Nama kosong" };
      return { guest_name, category, valid: true };
    });
}

function BulkModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [error, setError] = useState("");

  const preview = useMemo(() => parseBulkText(text), [text]);
  const validCount = preview.filter((r) => r.valid).length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (validCount === 0) return;
    setError("");
    setLoading(true);
    try {
      const guests = preview.filter((r) => r.valid).map(({ guest_name, category }) => ({
        guest_name,
        category,
      }));
      const res = await fetch("/api/admin/guests/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Gagal import");
        return;
      }
      setResults((data as { results: BulkResult[] }).results);
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  const isDone = results !== null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(32,29,29,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && (isDone ? onSave() : onClose())}
    >
      <div
        style={{
          background: "var(--canvas)",
          border: "1px solid var(--hairline)",
          borderRadius: "8px",
          padding: "28px 32px",
          width: "100%",
          maxWidth: "540px",
          fontFamily: "var(--font-mono), monospace",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2
          style={{ color: "var(--ink)", fontSize: "14px", fontWeight: 600, margin: "0 0 8px" }}
        >
          Import Masal Tamu
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 0 20px", lineHeight: 1.6 }}>
          Satu tamu per baris. Format: <code style={{ background: "var(--surface-card)", padding: "1px 5px", borderRadius: "3px" }}>NAMA|KATEGORI</code>
          <br />
          Kategori: <code style={{ background: "var(--surface-card)", padding: "1px 5px", borderRadius: "3px" }}>FAMILY</code>{" "}
          <code style={{ background: "var(--surface-card)", padding: "1px 5px", borderRadius: "3px" }}>FRIEND</code>{" "}
          <code style={{ background: "var(--surface-card)", padding: "1px 5px", borderRadius: "3px" }}>COLLEAGUE</code>{" "}
          <code style={{ background: "var(--surface-card)", padding: "1px 5px", borderRadius: "3px" }}>TECH</code>
          {" "}(opsional, default FRIEND)
        </p>

        {!isDone ? (
          <form onSubmit={handleSubmit}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"Reza Pratama|FRIEND\nIbu Siti Rahayu|FAMILY\nBudi Santoso|COLLEAGUE"}
              rows={10}
              style={{
                ...baseInput,
                resize: "vertical",
                minHeight: "180px",
                lineHeight: 1.6,
              }}
            />

            {/* Live preview */}
            {preview.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 8px",
                  }}
                >
                  Preview — {validCount} tamu valid
                </p>
                <div
                  style={{
                    background: "var(--surface-card)",
                    border: "1px solid var(--hairline)",
                    borderRadius: "4px",
                    maxHeight: "160px",
                    overflowY: "auto",
                  }}
                >
                  {preview.map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 10px",
                        borderBottom: i < preview.length - 1 ? "1px solid var(--hairline)" : "none",
                      }}
                    >
                      <span style={{ fontSize: "11px", color: row.valid ? "#2d7a2d" : "#c0392b", minWidth: "14px" }}>
                        {row.valid ? "✓" : "✗"}
                      </span>
                      <span style={{ flex: 1, fontSize: "12px", color: "var(--ink)" }}>
                        {row.guest_name || <em style={{ color: "var(--dim)" }}>kosong</em>}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--muted)",
                          background: "var(--canvas)",
                          border: "1px solid var(--hairline)",
                          borderRadius: "3px",
                          padding: "1px 6px",
                        }}
                      >
                        {row.category}
                      </span>
                      {row.error && (
                        <span style={{ fontSize: "10px", color: "#c0392b" }}>{row.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p style={{ color: "#c0392b", fontSize: "12px", marginTop: "10px" }}>{error}</p>
            )}

            <div
              style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "8px 16px",
                  border: "1px solid var(--hairline)",
                  borderRadius: "4px",
                  background: "transparent",
                  color: "var(--muted)",
                  fontSize: "12px",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || validCount === 0}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  background: "var(--surface-dark)",
                  color: "#fdfcfc",
                  fontSize: "12px",
                  fontFamily: "inherit",
                  cursor: loading || validCount === 0 ? "not-allowed" : "pointer",
                  opacity: loading || validCount === 0 ? 0.5 : 1,
                }}
              >
                {loading ? "Mengimpor…" : `Import ${validCount} Tamu`}
              </button>
            </div>
          </form>
        ) : (
          /* Results view */
          <div>
            <div
              style={{
                display: "flex",
                gap: "16px",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "6px",
                  padding: "12px 20px",
                  flex: 1,
                  textAlign: "center",
                }}
              >
                <div style={{ color: "#2d7a2d", fontSize: "20px", fontWeight: 700 }}>
                  {results.filter((r) => r.status === "created").length}
                </div>
                <div style={{ color: "var(--muted)", fontSize: "11px", marginTop: "2px" }}>Berhasil</div>
              </div>
              <div
                style={{
                  background: "var(--surface-card)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "6px",
                  padding: "12px 20px",
                  flex: 1,
                  textAlign: "center",
                }}
              >
                <div style={{ color: "#c0392b", fontSize: "20px", fontWeight: 700 }}>
                  {results.filter((r) => r.status === "skipped").length}
                </div>
                <div style={{ color: "var(--muted)", fontSize: "11px", marginTop: "2px" }}>Dilewati</div>
              </div>
            </div>

            <div
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--hairline)",
                borderRadius: "4px",
                maxHeight: "240px",
                overflowY: "auto",
                marginBottom: "16px",
              }}
            >
              {results.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 10px",
                    borderBottom: i < results.length - 1 ? "1px solid var(--hairline)" : "none",
                  }}
                >
                  <span style={{ fontSize: "11px", color: r.status === "created" ? "#2d7a2d" : "#c0392b", minWidth: "14px" }}>
                    {r.status === "created" ? "✓" : "✗"}
                  </span>
                  <span style={{ flex: 1, fontSize: "12px", color: "var(--ink)" }}>{r.guest_name}</span>
                  {r.status === "created" && (
                    <span style={{ fontSize: "10px", color: "var(--dim)" }}>/invite/{r.slug}</span>
                  )}
                  {r.reason && (
                    <span style={{ fontSize: "10px", color: "#c0392b" }}>{r.reason}</span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={onSave}
                style={{
                  padding: "8px 20px",
                  border: "none",
                  borderRadius: "4px",
                  background: "var(--surface-dark)",
                  color: "#fdfcfc",
                  fontSize: "12px",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalGuest, setModalGuest] = useState<Partial<Guest> | null | false>(false);
  const [showBulk, setShowBulk] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("ALL");

  async function loadGuests() {
    setLoading(true);
    const res = await fetch("/api/admin/guests");
    if (res.ok) setGuests(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadGuests(); }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/admin/guests/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    setDeleting(false);
    loadGuests();
  }

  function copyLink(guest: Guest) {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? `${window.location.protocol}//${window.location.host}`;
    navigator.clipboard.writeText(`${baseUrl}/invite/${guest.slug}`);
    setCopied(guest.id);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = guests.filter((g) => {
    const matchSearch =
      !search ||
      g.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      g.slug.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "ALL" || g.category === filterCat;
    return matchSearch && matchCat;
  });

  const stats = {
    total: guests.length,
    attending: guests.filter((g) => g.attendance_status === "ATTENDING").length,
    notAttending: guests.filter((g) => g.attendance_status === "NOT_ATTENDING").length,
    pending: guests.filter((g) => g.attendance_status === "PENDING").length,
    pax: guests.filter((g) => g.attendance_status === "ATTENDING").reduce((s, g) => s + g.pax, 0),
    visited: guests.filter((g) => g.visit_count > 0).length,
    notVisited: guests.filter((g) => g.visit_count === 0).length,
    totalVisits: guests.reduce((s, g) => s + g.visit_count, 0),
  };

  return (
    <AdminShell>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1 style={{ color: "var(--ink)", fontSize: "18px", fontWeight: 600, margin: 0 }}>
            Manajemen Tamu
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "4px" }}>
            Kelola daftar undangan pernikahan
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setShowBulk(true)}
            style={{
              padding: "8px 18px",
              background: "var(--surface-card)",
              color: "var(--ink)",
              border: "1px solid var(--hairline)",
              borderRadius: "4px",
              fontSize: "12px",
              fontFamily: "var(--font-mono), monospace",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Import Masal
          </button>
          <button
            onClick={() => setModalGuest({})}
            style={{
              padding: "8px 18px",
              background: "var(--surface-dark)",
              color: "#fdfcfc",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              fontFamily: "var(--font-mono), monospace",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            + Tambah Tamu
          </button>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Total Tamu", value: stats.total, color: "var(--ink)" },
          { label: "Hadir", value: stats.attending, color: "#2d7a2d" },
          { label: "Tidak Hadir", value: stats.notAttending, color: "#c0392b" },
          { label: "Belum Konfirmasi", value: stats.pending, color: "#9a9898" },
          { label: "Total Pax", value: stats.pax, color: "#007aff" },
          { label: "Sudah Buka", value: stats.visited, color: "#b45309" },
          { label: "Belum Buka", value: stats.notVisited, color: "#9a9898" },
          { label: "Total Kunjungan", value: stats.totalVisits, color: "#6366f1" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--surface-card)",
              border: "1px solid var(--hairline)",
              borderRadius: "6px",
              padding: "16px 18px",
            }}
          >
            <div style={{ color: s.color, fontSize: "22px", fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: "var(--muted)", fontSize: "11px", marginTop: "4px" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "16px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
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
            flex: "1",
            minWidth: "180px",
          }}
          placeholder="Cari nama atau slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={{
            padding: "7px 10px",
            background: "var(--canvas)",
            border: "1px solid var(--hairline)",
            borderRadius: "4px",
            color: "var(--ink)",
            fontSize: "12px",
            fontFamily: "var(--font-mono), monospace",
            outline: "none",
            cursor: "pointer",
          }}
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="ALL">Semua Kategori</option>
          <option value="FAMILY">Keluarga</option>
          <option value="FRIEND">Teman</option>
          <option value="COLLEAGUE">Kolega</option>
          <option value="TECH">Tech</option>
        </select>
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--hairline)",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
            Memuat data…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
            {search || filterCat !== "ALL" ? "Tidak ada tamu yang cocok" : "Belum ada tamu"}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
                  {["Nama", "Slug", "Kategori", "Status", "Pax", "Ucapan", "Kunjungan", "Aksi"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: "10px",
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => (
                  <tr
                    key={g.id}
                    style={{
                      borderBottom:
                        i < filtered.length - 1 ? "1px solid var(--hairline)" : "none",
                      background: "transparent",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "var(--ink)",
                        fontSize: "13px",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.guest_name}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "var(--muted)",
                        fontSize: "12px",
                        maxWidth: "160px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.slug}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--muted)" }}>
                      {CATEGORY_LABEL[g.category]}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: STATUS_COLOR[g.attendance_status],
                        }}
                      >
                        {STATUS_LABEL[g.attendance_status]}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "var(--ink)",
                        fontSize: "13px",
                        textAlign: "center",
                      }}
                    >
                      {g.pax}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "var(--muted)",
                        fontSize: "12px",
                        textAlign: "center",
                      }}
                    >
                      {g._count.wishes}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: g.visit_count > 0 ? "#b45309" : "var(--dim)",
                          }}
                        >
                          {g.visit_count > 0 ? `${g.visit_count}×` : "—"}
                        </span>
                        {g.last_visited_at && (
                          <span style={{ fontSize: "10px", color: "var(--dim)", whiteSpace: "nowrap" }}>
                            {new Date(g.last_visited_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <button
                          onClick={() => copyLink(g)}
                          title="Salin link undangan"
                          style={{
                            padding: "4px 8px",
                            border: "1px solid var(--hairline)",
                            borderRadius: "3px",
                            background: "transparent",
                            color: copied === g.id ? "#2d7a2d" : "var(--muted)",
                            fontSize: "11px",
                            fontFamily: "inherit",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {copied === g.id ? "✓ Disalin" : "Salin Link"}
                        </button>
                        <button
                          onClick={() => setModalGuest(g)}
                          style={{
                            padding: "4px 8px",
                            border: "1px solid var(--hairline)",
                            borderRadius: "3px",
                            background: "transparent",
                            color: "var(--ink)",
                            fontSize: "11px",
                            fontFamily: "inherit",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(g)}
                          style={{
                            padding: "4px 8px",
                            border: "1px solid rgba(192,57,43,0.3)",
                            borderRadius: "3px",
                            background: "transparent",
                            color: "#c0392b",
                            fontSize: "11px",
                            fontFamily: "inherit",
                            cursor: "pointer",
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={{ color: "var(--dim)", fontSize: "11px", marginTop: "12px", textAlign: "right" }}>
        {filtered.length} dari {guests.length} tamu
      </p>

      {/* Add/Edit Modal */}
      {modalGuest !== false && (
        <GuestModal
          guest={modalGuest}
          onClose={() => setModalGuest(false)}
          onSave={() => {
            setModalGuest(false);
            loadGuests();
          }}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulk && (
        <BulkModal
          onClose={() => setShowBulk(false)}
          onSave={() => {
            setShowBulk(false);
            loadGuests();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(32,29,29,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "var(--canvas)",
              border: "1px solid var(--hairline)",
              borderRadius: "8px",
              padding: "28px 32px",
              maxWidth: "360px",
              width: "100%",
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            <h2
              style={{ color: "var(--ink)", fontSize: "14px", fontWeight: 600, margin: "0 0 12px" }}
            >
              Hapus Tamu?
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "13px", margin: "0 0 24px" }}>
              <strong style={{ color: "var(--ink)" }}>{deleteTarget.guest_name}</strong> dan semua
              ucapannya akan dihapus permanen.
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: "8px 16px",
                  border: "1px solid var(--hairline)",
                  borderRadius: "4px",
                  background: "transparent",
                  color: "var(--muted)",
                  fontSize: "12px",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  background: "#c0392b",
                  color: "#fff",
                  fontSize: "12px",
                  fontFamily: "inherit",
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? "Menghapus…" : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
