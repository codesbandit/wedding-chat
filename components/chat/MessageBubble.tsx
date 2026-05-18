"use client";

import { motion } from "framer-motion";
import type { ChatMessage } from "@/lib/ai-engine/useConversation";
import MapCard from "@/components/cards/MapCard";
import ScheduleCard from "@/components/cards/ScheduleCard";
import CountdownCard from "@/components/cards/CountdownCard";
import AmplopsCard from "@/components/cards/AmplopsCard";
import QuickPrompts from "@/components/chat/QuickPrompts";
import type { QuickPrompt } from "@/lib/ai-engine/conversation-tree";

interface MessageBubbleProps {
  message: ChatMessage;
  onPrompt?: (target: string, label: string) => void;
}

/** Parse **bold** markdown-style text into JSX */
function parseBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-[#f0f0f0] font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function MessageBubble({ message, onPrompt }: MessageBubbleProps) {
  const isAI = message.role === "ai";

  if (!isAI) {
    // User message — right-aligned pill
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex justify-end px-4 py-1"
      >
        <div className="max-w-[78%] bg-emerald-400/10 border border-emerald-400/20 rounded-xl rounded-br-sm px-4 py-2.5 text-sm text-emerald-100">
          {message.text}
        </div>
      </motion.div>
    );
  }

  // Special separator line
  if (message.text === "---") {
    return (
      <div className="px-4 py-2">
        <div className="border-t border-white/7" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-end gap-2 px-4 py-1"
    >
      {/* AI avatar */}
      <div className="w-6 h-6 rounded-full bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center flex-shrink-0 mb-0.5">
        <span className="text-[8px] text-emerald-400 font-bold">AI</span>
      </div>

      <div className="flex-1 max-w-[85%] space-y-2">
        {/* Text bubble */}
        <div className="bg-[#141414] border border-white/7 rounded-xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed text-[#d1d5db] whitespace-pre-line">
          {parseBold(message.text)}
          {message.isStreaming && <span className="cursor-blink" />}
        </div>

        {/* Inline card */}
        {!message.isStreaming && message.card && (
          <div className="ml-0">
            {message.card === "map" && <MapCard />}
            {message.card === "schedule" && <ScheduleCard />}
            {message.card === "countdown" && <CountdownCard />}
            {message.card === "amplop" && <AmplopsCard />}
          </div>
        )}

        {/* Quick prompts */}
        {!message.isStreaming && message.prompts && onPrompt && (
          <QuickPrompts prompts={message.prompts} onSelect={onPrompt} />
        )}
      </div>
    </motion.div>
  );
}
