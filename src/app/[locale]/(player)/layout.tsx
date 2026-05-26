import { Hud } from "@/common/layout/hud"

type Props = Readonly<{
  children: React.ReactNode
}>

// (player) layout — immersive lesson player. No sidebar (focus mode). Hud
// (64px) sits on top; main fills the rest and scrolls when content overflows.
export default function PlayerLayout({ children }: Props) {
  return (
    <div className="flex h-dvh min-w-0 flex-col overflow-hidden bg-bg-deep">
      <Hud />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
