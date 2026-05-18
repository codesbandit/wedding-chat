"use client";

import { motion } from "framer-motion";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4 py-2">
      {/* AI avatar dot */}
      <div className="w-6 h-6 rounded-full bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
        <span className="text-[8px] text-emerald-400">AI</span>
      </div>

      {/* Bubble with bouncing dots */}
      <div className="bg-[#141414] border border-white/7 rounded-xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-emerald-400/70"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
