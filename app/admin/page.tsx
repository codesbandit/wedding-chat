"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: keyword }),
      });
      if (res.ok) {
        router.push("/admin/guests");
      } else {
        const data = await res.json();
        setError((data as { error?: string }).error ?? "Login gagal");
      }
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--canvas)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono), monospace",
      }}
    >
      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--hairline)",
          borderRadius: "8px",
          padding: "40px 48px",
          width: "100%",
          maxWidth: "380px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🌸</div>
          <h1
            style={{
              color: "var(--ink)",
              fontSize: "15px",
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Admin Panel
          </h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: "12px",
              marginTop: "6px",
              margin: "6px 0 0",
            }}
          >
            Rhesi &amp; Shiddiq — 1 Juni 2026
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              fontSize: "10px",
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "8px",
            }}
          >
            Keyword
          </label>
          <input
            type="password"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Masukkan keyword admin"
            autoFocus
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "var(--canvas)",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "4px",
              color: "var(--ink)",
              fontSize: "13px",
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          {error && (
            <p
              style={{
                color: "#c0392b",
                fontSize: "12px",
                marginTop: "8px",
                margin: "8px 0 0",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !keyword}
            style={{
              width: "100%",
              marginTop: "16px",
              padding: "10px",
              background: "var(--surface-dark)",
              color: "#fdfcfc",
              border: "none",
              borderRadius: "4px",
              fontSize: "13px",
              fontFamily: "inherit",
              cursor: loading || !keyword ? "not-allowed" : "pointer",
              opacity: loading || !keyword ? 0.5 : 1,
              letterSpacing: "0.01em",
            }}
          >
            {loading ? "Memverifikasi…" : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
