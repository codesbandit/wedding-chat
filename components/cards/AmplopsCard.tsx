"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { wedding } from "@/lib/wedding-config";

export default function AmplopsCard() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-[#1e1e1e] border border-white/10 rounded-xl overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-white/7 flex items-center gap-2">
        <span>💳</span>
        <span className="text-xs text-[#6b7280] uppercase tracking-wider">Amplop Digital</span>
      </div>

      {wedding.amplop.map((acc, i) => (
        <div key={i} className="px-4 py-4">
          <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-3">
            {acc.bank}
          </p>

          <div className="space-y-2">
            {/* Account number row */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] text-[#6b7280] mb-0.5">Nomor Rekening</p>
                <p className="text-lg font-bold text-[#f0f0f0] tracking-wider tabular-nums">
                  {acc.accountNumber}
                </p>
              </div>
              <button
                onClick={() => handleCopy(acc.accountNumber, `num-${i}`)}
                className="accent-ring flex-shrink-0 text-xs px-3 py-1.5 rounded bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20 transition-all duration-200 active:scale-95 min-w-[72px] text-center"
              >
                {copied === `num-${i}` ? "✓ Disalin" : "Salin"}
              </button>
            </div>

            {/* Account name */}
            <div>
              <p className="text-[10px] text-[#6b7280] mb-0.5">Atas Nama</p>
              <p className="text-sm text-[#d1d5db]">{acc.accountName}</p>
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
