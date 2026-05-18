import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

// ── System prompt: inject all wedding context ────────────────────────────────
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

// ── Strip <think>...</think> reasoning tags from model output ────────────────
function stripThinkTags(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim();
}

// ── Request body type ────────────────────────────────────────────────────────
interface ChatBody {
  message: string;
  guestName: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

// ── POST /api/chat ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.startsWith("GANTI_")) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY belum dikonfigurasi." },
        { status: 503 }
      );
    }

    const body: ChatBody = await req.json();
    const { message, guestName, history = [] } = body;

    // Basic validation
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
    }
    if (message.length > 1000) {
      return NextResponse.json({ error: "Pesan terlalu panjang." }, { status: 400 });
    }

    const messages = [
      { role: "system", content: buildSystemPrompt(guestName || "Tamu") },
      // Include limited history for context (last 6 turns)
      ...history.slice(-6),
      { role: "user", content: message.trim() },
    ];

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
        "X-Title": "Wedding Assistant - Rhesi & Shiddiq",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(20000), // 20s timeout for free model
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[chat] OpenRouter error:", res.status, errText);
      return NextResponse.json(
        { error: "AI service tidak tersedia saat ini. Coba beberapa saat lagi." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    const reply = stripThinkTags(raw) || "Maaf, saya tidak bisa menjawab saat ini. Silakan coba lagi.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[chat] Unexpected error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
