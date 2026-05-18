/**
 * Wedding Config — single source of truth for all content.
 * Edit this file to update names, dates, venue, story, etc.
 */

export const wedding = {
  bride: {
    name: "Rhesi",
    fullName: "Nenden Rhesi Latifatul Karimah, S.Sos",
    childOrder: "Putri pertama",
    parents: "Aa Sanusi (Alm.) & Nur Laelasari Herawati",
    instagram: "ndrhess",
  },
  groom: {
    name: "Shiddiq",
    fullName: "Muhammad Shiddiq Fitriyansyah",
    childOrder: "Putra pertama",
    parents: "Muhammad Sabir Kamil, SE & Yuningsih, S.Pd",
    instagram: "siddiqfmuh",
  },
  date: {
    iso: "2026-06-01",
    display: "Senin, 1 Juni 2026",
    day: "Senin",
  },
  quote: {
    text: `Dengan izin Allah, dua hati dipersatukan,\ndalam indahnya rencana yang telah ditentukan.\nSaling menenangkan dalam satu tujuan,\nterikat janji suci penuh ketulusan.\nCinta bersemi dalam ridha-Nya,\nhingga kelak bersama di jannah-Nya`,
    by: "Rhesi & Shiddiq",
  },
  events: [
    {
      name: "Akad Nikah",
      time: "08.00 WIB",
      venue: "Ponyo Resto & Wedding",
      address: "Jl. Raya Bandung - Garut No. KM. 35, RT.4/RW.07, Bandung, 40215",
      mapsUrl: "https://share.google/hp7569KZFGpGxODjy",
      dressCode: "Formal — Abu / Cream",
    },
    {
      name: "Resepsi Pernikahan",
      time: "11.00 – 14:00 WIB",
      venue: "Ponyo Resto & Wedding",
      address: "Jl. Raya Bandung - Garut No. KM. 35, RT.4/RW.07, Bandung, 40215",
      mapsUrl: "https://share.google/hp7569KZFGpGxODjy",
      dressCode: "Formal — Abu / Cream",
    },
  ],
  story: [
    {
      year: "Awal Pertemuan",
      text: "Setiap pertemuan punya ceritanya sendiri. Begitu pula kami — dua jiwa yang dipertemukan atas izin Allah.",
    },
    {
      year: "Saling Mengenal",
      text: "Dari perkenalan yang sederhana, kami mulai memahami satu sama lain, menemukan kecocokan dalam diam dan kebersamaan.",
    },
    {
      year: "Meyakini",
      text: "Keyakinan itu datang perlahan — bahwa ini bukan kebetulan, melainkan bagian dari rencana-Nya yang indah.",
    },
    {
      year: "2026",
      text: "Dan kini, kami memberanikan diri untuk melangkah bersama, menuju babak baru yang lebih bermakna. ✨",
    },
  ],
  amplop: [
    {
      bank: "BSI",
      accountNumber: "7199921708",
      accountName: "Nenden Rhesi Latifatul Karimah",
    },
    {
      bank: "BCA",
      accountNumber: "7753263910",
      accountName: "Nenden Rhesi Latifatul Karimah",
    },
  ],
  gift: {
    recipientName: "Shiddiq & Nenden",
    phone: "083190208249",
    address: "3/15 Cluster Rasamala Bumi Panyawangan Real Estate, Cimekar, Cileunyi, Bandung, Jawa Barat 40623",
  },
  music: {
    title: "Sepanjang Hidup",
    artist: "Maher Zain",
  },
} as const;

export type WeddingConfig = typeof wedding;
