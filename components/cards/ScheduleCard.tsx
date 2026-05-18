"use client";

import { motion } from "framer-motion";
import { wedding } from "@/lib/wedding-config";

export default function ScheduleCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-[#1e1e1e] border border-white/10 rounded-xl overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-white/7 flex items-center gap-2">
        <span className="text-emerald-400">🗓️</span>
        <span className="text-xs text-[#6b7280] uppercase tracking-wider">
          {wedding.date.display}
        </span>
      </div>

      {wedding.events.map((ev, i) => (
        <div
          key={i}
          className={`px-4 py-4 flex gap-4 ${i < wedding.events.length - 1 ? "border-b border-white/7" : ""}`}
        >
          {/* Timeline dot */}
          <div className="flex flex-col items-center pt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
            {i < wedding.events.length - 1 && (
              <div className="w-px flex-1 bg-white/10 mt-1.5" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-1">
            <p className="text-sm font-bold text-[#f0f0f0]">{ev.name}</p>
            <p className="text-xs text-emerald-400 mt-0.5">{ev.time}</p>
            <p className="text-xs text-[#6b7280] mt-1">{ev.venue}</p>
            <p className="text-xs text-[#d4a853] mt-1">
              <span className="opacity-60">Dress code: </span>
              {ev.dressCode}
            </p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
