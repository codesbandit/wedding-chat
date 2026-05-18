import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ── Simple in-memory model cache (60s TTL) ───────────────────────────────────
let modelCache: { id: string; label: string }[] = [];
let cacheExpiry = 0;

async function getActiveModels(): Promise<{ id: string; label: string }[]> {
  if (Date.now() < cacheExpiry && modelCache.length > 0) return modelCache;
  const rows = await prisma.aiModel.findMany({
    where: { enabled: true },
    orderBy: { priority: "asc" },
    select: { model_id: true, label: true },
  });
  modelCache = rows.map((r: { model_id: string; label: string }) => ({ id: r.model_id, label: r.label }));
  cacheExpiry = Date.now() + 60_000;
  return modelCache;
}

// ── System prompt ─────────────────────────────────────────────────────────────
function buildSystemPrompt(guestName: string): string {
  return `Kamu adalah Wedding Assistant untuk pernikahan Rhesi & Shiddiq. Kamu berbicara dalam Bahasa Indonesia yang hangat dan ramah.

## Konteks Pernikahan

**Mempelai Wanita**: Nenden Rhesi Latifatul Karimah, S.Sos (dipanggil Rhesi)
Putri pertama dari Aa Sanusi (Alm.) dan Nur Laelasari Herawati

**Mempelai Pria**: Muhammad Shiddiq Fitriyansyah (dipanggil Shiddiq)
Putra pertama dari Muhammad Sabir Kamil, SE dan Yuningsih, S.Pd

**Tanggal**: Senin, 1 Juni 2026

**Lokasi**: Ponyo Resto & Wedding
Jl. Raya Bandung - Garut No. KM. 35, RT.4/RW.07, Bandung, 40215

**Jadwal Acara**:
- Akad Nikah: 08.00 WIB (Dress Code: Formal — Abu / Cream)
- Resepsi Pernikahan: 11.00 WIB – selesai (Dress Code: Formal — Abu / Cream)

**Amplop Digital**:
Bank BSI, No. Rekening: 7199921708, a.n. Nenden Rhesi Latifatul Karimah

**Pengiriman Hadiah**:
Penerima: Shiddiq & Nenden
No. HP: 083190208249
Alamat: 3/15 Cluster Rasamala Bumi Panyawangan Real Estate, Cimekar, Cileunyi, Bandung, Jawa Barat 40623

**Tamu yang kamu layani saat ini**: ${guestName}

## Instruksi

- Jawab dengan ramah, singkat, dan hangat — maksimal 3-4 kalimat per respons
- Jika ditanya tentang hal teknis pernikahan (lokasi, jam, dress code, RSVP, hadiah, amplop), gunakan data di atas
- Jika ditanya sesuatu yang tidak relevan, arahkan kembali ke topik pernikahan dengan sopan
- Jangan menyebut dirimu sebagai AI/LLM — kamu adalah Wedding Assistant
- Gunakan emoji secukupnya agar terasa hangat, tapi jangan berlebihan
- JANGAN tampilkan tag <think>, chain of thought, atau reasoning internal apapun`;
}

// ── ThinkFilter: strips <think>...</think> blocks from streaming output ────────
class ThinkFilter {
  private pending = "";
  private inThink = false;
  private readonly OPEN = "<think>";
  private readonly CLOSE = "</think>";

  feed(chunk: string): string {
    this.pending += chunk;
    let out = "";

    while (this.pending.length > 0) {
      if (!this.inThink) {
        const idx = this.pending.indexOf(this.OPEN);
        if (idx === -1) {
          // No opening tag ahead — emit everything except last 6 chars (could be partial tag)
          const safe = Math.max(0, this.pending.length - 6);
          out += this.pending.slice(0, safe);
          this.pending = this.pending.slice(safe);
          break;
        }
        // Emit everything before <think>, then enter think mode
        out += this.pending.slice(0, idx);
        this.pending = this.pending.slice(idx + this.OPEN.length);
        this.inThink = true;
      } else {
        const idx = this.pending.indexOf(this.CLOSE);
        if (idx === -1) {
          // Still inside think — discard all but last 8 chars (partial </think>)
          const safe = Math.max(0, this.pending.length - 8);
          this.pending = this.pending.slice(safe);
          break;
        }
        // Exit think mode, discard up through </think>
        this.pending = this.pending.slice(idx + this.CLOSE.length);
        this.inThink = false;
      }
    }
    return out;
  }

  finalize(): string {
    const out = this.inThink ? "" : this.pending;
    this.pending = "";
    return out;
  }
}

// ── Request body type ────────────────────────────────────────────────────────
interface ChatBody {
  message: string;
  guestName: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

// ── Attempt to open a streaming connection to one model ───────────────────────
async function tryModelStream(
  modelId: string,
  messages: object[],
  apiKey: string
): Promise<Response> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
      "X-Title": "Wedding Assistant - Rhesi & Shiddiq",
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      max_tokens: 300,
      temperature: 0.7,
      stream: true,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${res.status}: ${errText.slice(0, 200)}`);
  }
  return res;
}

// ── POST /api/chat — returns SSE stream ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.startsWith("GANTI_")) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY belum dikonfigurasi." }, { status: 503 });
    }

    const body: ChatBody = await req.json();
    const { message, guestName, history = [] } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
    }
    if (message.length > 1000) {
      return NextResponse.json({ error: "Pesan terlalu panjang." }, { status: 400 });
    }

    const activeModels = await getActiveModels();
    if (activeModels.length === 0) {
      return NextResponse.json({ error: "Tidak ada model AI yang aktif." }, { status: 503 });
    }

    const messages = [
      { role: "system", content: buildSystemPrompt(guestName || "Tamu") },
      ...history.slice(-6),
      { role: "user", content: message.trim() },
    ];

    // Try each model until one successfully connects
    let upstreamRes: Response | null = null;
    let usedModel = "";
    let lastError = "";

    for (const model of activeModels) {
      try {
        upstreamRes = await tryModelStream(model.id, messages, apiKey);
        usedModel = model.label;
        console.log(`[chat] streaming via ${model.label}`);
        break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(`[chat] ✗ ${model.label} failed, trying next — ${lastError}`);
        cacheExpiry = 0;
      }
    }

    if (!upstreamRes?.body) {
      console.error("[chat] All models failed:", lastError);
      return NextResponse.json(
        { error: "Semua model AI sedang tidak tersedia. Coba beberapa saat lagi." },
        { status: 502 }
      );
    }

    // Pipe the upstream SSE through the ThinkFilter and re-emit as SSE
    const enc = new TextEncoder();
    const upstreamBody = upstreamRes.body;

    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstreamBody.getReader();
        const dec = new TextDecoder();
        const filter = new ThinkFilter();
        let lineBuf = "";

        const emit = (chunk: string) => {
          if (chunk) controller.enqueue(enc.encode(`data: ${JSON.stringify({ c: chunk })}\n\n`));
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            lineBuf += dec.decode(value, { stream: true });
            const lines = lineBuf.split("\n");
            lineBuf = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                emit(filter.finalize());
                controller.enqueue(enc.encode("data: [DONE]\n\n"));
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const token: string = parsed.choices?.[0]?.delta?.content ?? "";
                if (token) emit(filter.feed(token));
              } catch {
                // malformed chunk — skip
              }
            }
          }
          // Stream ended without [DONE]
          emit(filter.finalize());
          controller.enqueue(enc.encode("data: [DONE]\n\n"));
        } catch (err) {
          console.error("[chat] stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Model": usedModel,
      },
    });
  } catch (err) {
    console.error("[chat] Unexpected error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan. Silakan coba lagi." }, { status: 500 });
  }
}
