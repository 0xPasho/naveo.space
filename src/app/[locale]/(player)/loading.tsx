// (player) loading boundary — lesson-shaped skeleton: top context bar +
// 50/50 split (read + exercise) + footer bar. Pure Tailwind.
export default function PlayerLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="h-12 animate-pulse border-b-2 border-line-strong bg-bg-surface" />
      <div className="grid flex-1 min-h-0 grid-cols-2 gap-0 overflow-hidden">
        <div className="animate-pulse border-r-2 border-line-strong bg-bg-surface" />
        <div className="animate-pulse bg-bg-surface" />
      </div>
      <div className="h-16 animate-pulse border-t-2 border-line-strong bg-bg-surface" />
    </div>
  )
}
