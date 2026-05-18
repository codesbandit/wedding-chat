"use client";

import { useState, useEffect, FormEvent } from "react";
import AdminShell from "@/components/admin/AdminShell";

interface AiModel {
  id: number;
  label: string;
  model_id: string;
  priority: number;
  enabled: boolean;
  created_at: string;
}

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

function AddModelModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [label, setLabel] = useState("");
  const [modelId, setModelId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, model_id: modelId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError((data as { error?: string }).error ?? "Gagal menyimpan");
        return;
      }
      onSave();
    } catch {
      setError("Terjadi kesalahan jaringan");
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
          maxWidth: "480px",
          fontFamily: "var(--font-mono), monospace",
        }}
      >
        <h2 style={{ color: "var(--ink)", fontSize: "14px", fontWeight: 600, margin: "0 0 20px" }}>
          Tambah Model AI
        </h2>

        <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 0 20px", lineHeight: 1.6 }}>
          Cari model di{" "}
          <a
            href="https://openrouter.ai/models"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent, #007aff)" }}
          >
            openrouter.ai/models
          </a>{" "}
          dan salin Model ID-nya (contoh:{" "}
          <code style={{ background: "var(--surface-card)", padding: "1px 5px", borderRadius: "3px" }}>
            mistralai/mistral-7b-instruct:free
          </code>
          ).
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={baseLabel}>Nama Tampilan</label>
            <input
              style={baseInput}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Mistral 7B (Free)"
              required
            />
          </div>
          <div>
            <label style={baseLabel}>Model ID (OpenRouter)</label>
            <input
              style={baseInput}
              value={modelId}
              onChange={(e) => setModelId(e.target.value.trim())}
              placeholder="mistralai/mistral-7b-instruct:free"
              required
            />
          </div>

          {error && <p style={{ color: "#c0392b", fontSize: "12px", margin: 0 }}>{error}</p>}

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
              disabled={loading || !label || !modelId}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: "4px",
                background: "var(--surface-dark)",
                color: "#fdfcfc",
                fontSize: "12px",
                fontFamily: "inherit",
                cursor: loading || !label || !modelId ? "not-allowed" : "pointer",
                opacity: loading || !label || !modelId ? 0.5 : 1,
              }}
            >
              {loading ? "Menyimpan…" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ModelsPage() {
  const [models, setModels] = useState<AiModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [moving, setMoving] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/models");
    if (res.ok) setModels(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleEnabled(model: AiModel) {
    setToggling(model.id);
    await fetch(`/api/admin/models/${model.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !model.enabled }),
    });
    await load();
    setToggling(null);
  }

  async function deleteModel(model: AiModel) {
    if (!confirm(`Hapus model "${model.label}"?`)) return;
    setDeleting(model.id);
    const res = await fetch(`/api/admin/models/${model.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert((data as { error?: string }).error ?? "Gagal menghapus");
    }
    await load();
    setDeleting(null);
  }

  async function moveModel(model: AiModel, dir: "up" | "down") {
    const sorted = [...models].sort((a, b) => a.priority - b.priority);
    const idx = sorted.findIndex((m) => m.id === model.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    setMoving(model.id);
    const other = sorted[swapIdx];
    // Swap priorities
    await Promise.all([
      fetch(`/api/admin/models/${model.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: other.priority }),
      }),
      fetch(`/api/admin/models/${other.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: model.priority }),
      }),
    ]);
    await load();
    setMoving(null);
  }

  const sorted = [...models].sort((a, b) => a.priority - b.priority);

  return (
    <AdminShell>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1 style={{ color: "var(--ink)", fontSize: "18px", fontWeight: 600, margin: 0 }}>
            Model AI
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "4px" }}>
            Model dicoba berurutan dari atas ke bawah — fallback otomatis jika gagal
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
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
          + Tambah Model
        </button>
      </div>

      {/* Info banner */}
      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--hairline)",
          borderRadius: "6px",
          padding: "12px 16px",
          marginBottom: "20px",
          fontSize: "12px",
          color: "var(--muted)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "var(--ink)" }}>Cara kerja fallback:</strong> Saat tamu mengirim pesan,
        sistem mencoba model pertama. Jika gagal (timeout / error / jawaban kosong), sistem otomatis
        mencoba model berikutnya. Urutan bisa diubah dengan tombol ↑↓.
        Cache model diperbarui setiap 60 detik.
      </div>

      {/* Model list */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
          Memuat…
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
          Belum ada model. Tambah model pertama.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {sorted.map((m, i) => (
            <div
              key={m.id}
              style={{
                background: m.enabled ? "var(--surface-card)" : "var(--surface-soft)",
                border: "1px solid var(--hairline)",
                borderRadius: "6px",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                opacity: m.enabled ? 1 : 0.55,
              }}
            >
              {/* Priority badge */}
              <div
                style={{
                  minWidth: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: m.enabled ? "var(--surface-dark)" : "var(--hairline-strong)",
                  color: "#fdfcfc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                {i + 1}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: "var(--ink)",
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono), monospace",
                  }}
                >
                  {m.label}
                </div>
                <div
                  style={{
                    color: "var(--dim)",
                    fontSize: "11px",
                    marginTop: "2px",
                    fontFamily: "var(--font-mono), monospace",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.model_id}
                </div>
              </div>

              {/* Status tag */}
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: m.enabled ? "#2d7a2d" : "#9a9898",
                  background: m.enabled ? "rgba(45,122,45,0.1)" : "rgba(154,152,152,0.1)",
                  border: `1px solid ${m.enabled ? "rgba(45,122,45,0.3)" : "rgba(154,152,152,0.3)"}`,
                  borderRadius: "3px",
                  padding: "2px 8px",
                  whiteSpace: "nowrap",
                  fontFamily: "var(--font-mono), monospace",
                }}
              >
                {m.enabled ? "Aktif" : "Nonaktif"}
              </span>

              {/* Actions */}
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <button
                  onClick={() => moveModel(m, "up")}
                  disabled={i === 0 || moving === m.id}
                  title="Naikan prioritas"
                  style={{
                    width: "28px",
                    height: "28px",
                    border: "1px solid var(--hairline)",
                    borderRadius: "3px",
                    background: "transparent",
                    color: i === 0 ? "var(--dim)" : "var(--ink)",
                    cursor: i === 0 ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveModel(m, "down")}
                  disabled={i === sorted.length - 1 || moving === m.id}
                  title="Turunkan prioritas"
                  style={{
                    width: "28px",
                    height: "28px",
                    border: "1px solid var(--hairline)",
                    borderRadius: "3px",
                    background: "transparent",
                    color: i === sorted.length - 1 ? "var(--dim)" : "var(--ink)",
                    cursor: i === sorted.length - 1 ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ↓
                </button>
                <button
                  onClick={() => toggleEnabled(m)}
                  disabled={toggling === m.id}
                  style={{
                    padding: "4px 10px",
                    border: "1px solid var(--hairline)",
                    borderRadius: "3px",
                    background: "transparent",
                    color: "var(--ink)",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono), monospace",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.enabled ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button
                  onClick={() => deleteModel(m)}
                  disabled={deleting === m.id}
                  style={{
                    padding: "4px 10px",
                    border: "1px solid rgba(192,57,43,0.3)",
                    borderRadius: "3px",
                    background: "transparent",
                    color: "#c0392b",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono), monospace",
                    cursor: "pointer",
                  }}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddModelModal
          onClose={() => setShowAdd(false)}
          onSave={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
    </AdminShell>
  );
}
