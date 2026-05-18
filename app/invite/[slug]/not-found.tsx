export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      <pre className="text-emerald-400 text-[10px] leading-tight mb-6 select-none">
{`╔══════════════════════════╗
║   404 — GUEST NOT FOUND  ║
╚══════════════════════════╝`}
      </pre>
      <p className="text-sm text-[#6b7280] max-w-xs leading-relaxed">
        Link undangan ini tidak valid atau sudah tidak aktif.
        <br />
        Silakan hubungi pengantin untuk link yang benar.
      </p>
    </div>
  );
}
