"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BOOT_LINES = [
  "> Connecting to Wedding Assistant...",
  "> Loading guest profile...",
  "> Preparing your personalized experience...",
  "> All systems nominal.",
  "",
  "WEDDING ASSISTANT v1.0 — READY",
];

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  // Keep onComplete ref stable — avoids re-running the effect on parent re-renders
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setLines((prev) => [...prev, BOOT_LINES[i]]);
        i++;
      } else {
        clearInterval(timer);
        setTimeout(() => {
          setDone(true);
          setTimeout(() => onCompleteRef.current(), 500);
        }, 600);
      }
    }, 320);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] px-6"
        >
          {/* ASCII-style logo */}
          <pre className="mb-8 text-[10px] leading-tight text-emerald-400 select-none text-center">
{`██╗    ██╗███████╗██████╗ ██████╗ ██╗███╗   ██╗ ██████╗
██║    ██║██╔════╝██╔══██╗██╔══██╗██║████╗  ██║██╔════╝
██║ █╗ ██║█████╗  ██║  ██║██║  ██║██║██╔██╗ ██║██║  ███╗
██║███╗██║██╔══╝  ██║  ██║██║  ██║██║██║╚██╗██║██║   ██║
╚███╔███╔╝███████╗██████╔╝██████╔╝██║██║ ╚████║╚██████╔╝
 ╚══╝╚══╝ ╚══════╝╚═════╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝`}
          </pre>

          <p className="mb-6 text-xs text-[#6b7280] tracking-widest uppercase">
            Wedding Assistant — Rhesi &amp; Shiddiq
          </p>

          {/* Boot lines */}
          <div className="w-full max-w-sm font-mono text-xs space-y-1">
            {lines.map((line, idx) => {
              if (line == null) return null;
              return (
              <motion.p
                key={idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className={
                  line.startsWith(">")
                    ? "text-[#6b7280]"
                    : line === ""
                    ? "py-1"
                    : "text-emerald-400 font-bold"
                }
              >
                {line}
                {idx === lines.length - 1 && !done && (
                  <span className="cursor-blink" />
                )}
              </motion.p>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-8 w-full max-w-sm h-px bg-white/5 overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-emerald-400"
              initial={{ width: "0%" }}
              animate={{ width: done ? "100%" : `${(lines.length / BOOT_LINES.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
