import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ChatInterface from "@/components/chat/ChatInterface";
import type { Metadata } from "next";
import { wedding } from "@/lib/wedding-config";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guest = await prisma.guest.findUnique({
    where: { slug },
    select: { guest_name: true },
  });
  if (!guest) return {};
  return {
    title: `Undangan untuk ${guest.guest_name} — ${wedding.groom.name} & ${wedding.bride.name}`,
  };
}

export default async function InvitePage({ params }: PageProps) {
  const { slug } = await params;

  // Validate slug shape before DB query
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) {
    notFound();
  }

  const guest = await prisma.guest.findUnique({
    where: { slug },
    select: { id: true, guest_name: true, category: true },
  });

  if (!guest) {
    notFound();
  }

  return (
    <ChatInterface
      guestName={guest.guest_name}
      guestId={guest.id}
      slug={slug}
    />
  );
}
