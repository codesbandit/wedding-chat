"use client";

import { motion } from "framer-motion";
import { wedding } from "@/lib/wedding-config";

export default function MapCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-[#1e1e1e] border border-white/10 rounded-xl overflow-hidden"
    >
      {wedding.events.map((ev, i) => (
        <div
          key={i}
          className={`p-4 ${i < wedding.events.length - 1 ? "border-b border-white/7" : ""}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-emerald-400 font-medium mb-1 uppercase tracking-wider">
                {ev.name}
              </p>
              <p className="text-sm text-[#f0f0f0] font-medium truncate">{ev.venue}</p>
              <p className="text-xs text-[#6b7280] mt-0.5 leading-relaxed">{ev.address}</p>
              <p className="text-xs text-[#d4a853] mt-1">📍 {ev.time}</p>
            </div>
            <a
              href={ev.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="accent-ring flex-shrink-0 text-xs px-3 py-1.5 rounded bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20 transition-colors duration-200 whitespace-nowrap"
            >
              Maps →
            </a>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
