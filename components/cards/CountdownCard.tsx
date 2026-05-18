"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { wedding } from "@/lib/wedding-config";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(): TimeLeft {
  const target = new Date(wedding.date.iso + "T08:00:00+07:00").getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CountdownCard() {
  const [time, setTime] = useState<TimeLeft>(getTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const units = [
    { label: "Hari", value: time.days },
    { label: "Jam", value: time.hours },
    { label: "Menit", value: time.minutes },
    { label: "Detik", value: time.seconds },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-[#1e1e1e] border border-white/10 rounded-xl overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-white/7 text-center">
        <p className="text-xs text-[#6b7280] uppercase tracking-wider">Menuju Hari Bahagia</p>
        <p className="text-xs text-emerald-400 mt-0.5">{wedding.date.display}</p>
      </div>

      <div className="grid grid-cols-4 divide-x divide-white/7">
        {units.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center py-4 px-2">
            <span className="text-2xl font-bold text-[#f0f0f0] tabular-nums">
              {pad(value)}
            </span>
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider mt-1">
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-white/7">
        <a
          href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Pernikahan ${wedding.bride.name} & ${wedding.groom.name}`)}&dates=${wedding.date.iso.replace(/-/g, "")}T010000Z/${wedding.date.iso.replace(/-/g, "")}T090000Z&details=${encodeURIComponent("Hadir di acara pernikahan")}&location=${encodeURIComponent(wedding.events[0].address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="accent-ring block text-center text-xs py-2 rounded bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20 transition-colors duration-200"
        >
          📅 Simpan ke Google Calendar
        </a>
      </div>
    </motion.div>
  );
}
