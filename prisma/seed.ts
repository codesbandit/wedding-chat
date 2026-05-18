import { prisma } from "../lib/prisma";

async function main() {
  const guests = [
    { slug: "budi-santoso-family", guest_name: "Budi Santoso", category: "FAMILY" as const },
    { slug: "andi-wirawan", guest_name: "Andi Wirawan", category: "FRIEND" as const },
    { slug: "sarah-tech", guest_name: "Sarah Rahmawati", category: "TECH" as const },
    { slug: "pak-direktur", guest_name: "Bapak Direktur", category: "COLLEAGUE" as const },
    { slug: "reza-startup", guest_name: "Reza Pradana", category: "TECH" as const },
    { slug: "keluarga-ali", guest_name: "Keluarga Ali Basri", category: "FAMILY" as const },
    { slug: "demo", guest_name: "Demo Guest", category: "FRIEND" as const },
  ];

  for (const guest of guests) {
    await prisma.guest.upsert({
      where: { slug: guest.slug },
      update: {},
      create: guest,
    });
    console.log(`✓ Seeded: ${guest.slug}`);
  }

  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
