// (site) loading boundary. The layout already provides the sidebar + Hud;
// here we just render the chunky skeleton placeholders for the content area.
export default function SiteLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 pb-12 pt-6 md:px-8">
      <div className="h-40 w-full animate-pulse rounded-2xl border-2 border-line-soft bg-bg-surface shadow-elev-3" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-32 animate-pulse rounded-xl border-2 border-line-soft bg-bg-surface shadow-elev-3" />
        <div className="h-32 animate-pulse rounded-xl border-2 border-line-soft bg-bg-surface shadow-elev-3" />
        <div className="h-32 animate-pulse rounded-xl border-2 border-line-soft bg-bg-surface shadow-elev-3" />
      </div>
      <div className="h-24 w-full animate-pulse rounded-xl border-2 border-line-soft bg-bg-surface shadow-elev-3" />
    </div>
  )
}
