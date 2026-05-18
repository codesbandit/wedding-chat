"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useConversation } from "@/lib/ai-engine/useConversation";
import MessageBubble from "@/components/chat/MessageBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { wedding } from "@/lib/wedding-config";

interface ChatInterfaceProps {
  guestName: string;
  guestId: number;
  slug: string;
}

export default function ChatInterface({ guestName, guestId, slug }: ChatInterfaceProps) {
  const [booted, setBooted] = useState(false);
  const [wishText, setWishText] = useState("");
  const [paxSelected, setPaxSelected] = useState<number | null>(null);
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

  // Auto-start conversation after loading screen
  // useCallback keeps the reference stable so LoadingScreen's effect doesn't re-run
  const handleBoot = useCallback(() => {
    setBooted(true);
    start();
  }, [start]);

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

  return (
    <>
      {/* Loading Screen */}
      {!booted && <LoadingScreen onComplete={handleBoot} />}

      {/* Main chat UI */}
      <AnimatePresence>
        {booted && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col h-dvh max-h-dvh bg-[#0a0a0a]"
          >
            {/* ── Header ─────────────────────────────────────────────── */}
            <header className="flex-shrink-0 border-b border-white/7 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center">
                <span className="text-[10px] text-emerald-400 font-bold">AI</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#f0f0f0]">Wedding Assistant</p>
                <p className="text-[10px] text-emerald-400">
                  {wedding.bride.name} &amp; {wedding.groom.name} · {wedding.date.display}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-[#6b7280]">Online</span>
              </div>
            </header>

            {/* ── Messages ───────────────────────────────────────────── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto chat-scroll py-4 space-y-1"
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

            {/* ── Footer ─────────────────────────────────────────────── */}
            <footer className="flex-shrink-0 border-t border-white/7 px-4 py-3">
              <p className="text-center text-[10px] text-[#3f3f46]">
                Wedding Assistant &mdash; {wedding.bride.name} &amp; {wedding.groom.name} &copy; {new Date().getFullYear()}
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
