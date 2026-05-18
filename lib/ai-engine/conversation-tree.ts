import { wedding } from "../wedding-config";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardType = "map" | "schedule" | "countdown" | "rsvp-yes-pax" | "wish-input" | "amplop";

export interface QuickPrompt {
  label: string;
  /** ID of the node this prompt navigates to */
  target: string;
}

export interface ConversationNode {
  id: string;
  /** Messages to stream one after another (auto-sequenced with delays) */
  messages: string[];
  /** Inline card to render after messages (optional) */
  card?: CardType;
  /** Clickable quick prompts shown after all messages (optional) */
  prompts?: QuickPrompt[];
  /** If true, the engine waits for explicit user action (RSVP buttons etc.) */
  awaitAction?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ev0 = wedding.events[0]; // Akad
const ev1 = wedding.events[1]; // Resepsi

// ─── Node Tree ────────────────────────────────────────────────────────────────

export const nodes: Record<string, ConversationNode> = {
  // ── Greeting (personalized by host — guestName injected at runtime) ──────
  greeting: {
    id: "greeting",
    messages: [
    //   "Sistem diinisialisasi... ✓",
    //   "Memuat profil tamu... ✓",
      "Wedding Assistant siap. ✓",
    //   "---",
      "Halo, {guestName} 👋",
      `Saya adalah Wedding Assistant milik ${wedding.groom.name} & ${wedding.bride.name}.`,
      "Saya di sini untuk membantu kamu mengetahui semua hal tentang hari spesial kami. ❤️",
    ],
    prompts: [
      { label: "📍 Lokasi Acara", target: "lokasi" },
      { label: "📖 Cerita Kami", target: "cerita" },
      { label: "🗓️ Jadwal Acara", target: "jadwal" },
      { label: "✅ RSVP", target: "rsvp-start" },
      { label: "💌 Kirim Doa", target: "doa-start" },
      { label: "💳 Amplop Digital", target: "amplop" },
      { label: "🎁 Kirim Hadiah", target: "hadiah" },
    ],
  },

  // ── Main menu (re-entry point after any branch) ──────────────────────────
  menu: {
    id: "menu",
    messages: ["Ada lagi yang ingin kamu ketahui?"],
    prompts: [
      { label: "📍 Lokasi Acara", target: "lokasi" },
      { label: "📖 Cerita Kami", target: "cerita" },
      { label: "🗓️ Jadwal Acara", target: "jadwal" },
      { label: "✅ RSVP", target: "rsvp-start" },
      { label: "💌 Kirim Doa", target: "doa-start" },
      { label: "💳 Amplop Digital", target: "amplop" },
      { label: "🎁 Kirim Hadiah", target: "hadiah" },
    ],
  },

  // ── Lokasi ────────────────────────────────────────────────────────────────
  lokasi: {
    id: "lokasi",
    messages: [
      "Tentu! Berikut lokasi acara kami 📍",
      `**${ev0.name}** — ${ev0.time}\n${ev0.venue}\n${ev0.address}`,
      `**${ev1.name}** — ${ev1.time}\n${ev1.venue}\n${ev1.address}`,
    ],
    card: "map",
    prompts: [
      { label: "📖 Cerita Kami", target: "cerita" },
      { label: "🗓️ Jadwal Acara", target: "jadwal" },
      { label: "✅ RSVP Sekarang", target: "rsvp-start" },
      { label: "↩ Menu Utama", target: "menu" },
    ],
  },

  // ── Jadwal ────────────────────────────────────────────────────────────────
  jadwal: {
    id: "jadwal",
    messages: [
      `Acara akan berlangsung pada **${wedding.date.display}**. 🗓️`,
      "Berikut susunan acara hari tersebut:",
    ],
    card: "schedule",
    prompts: [
      { label: "✅ RSVP Sekarang", target: "rsvp-start" },
      { label: "↩ Menu Utama", target: "menu" },
    ],
  },

  // ── Story ─────────────────────────────────────────────────────────────────
  cerita: {
    id: "cerita",
    messages: [
      `Dengan senang hati, inilah kisah ${wedding.groom.name} & ${wedding.bride.name}... 💚`,
      `**${wedding.story[0].year}** — ${wedding.story[0].text}`,
      `**${wedding.story[1].year}** — ${wedding.story[1].text}`,
      `**${wedding.story[2].year}** — ${wedding.story[2].text}`,
      `**${wedding.story[3].year}** — ${wedding.story[3].text}`,
      `---`,
      `${wedding.quote.text}\n\n— ${wedding.quote.by}`,
    ],
    prompts: [
      { label: "🗓️ Jadwal Acara", target: "jadwal" },
      { label: "✅ RSVP Sekarang", target: "rsvp-start" },
      { label: "↩ Menu Utama", target: "menu" },
    ],
  },

  // ── Amplop Digital ────────────────────────────────────────────────────────
  amplop: {
    id: "amplop",
    messages: [
      "Doa restu kamu adalah yang paling utama. 🙏",
      "Namun jika kamu ingin memberikan amplop digital, berikut informasinya:",
    ],
    card: "amplop",
    prompts: [
      { label: "🎁 Kirim Hadiah Fisik", target: "hadiah" },
      { label: "💌 Kirim Doa", target: "doa-start" },
      { label: "↩ Menu Utama", target: "menu" },
    ],
  },

  // ── Kirim Hadiah ──────────────────────────────────────────────────────────
  hadiah: {
    id: "hadiah",
    messages: [
      "Jika kamu ingin mengirimkan hadiah fisik, berikut alamat pengirimannya: 🎁",
      `**Penerima:** ${wedding.gift.recipientName}`,
      `**No. HP:** ${wedding.gift.phone}`,
      `**Alamat:**\n${wedding.gift.address}`,
    ],
    prompts: [
      { label: "💳 Amplop Digital", target: "amplop" },
      { label: "💌 Kirim Doa", target: "doa-start" },
      { label: "↩ Menu Utama", target: "menu" },
    ],
  },

  // ── RSVP flow ─────────────────────────────────────────────────────────────
  "rsvp-start": {
    id: "rsvp-start",
    messages: [
      "Apakah kamu akan hadir di hari bahagia kami? 🙏",
    ],
    awaitAction: true,
  },

  "rsvp-yes": {
    id: "rsvp-yes",
    messages: [
      "Alhamdulillah! Kami sangat senang kamu akan hadir! 🎉",
      "Berapa jumlah tamu yang akan hadir bersamamu?",
    ],
    awaitAction: true,
    card: "rsvp-yes-pax",
  },

  "rsvp-no": {
    id: "rsvp-no",
    messages: [
      "Tidak apa-apa, kami sangat menghargai kabar dari kamu. 🙏",
      "Doa dan restu kamu tetap sangat berarti bagi kami.",
    ],
    prompts: [
      { label: "💌 Kirim Doa & Harapan", target: "doa-start" },
      { label: "↩ Menu Utama", target: "menu" },
    ],
  },

  "rsvp-confirmed": {
    id: "rsvp-confirmed",
    messages: [
      "Terima kasih! RSVP kamu telah kami catat. ✓",
      "Kami tidak sabar untuk bertemu denganmu! 💚",
    ],
    card: "countdown",
    prompts: [
      { label: "💌 Kirim Doa & Harapan", target: "doa-start" },
      { label: "💳 Amplop Digital", target: "amplop" },
      { label: "🎁 Kirim Hadiah", target: "hadiah" },
      { label: "↩ Menu Utama", target: "menu" },
    ],
  },

  // ── Doa / Wishes ──────────────────────────────────────────────────────────
  "doa-start": {
    id: "doa-start",
    messages: [
      "Tuliskan doa dan harapan terbaikmu untuk kami di sini. 💌",
      "Setiap kata darimu akan sangat bermakna.",
    ],
    awaitAction: true,
    card: "wish-input",
  },

  "doa-sent": {
    id: "doa-sent",
    messages: [
      "Terima kasih atas doa yang indah itu. 🙏",
      "Kami akan membacanya dan menyimpannya di hati.",
    ],
    card: "countdown",
    prompts: [
      { label: "💳 Amplop Digital", target: "amplop" },
      { label: "↩ Menu Utama", target: "menu" },
    ],
  },

  // ── Closing ───────────────────────────────────────────────────────────────
  closing: {
    id: "closing",
    messages: [
      `Terima kasih telah meluangkan waktu untuk mengunjungi undangan kami. 🙏`,
      `${wedding.groom.name} & ${wedding.bride.name} berharap dapat bertemu denganmu`,
      `pada **${wedding.date.display}**. Sampai jumpa! ✨`,
    ],
    card: "countdown",
  },
};

/**
 * Resolve {guestName} placeholder in messages at runtime.
 */
export function resolveMessages(messages: string[], guestName: string): string[] {
  return messages.map((m) => m.replace(/\{guestName\}/g, guestName));
}
