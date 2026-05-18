"use client";

import { motion } from "framer-motion";
import type { QuickPrompt } from "@/lib/ai-engine/conversation-tree";

interface QuickPromptsProps {
  prompts: QuickPrompt[];
  onSelect: (target: string, label: string) => void;
}

export default function QuickPrompts({ prompts, onSelect }: QuickPromptsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex flex-wrap gap-2 pt-1"
    >
      {prompts.map((p) => (
        <button
          key={p.target}
          onClick={() => onSelect(p.target, p.label)}
          className="accent-ring text-xs px-3 py-2 rounded bg-[#1e1e1e] border border-white/10 text-[#d1d5db] hover:border-emerald-400/40 hover:text-emerald-300 hover:bg-emerald-400/5 transition-all duration-200 active:scale-95"
        >
          {p.label}
        </button>
      ))}
    </motion.div>
  );
}
