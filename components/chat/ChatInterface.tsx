"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useConversation } from "@/lib/ai-engine/useConversation";
import MessageBubble from "@/components/chat/MessageBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { wedding } from "@/lib/wedding-config";
import { nodes } from "@/lib/ai-engine/conversation-tree";

// ── Game: How Well Do You Know The Couple ─────────────────────────────────
const COUPLE_GAME = [
  { q: "Siapa yang pertama kali ngajak ngobrol duluan?", a: "Rhesi" },
  { q: "Siapa yang paling romantis?", a: "Keduanya" },
  { q: "Siapa yang paling lama siap-siap?", a: "Rhesi" },
  { q: "Siapa yang paling sering telat?", a: "Shiddiq" },
  { q: "Siapa yang paling gampang lapar?", a: "Shiddiq" },
  { q: "Siapa yang paling suka jajan?", a: "Rhesi" },
  { q: "Siapa yang paling sering ngajak jalan?", a: "Keduanya" },
  { q: "Siapa yang paling gampang ketawa?", a: "Rhesi" },
  { q: "Siapa yang paling perhatian?", a: "Keduanya" },
  { q: "Siapa yang paling mungkin ngajak liburan mendadak?", a: "Shiddiq" },
];

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

  // Game state
  const [gameActive, setGameActive] = useState(false);
  const [gameQIdx, setGameQIdx] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [gamePick, setGamePick] = useState<string | null>(null);

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
    callLLM,
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
      else callLLM(commandInput.trim()); // Unknown -> tanya LLM
    }
    setCommandInput("");
  };

  // ── Game handlers ───────────────────────────────────────────────────────
  const handleGameAnswer = (pick: string) => {
    if (gamePick !== null) return;
    setGamePick(pick);
    if (pick === COUPLE_GAME[gameQIdx].a) setGameScore((s) => s + 1);
  };
  const handleGameNext = () => {
    if (gameQIdx + 1 >= COUPLE_GAME.length) {
      setGameQIdx(COUPLE_GAME.length); // signals done
    } else {
      setGameQIdx((i) => i + 1);
      setGamePick(null);
    }
  };
  const handleGameClose = () => {
    setGameActive(false);
    setGameQIdx(0);
    setGameScore(0);
    setGamePick(null);
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
                  Wedding Assistant &mdash; {wedding.bride.name} &amp; {wedding.groom.name}
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

            {/* ── Footer & Command Line (ChatGPT style) ─────────────── */}
            <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-[var(--color-canvas)]">
              <form onSubmit={handleCommandSubmit} className="max-w-2xl mx-auto">

                {/* Suggestion chips — shown when input empty & not in special flow */}
                {!commandInput && !isTyping && !currentNodeId.startsWith("rsvp-") && currentNodeId !== "doa-start" && (
                  <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
                    {[
                      { label: "Telling Jokes 😄", onClick: () => callLLM("Buatin jokes dong") },
                      { label: "🎮 Games", onClick: () => setGameActive(true) },
                      { label: "📍 Lokasi acara", onClick: () => callLLM("Lokasinya dimana?") },
                      { label: "👗 Dress code", onClick: () => callLLM("Dress code-nya apa?") },
                      { label: "🕐 Jam acara", onClick: () => callLLM("Jam berapa acaranya?") },
                      { label: "💌 Amplop digital", onClick: () => callLLM("Info amplop digital") },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={chip.onClick}
                        className="flex-shrink-0 text-[11px] text-[var(--color-muted)] border border-[var(--color-hairline-strong)] rounded-full px-3 py-1 hover:bg-[var(--color-surface-card)] hover:text-[var(--color-ink)] transition-colors whitespace-nowrap"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="rounded-2xl border border-[var(--color-hairline-strong)] bg-[var(--color-surface-soft)] shadow-sm focus-within:border-[var(--color-ink)] focus-within:bg-[var(--color-canvas)] transition-all duration-200">
                  {/* Text input */}
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
                        : "Tanyakan apa saja, misal: 'lokasinya dimana ?', 'dress code'..."
                    }
                    className="w-full bg-transparent outline-none text-sm text-[var(--color-ink)] placeholder-[var(--color-dim)] px-4 pt-3 pb-1 disabled:opacity-50"
                  />

                  {/* Bottom bar: left actions + right send */}
                  <div className="flex items-center justify-between px-3 pb-2 pt-1">
                    {/* Left — plus icon */}
                    <button
                      type="button"
                      className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-surface-card)] transition-colors text-base leading-none"
                      onClick={() => dispatch("menu", "Menu Utama")}
                      title="Lihat menu"
                    >
                      +
                    </button>

                    {/* Right — send button */}
                    <button
                      type="submit"
                      disabled={isTyping || !commandInput.trim()}
                      className="w-8 h-8 rounded-full bg-[var(--color-ink)] flex items-center justify-center transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed hover:opacity-80 active:scale-95"
                      title="Kirim"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[var(--color-canvas)]">
                        <path d="M12 4L12 20M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <p className="text-center mt-2 text-[10px] text-[var(--color-dim)]">
                  Wedding Assistant &mdash; {wedding.bride.name} &amp; {wedding.groom.name}
                </p>
              </form>
            </div>

            </div> {/* Close Main Chat Area */}
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── Game Modal: How Well Do You Know The Couple ───────── */}
      <AnimatePresence>
        {gameActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-[var(--color-canvas)] border border-[var(--color-hairline-strong)] rounded-2xl p-6 shadow-2xl"
            >
              {gameQIdx >= COUPLE_GAME.length ? (
                // ── Result screen ─────────────────────────────────────────
                <div className="text-center space-y-4">
                  <p className="text-4xl">
                    {gameScore >= 9 ? "🏆" : gameScore >= 6 ? "🎉" : gameScore >= 3 ? "😄" : "😂"}
                  </p>
                  <h3 className="font-bold text-lg text-[var(--color-ink)]">Selesai!</h3>
                  <p className="text-5xl font-bold text-[var(--color-ink)]">
                    {gameScore}
                    <span className="text-xl text-[var(--color-muted)]">/{COUPLE_GAME.length}</span>
                  </p>
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                    {gameScore >= 9
                      ? "Kamu kenal mereka banget! Bahkan lebih dari mereka sendiri 😄"
                      : gameScore >= 6
                      ? "Lumayan! Kamu cukup kenal pasangan Rhesi & Shiddiq 😊"
                      : gameScore >= 3
                      ? "Masih banyak yang perlu dipelajari tentang mereka 😄"
                      : "Kayaknya baru pertama kali dengar tentang mereka ya? 😂"}
                  </p>
                  <button
                    onClick={handleGameClose}
                    className="w-full py-2.5 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-hairline-strong)] text-sm text-[var(--color-ink)] hover:opacity-75 transition-opacity"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                // ── Question screen ────────────────────────────────────────
                <div className="space-y-5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--color-muted)] font-mono tracking-wider">
                      {gameQIdx + 1} / {COUPLE_GAME.length}
                    </span>
                    <button
                      onClick={handleGameClose}
                      className="text-[var(--color-dim)] hover:text-[var(--color-muted)] text-xl leading-none"
                    >
                      ×
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="h-0.5 bg-[var(--color-surface-card)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-ink)] rounded-full transition-all duration-500"
                      style={{ width: `${(gameQIdx / COUPLE_GAME.length) * 100}%` }}
                    />
                  </div>

                  {/* Label */}
                  <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest font-mono">
                    How Well Do You Know The Couple?
                  </p>

                  {/* Question */}
                  <p className="text-base font-medium text-[var(--color-ink)] leading-snug">
                    {COUPLE_GAME[gameQIdx].q}
                  </p>

                  {/* Answer buttons */}
                  <div className="space-y-2">
                    {["Rhesi", "Shiddiq", "Keduanya"].map((opt) => {
                      const isCorrect = COUPLE_GAME[gameQIdx].a === opt;
                      const isChosen = gamePick === opt;
                      const revealed = gamePick !== null;

                      let cls =
                        "w-full py-2.5 px-4 rounded-xl border text-sm text-left transition-all duration-200 ";
                      if (!revealed) {
                        cls +=
                          "border-[var(--color-hairline-strong)] bg-[var(--color-surface-soft)] text-[var(--color-ink)] hover:bg-[var(--color-surface-card)] cursor-pointer active:scale-95";
                      } else if (isCorrect) {
                        cls += "border-emerald-500/50 bg-emerald-500/10 text-emerald-700";
                      } else if (isChosen) {
                        cls += "border-red-400/40 bg-red-400/8 text-red-600";
                      } else {
                        cls +=
                          "border-[var(--color-hairline)] bg-transparent text-[var(--color-dim)] opacity-40";
                      }

                      return (
                        <button
                          key={opt}
                          onClick={() => handleGameAnswer(opt)}
                          disabled={revealed}
                          className={cls}
                        >
                          {revealed && isCorrect && "✓ "}
                          {revealed && isChosen && !isCorrect && "✗ "}
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback + Next */}
                  <AnimatePresence>
                    {gamePick !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <p className="text-sm text-[var(--color-muted)]">
                          {gamePick === COUPLE_GAME[gameQIdx].a
                            ? "✨ Benar!"
                            : `Jawabannya: ${COUPLE_GAME[gameQIdx].a}`}
                        </p>
                        <button
                          onClick={handleGameNext}
                          className="w-full py-2.5 rounded-xl bg-[var(--color-ink)] text-[var(--color-canvas)] text-sm font-medium hover:opacity-80 transition-opacity active:scale-95"
                        >
                          {gameQIdx + 1 >= COUPLE_GAME.length ? "Lihat Hasil →" : "Lanjut →"}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
