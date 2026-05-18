"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useConversation } from "@/lib/ai-engine/useConversation";
import MessageBubble from "@/components/chat/MessageBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { wedding } from "@/lib/wedding-config";
import { nodes } from "@/lib/ai-engine/conversation-tree";

interface ChatInterfaceProps {
  guestName: string;
  guestId: number;
  slug: string;
}

export default function ChatInterface({ guestName, guestId, slug }: ChatInterfaceProps) {
  const [booted, setBooted] = useState(true); // Langsung true
  const [wishText, setWishText] = useState("");
  const [paxSelected, setPaxSelected] = useState<number | null>(null);
  const [commandInput, setCommandInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isTyping,
    currentNodeId,
    rsvpStatus,
    start,
    dispatch,
    confirmRsvpYes,
    confirmRsvpNo,
    confirmPax,
    sendWish,
  } = useConversation(guestName, guestId, slug);

  // Auto-start conversation since we removed loading screen
  useEffect(() => {
    start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  // Determine if RSVP action buttons should show
  const showRsvpYesNo = currentNodeId === "rsvp-start" && !isTyping && messages.length > 0;
  const showPaxPicker =
    currentNodeId === "rsvp-yes" && !isTyping && rsvpStatus === "ATTENDING";
  const showWishInput = currentNodeId === "doa-start" && !isTyping;

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || isTyping) return;

    const lowerInput = commandInput.trim().toLowerCase();

    // 1. Direct flow overrides
    if (currentNodeId === "doa-start") {
      sendWish(commandInput.trim());
      setCommandInput("");
      return;
    }

    if (currentNodeId === "rsvp-start") {
      if (lowerInput.includes("ya") || lowerInput.includes("hadir") || lowerInput.includes("bisa")) {
        confirmRsvpYes();
        setCommandInput("");
        return;
      } else if (lowerInput.includes("tidak") || lowerInput.includes("ngga") || lowerInput.includes("engga") || lowerInput.includes("maaf")) {
        confirmRsvpNo();
        setCommandInput("");
        return;
      }
    }

    // 2. Map available quick prompts
    const currentNode = nodes[currentNodeId];
    const currentPrompts = currentNode?.prompts || [];

    const exactMatch = currentPrompts.find(
      (p) => p.label.toLowerCase().includes(lowerInput) || p.target.toLowerCase().includes(lowerInput)
    );

    if (exactMatch) {
      dispatch(exactMatch.target, exactMatch.label);
    } else {
      // 3. Fallbacks using keywords manually mapping to node ids
      if (lowerInput.includes("lokasi") || lowerInput.includes("map") || lowerInput.includes("tempat")) dispatch("lokasi", commandInput.trim());
      else if (lowerInput.includes("jadwal") || lowerInput.includes("tanggal") || lowerInput.includes("waktu")) dispatch("jadwal", commandInput.trim());
      else if (lowerInput.includes("cerita") || lowerInput.includes("kisah") || lowerInput.includes("story")) dispatch("cerita", commandInput.trim());
      else if (lowerInput.includes("amplop") || lowerInput.includes("uang")) dispatch("amplop", commandInput.trim());
      else if (lowerInput.includes("hadiah") || lowerInput.includes("kado")) dispatch("hadiah", commandInput.trim());
      else if (lowerInput.includes("rsvp") || lowerInput.includes("konfirmasi")) dispatch("rsvp-start", commandInput.trim());
      else if (lowerInput.includes("doa") || lowerInput.includes("ucapan")) dispatch("doa-start", commandInput.trim());
      else dispatch("menu", "Perintah tidak diketaui. Menampilkan opsi Menu:"); // Unknown -> Fallback menu
    }
    setCommandInput("");
  };

  return (
    <>
      {/* Loading Screen */}
      {/* {!booted && <LoadingScreen onComplete={handleBoot} />} */}

      {/* Main chat UI */}
      <AnimatePresence>
        {booted && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-row h-dvh max-h-dvh bg-[var(--color-canvas)] text-[var(--color-ink)]"
          >
            {/* ── Sidebar (Desktop) ──────────────────────────────────── */}
            <aside className="hidden md:flex flex-col w-[300px] border-r border-[var(--color-hairline)] bg-[var(--color-surface-soft)]">
              <div className="p-4 border-b border-[var(--color-hairline)]">
                <h2 className="font-bold text-[var(--color-ink)] text-sm uppercase tracking-wider">
                  OpenCode / Wedding
                </h2>
              </div>
              <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                <div>
                  <p className="text-xs text-[var(--color-muted)] mb-3">GUEST INFO</p>
                  <p className="text-sm font-medium">{guestName}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)] mb-3">EVENT HOSTS</p>
                  <p className="text-sm font-medium">{wedding.bride.name}</p>
                  <p className="text-sm font-medium">{wedding.groom.name}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)] mb-3">DATE</p>
                  <p className="text-sm">{wedding.date.display}</p>
                </div>
              </div>
              <div className="p-4 border-t border-[var(--color-hairline)]">
                 <button className="w-full py-2 bg-[var(--color-surface-card)] text-[var(--color-ink)] border border-[var(--color-hairline-strong)] rounded flex items-center justify-center text-xs" onClick={() => dispatch("menu", "Menu Utama")}>
                   [+] Back to Main Menu
                 </button>
              </div>
            </aside>

            {/* ── Main Chat Area ─────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 relative">
              {/* ── Header ─────────────────────────────────────────────── */}
              <header className="flex-shrink-0 border-b border-[var(--color-hairline)] px-4 py-3 flex items-center gap-3 bg-[var(--color-canvas)]">
                <div className="w-8 h-8 rounded-full bg-[var(--color-surface-card)] border border-[var(--color-hairline-strong)] flex items-center justify-center">
                  <span className="text-[10px] text-[var(--color-ink)] font-bold">AI</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-ink)]">Wedding Assistant</p>
                  <p className="text-[10px] text-[var(--color-muted)]">
                    {wedding.bride.name} &amp; {wedding.groom.name} · {wedding.date.display}
                  </p>
                </div>
                {/* <div className="ml-auto flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-[var(--color-muted)]">Terminal Ready</span>
                </div> */}
              </header>

              {/* ── Messages ───────────────────────────────────────────── */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto chat-scroll py-6 px-4 md:px-12 space-y-2 bg-[var(--color-canvas)]"
              >

              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onPrompt={(target, label) => dispatch(target, label)}
                />
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TypingIndicator />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* RSVP Yes/No buttons */}
              <AnimatePresence>
                {showRsvpYesNo && (
                  <motion.div
                    key="rsvp-buttons"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3 px-12 py-2"
                  >
                    <button
                      onClick={confirmRsvpYes}
                      className="accent-ring flex-1 py-2.5 rounded-lg bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-sm font-medium hover:bg-emerald-400/20 transition-all duration-200 active:scale-95"
                    >
                      ✅ Ya, saya hadir
                    </button>
                    <button
                      onClick={confirmRsvpNo}
                      className="accent-ring flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-[#9ca3af] text-sm hover:bg-white/8 transition-all duration-200 active:scale-95"
                    >
                      Tidak bisa hadir
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pax picker */}
              <AnimatePresence>
                {showPaxPicker && (
                  <motion.div
                    key="pax-picker"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-12 py-2"
                  >
                    <p className="text-xs text-[#6b7280] mb-2 pl-1">Jumlah tamu:</p>
                    <div className="flex gap-2 flex-wrap">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => {
                            setPaxSelected(n);
                            confirmPax(n);
                          }}
                          className={`accent-ring w-11 h-11 rounded-lg border text-sm font-medium transition-all duration-200 active:scale-95 ${
                            paxSelected === n
                              ? "bg-emerald-400/20 border-emerald-400 text-emerald-300"
                              : "bg-[#1e1e1e] border-white/10 text-[#d1d5db] hover:border-emerald-400/40"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setPaxSelected(6);
                          confirmPax(6);
                        }}
                        className="accent-ring px-3 h-11 rounded-lg border border-white/10 bg-[#1e1e1e] text-sm text-[#d1d5db] hover:border-emerald-400/40 transition-all duration-200 active:scale-95"
                      >
                        6+
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wish input */}
              <AnimatePresence>
                {showWishInput && (
                  <motion.div
                    key="wish-input"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-12 py-2"
                  >
                    <textarea
                      value={wishText}
                      onChange={(e) => setWishText(e.target.value)}
                      placeholder="Tulis doa & harapanmu di sini..."
                      rows={3}
                      maxLength={500}
                      className="accent-ring w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#d1d5db] placeholder-[#4b5563] resize-none focus:border-emerald-400/40 focus:bg-[#1e1e1e] transition-colors outline-none font-mono"
                    />
                    <button
                      onClick={() => {
                        if (wishText.trim()) {
                          sendWish(wishText.trim());
                          setWishText("");
                        }
                      }}
                      disabled={!wishText.trim()}
                      className="accent-ring mt-2 w-full py-2.5 rounded-lg bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-sm font-medium hover:bg-emerald-400/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      💌 Kirim Doa
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scroll anchor */}
              <div className="h-4" />
            </div>

            {/* ── Footer & Command Line ──────────────────────────────── */}
            <div className="flex-shrink-0 p-4 border-t border-[var(--color-hairline)] bg-[var(--color-canvas)]">
              <form onSubmit={handleCommandSubmit} className="max-w-3xl mx-auto">
                <div className="flex items-center bg-[var(--color-surface-soft)] border border-[var(--color-hairline-strong)] rounded-sm px-3 py-2 shadow-sm focus-within:bg-[var(--color-canvas)] focus-within:border-[var(--color-ink)] transition-colors">
                  <span className="text-[var(--color-muted)] mr-2">&gt;</span>
                  <input
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    disabled={isTyping}
                    placeholder={
                      isTyping 
                        ? "AI sedang mengetik..." 
                        : currentNodeId === "doa-start"
                        ? "Ketikkan doa & harapanmu di sini..."
                        : currentNodeId.startsWith("rsvp-")
                        ? "Jawab 'ya hadir' atau 'tidak'..."
                        : "Ketik perintah (ex: lokasi, cerita, rsvp, amplop)..."
                    }
                    className="flex-1 bg-transparent outline-none text-sm placeholder-[var(--color-dim)] text-[var(--color-ink)] disabled:opacity-50"
                  />
                  <button 
                    type="submit" 
                    disabled={isTyping || !commandInput.trim()} 
                    className="w-5 h-5 bg-[var(--color-surface-card)] rounded-sm flex items-center justify-center border border-[var(--color-hairline)] hover:bg-[var(--color-surface-soft)] transition-colors disabled:opacity-50"
                  >
                    <span className="text-[10px] text-[var(--color-muted)] font-bold">↩</span>
                  </button>
                </div>
                <p className="text-center mt-3 text-[10px] text-[var(--color-dim)]">
                  Wedding Assistant &mdash; {wedding.bride.name} &amp; {wedding.groom.name} &copy; {new Date().getFullYear()}
                </p>
              </form>
            </div>

            </div> {/* Close Main Chat Area */}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
