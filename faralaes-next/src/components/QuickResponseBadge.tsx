type QuickResponseBadgeProps = {
  show?: boolean | null;
  compact?: boolean;
};

export default function QuickResponseBadge({
  show,
  compact = false,
}: QuickResponseBadgeProps) {
  if (!show) {
    return null;
  }

  return (
    <span
      className={`inline-flex rounded-full border border-green-100 bg-white font-black uppercase tracking-wide text-green-800 shadow-sm ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      }`}
    >
      Responde rápido
    </span>
  );
}
