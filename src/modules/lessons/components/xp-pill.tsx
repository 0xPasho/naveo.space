// Brief floating "+10 XP" pill anchored above the NEXT button. Re-mount
// the component (via a changing key) to re-fire the animation. The pill
// auto-fades; no JS timer needed.
export function XPPill({ amount = 10 }: { amount?: number }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute -top-8 right-0 inline-flex items-center gap-1 rounded-full border border-stat-xp/40 bg-stat-xp/10 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider text-stat-xp shadow-[0_0_24px_-8px_var(--stat-xp)] animate-xp-gain"
    >
      +{amount} XP
    </span>
  )
}
