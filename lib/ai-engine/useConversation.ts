"use client";

import { useCallback, useRef, useState } from "react";
import {
  nodes,
  resolveMessages,
  type ConversationNode,
  type QuickPrompt,
} from "./conversation-tree";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageRole = "ai" | "user";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  /** Card to render below this message */
  card?: ConversationNode["card"];
  /** Prompts to render below this message (only on the last message of a node) */
  prompts?: QuickPrompt[];
  isStreaming?: boolean;
}

interface ConversationState {
  messages: ChatMessage[];
  isTyping: boolean;
  currentNodeId: string;
  rsvpStatus: "PENDING" | "ATTENDING" | "NOT_ATTENDING";
  pax: number;
}

// LLM history entry (lightweight — just role + content for API context)
interface LLMHistoryEntry {
  role: "user" | "assistant";
  content: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

/** Delay between messages in a node (ms) */
const MESSAGE_GAP = 900;

/** Typing indicator duration before first message (ms) */
const TYPING_DELAY_MIN = 700;
const TYPING_DELAY_MAX = 1400;

function randDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useConversation(guestName: string, guestId: number, slug: string) {
  const [state, setState] = useState<ConversationState>({
    messages: [],
    isTyping: false,
    currentNodeId: "greeting",
    rsvpStatus: "PENDING",
    pax: 0,
  });

  // Prevent duplicate dispatches while animating
  const locked = useRef(false);

  // LLM conversation history — grows as user chats freely
  const llmHistory = useRef<LLMHistoryEntry[]>([]);

  // ── Stream a single message into the list word-by-word ──────────────────
  const streamMessage = useCallback(
    (text: string, card?: ConversationNode["card"], prompts?: QuickPrompt[]) => {
      return new Promise<void>((resolve) => {
        const id = uid();
        // Add empty streaming message
        setState((s) => ({
          ...s,
          messages: [
            ...s.messages,
            { id, role: "ai", text: "", card, prompts, isStreaming: true },
          ],
        }));

        const words = text.split(" ");
        let i = 0;
        // Delay between words: ~25ms for short sentences, ~18ms for long ones
        const interval = words.length > 30 ? 18 : 25;

        const timer = setInterval(() => {
          i++;
          const current = words.slice(0, i).join(" ");
          setState((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === id ? { ...m, text: current } : m
            ),
          }));
          if (i >= words.length) {
            clearInterval(timer);
            setState((s) => ({
              ...s,
              messages: s.messages.map((m) =>
                m.id === id ? { ...m, isStreaming: false } : m
              ),
            }));
            resolve();
          }
        }, interval);
      });
    },
    []
  );

  // ── Add a user message instantly ────────────────────────────────────────
  const addUserMessage = useCallback((text: string) => {
    setState((s) => ({
      ...s,
      messages: [
        ...s.messages,
        { id: uid(), role: "user", text },
      ],
    }));
  }, []);

  // ── Play through all messages in a node ─────────────────────────────────
  const playNode = useCallback(
    async (nodeId: string) => {
      const node = nodes[nodeId];
      if (!node) return;

      // Show typing indicator
      setState((s) => ({ ...s, isTyping: true, currentNodeId: nodeId }));
      await new Promise((r) => setTimeout(r, randDelay(TYPING_DELAY_MIN, TYPING_DELAY_MAX)));
      setState((s) => ({ ...s, isTyping: false }));

      const resolved = resolveMessages(node.messages, guestName);

      for (let i = 0; i < resolved.length; i++) {
        const isLast = i === resolved.length - 1;
        const card = isLast ? node.card : undefined;
        const prompts = isLast && !node.awaitAction ? node.prompts : undefined;

        await streamMessage(resolved[i], card, prompts);

        if (!isLast) {
          // Show typing again between messages
          setState((s) => ({ ...s, isTyping: true }));
          await new Promise((r) => setTimeout(r, MESSAGE_GAP));
          setState((s) => ({ ...s, isTyping: false }));
        }
      }

      locked.current = false;
    },
    [guestName, streamMessage]
  );

  // ── Public: navigate to a node via a quick prompt click ─────────────────
  const dispatch = useCallback(
    (target: string, userLabel?: string) => {
      if (locked.current) return;
      locked.current = true;
      if (userLabel) addUserMessage(userLabel);
      playNode(target);
    },
    [addUserMessage, playNode]
  );

  // ── Start the conversation ───────────────────────────────────────────────
  const start = useCallback(() => {
    if (locked.current) return;
    locked.current = true;
    playNode("greeting");
  }, [playNode]);

  // ── RSVP: Yes ────────────────────────────────────────────────────────────
  const confirmRsvpYes = useCallback(() => {
    if (locked.current) return;
    locked.current = true;
    addUserMessage("Ya, saya akan hadir ✅");
    setState((s) => ({ ...s, rsvpStatus: "ATTENDING" }));
    playNode("rsvp-yes");
  }, [addUserMessage, playNode]);

  // ── RSVP: No ─────────────────────────────────────────────────────────────
  const confirmRsvpNo = useCallback(() => {
    if (locked.current) return;
    locked.current = true;
    addUserMessage("Maaf, saya tidak bisa hadir 🙏");
    setState((s) => ({ ...s, rsvpStatus: "NOT_ATTENDING" }));
    // POST to API
    fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, attendance_status: "NOT_ATTENDING", pax: 0 }),
    });
    playNode("rsvp-no");
  }, [addUserMessage, playNode, slug]);

  // ── RSVP: confirm pax count ──────────────────────────────────────────────
  const confirmPax = useCallback(
    (pax: number) => {
      if (locked.current) return;
      locked.current = true;
      addUserMessage(`${pax} orang`);
      setState((s) => ({ ...s, pax }));
      // POST to API
      fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, attendance_status: "ATTENDING", pax }),
      });
      playNode("rsvp-confirmed");
    },
    [addUserMessage, playNode, slug]
  );

  // ── Wishes: send message ──────────────────────────────────────────────────
  const sendWish = useCallback(
    (message: string) => {
      if (locked.current) return;
      locked.current = true;
      addUserMessage(`💌 ${message}`);
      // POST to API
      fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_id: guestId, message }),
      });
      playNode("doa-sent");
    },
    [addUserMessage, guestId, playNode]
  );

  // ── LLM: free-form conversation via OpenRouter (streaming) ──────────────────
  const callLLM = useCallback(
    async (userMessage: string) => {
      if (locked.current) return;
      locked.current = true;

      addUserMessage(userMessage);

      // Show typing indicator while connecting / during think phase
      setState((s) => ({ ...s, isTyping: true }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            guestName,
            history: llmHistory.current,
          }),
        });

        if (!res.ok || !res.body) {
          setState((s) => ({ ...s, isTyping: false }));
          await streamMessage(
            "Maaf, saya tidak bisa menjawab saat ini. Silakan pilih salah satu menu di atas. 🙏"
          );
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let lineBuf = "";
        let fullReply = "";
        let msgId: string | null = null;

        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          lineBuf += decoder.decode(value, { stream: true });
          const lines = lineBuf.split("\n");
          lineBuf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break outer;

            try {
              const parsed = JSON.parse(data) as { c?: string };
              const chunk = parsed.c ?? "";
              if (!chunk) continue;

              fullReply += chunk;

              if (!msgId) {
                // First visible content — hide typing indicator, create bubble
                msgId = uid();
                const capturedId = msgId;
                setState((s) => ({
                  ...s,
                  isTyping: false,
                  messages: [
                    ...s.messages,
                    { id: capturedId, role: "ai", text: chunk, isStreaming: true },
                  ],
                }));
              } else {
                const capturedId = msgId;
                const capturedReply = fullReply;
                setState((s) => ({
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === capturedId ? { ...m, text: capturedReply } : m
                  ),
                }));
              }
            } catch {
              // malformed chunk — skip
            }
          }
        }

        // Finalize message bubble
        if (msgId) {
          const capturedId = msgId;
          setState((s) => ({
            ...s,
            isTyping: false,
            messages: s.messages.map((m) =>
              m.id === capturedId ? { ...m, isStreaming: false } : m
            ),
          }));
        } else {
          // Model responded but all content was in think tags (empty reply)
          setState((s) => ({ ...s, isTyping: false }));
          await streamMessage(
            "Maaf, saya tidak bisa menjawab saat ini. Silakan pilih salah satu menu di atas. 🙏"
          );
        }

        if (fullReply) {
          // Keep history for next LLM call (max 12 entries = 6 turns)
          llmHistory.current = [
            ...llmHistory.current,
            { role: "user" as const, content: userMessage },
            { role: "assistant" as const, content: fullReply },
          ].slice(-12);
        }
      } catch {
        setState((s) => ({ ...s, isTyping: false }));
        await streamMessage(
          "Maaf, terjadi gangguan koneksi. Silakan pilih menu di atas atau coba lagi. 🙏"
        );
      } finally {
        locked.current = false;
      }
    },
    [addUserMessage, guestName, streamMessage]
  );

  return {
    messages: state.messages,
    isTyping: state.isTyping,
    currentNodeId: state.currentNodeId,
    rsvpStatus: state.rsvpStatus,
    pax: state.pax,
    start,
    dispatch,
    confirmRsvpYes,
    confirmRsvpNo,
    confirmPax,
    sendWish,
    callLLM,
  };
}
