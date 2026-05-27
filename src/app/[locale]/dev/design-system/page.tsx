import {
  Bolt,
  Brain,
  Crown,
  Dumbbell,
  Flame,
  Gem,
  Heart,
  Home,
  Route,
  Sparkles,
  Users,
} from "lucide-react"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import type { ContentLocale } from "@/modules/content/types"

import {
  BottomTabs,
  Button,
  Callout,
  Card,
  Chip,
  ChunkyProgress,
  Countdown,
  DialogBubble,
  Eyebrow,
  FeedbackStrip,
  HudPill,
  Input,
  LeagueRow,
  LessonNode,
  LessonSubHeader,
  Mascot,
  MCQOption,
  RubricCheck,
  SegmentedProgress,
  Separator,
  Skeleton,
  StarRating,
  StatTile,
  StreakGrid,
  TopHud,
  TrackBanner,
  XpChart,
} from "@/common/components/ui"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

const SURFACE_TOKENS = [
  { name: "bg-deep", hex: "#0b1018", swatch: "bg-bg-deep" },
  { name: "bg-surface", hex: "#131a26", swatch: "bg-bg-surface" },
  { name: "bg-raised", hex: "#1a2233", swatch: "bg-bg-raised" },
  { name: "bg-sunken", hex: "#080c13", swatch: "bg-bg-sunken" },
]

const INK_TOKENS = [
  { name: "ink-1", hex: "#f3f6fb", text: "text-ink-1" },
  { name: "ink-2", hex: "#c5cee0", text: "text-ink-2" },
  { name: "ink-3", hex: "#8896ad", text: "text-ink-3" },
  { name: "ink-4", hex: "#54607a", text: "text-ink-4" },
]

const TRACKS = [
  { id: "prompting", name: "Prompting", hex: "#4fb7ff", swatch: "bg-track-prompting" },
  { id: "mcp", name: "MCP", hex: "#9d70ff", swatch: "bg-track-mcp" },
  { id: "skills", name: "Skills", hex: "#ffb23e", swatch: "bg-track-skills" },
  { id: "agents", name: "Agents", hex: "#ff5a8c", swatch: "bg-track-agents" },
  { id: "tooling", name: "Tooling", hex: "#b8e63a", swatch: "bg-track-tooling" },
  { id: "evals", name: "Evals", hex: "#ff7551", swatch: "bg-track-evals" },
] as const

const STATS = [
  { name: "stat-xp", hex: "#f5c24e", swatch: "bg-stat-xp" },
  { name: "stat-streak", hex: "#ff7551", swatch: "bg-stat-streak" },
  { name: "stat-heart", hex: "#ff4e73", swatch: "bg-stat-heart" },
  { name: "stat-gem", hex: "#7cb7ff", swatch: "bg-stat-gem" },
]

const ELEVATIONS = [
  { name: "elev-1", className: "shadow-elev-1", note: "Chips, segmented" },
  { name: "elev-2", className: "shadow-elev-2", note: "Buttons, MCQ" },
  { name: "elev-3", className: "shadow-elev-3", note: "Cards, primary CTA" },
  { name: "elev-4", className: "shadow-elev-4", note: "Modals, boss nodes" },
]

const RADII = [
  { name: "rounded-xs", value: "8" },
  { name: "rounded-sm", value: "12" },
  { name: "rounded-md", value: "16" },
  { name: "rounded-lg", value: "20" },
  { name: "rounded-xl", value: "28" },
  { name: "rounded-2xl", value: "40" },
]

const NAV = [
  { group: "Foundations", items: [
    { id: "colors-surfaces", label: "Surfaces" },
    { id: "colors-ink", label: "Ink" },
    { id: "colors-tracks", label: "Tracks" },
    { id: "colors-stats", label: "Stats & status" },
    { id: "typography", label: "Typography" },
    { id: "radius", label: "Radius" },
    { id: "elevation", label: "Elevation" },
  ]},
  { group: "Primitives", items: [
    { id: "buttons-sizes", label: "Buttons · sizes" },
    { id: "buttons-variants", label: "Buttons · variants" },
    { id: "buttons-tracks", label: "Buttons · tracks" },
    { id: "chips", label: "Chips" },
    { id: "hud-pills", label: "HUD pills" },
    { id: "inputs", label: "Inputs" },
    { id: "callouts", label: "Callouts" },
    { id: "progress", label: "Progress" },
    { id: "lesson-nodes", label: "Lesson nodes" },
    { id: "mcq", label: "MCQ options" },
    { id: "track-banner", label: "Track banner" },
    { id: "mascots", label: "Mascots" },
    { id: "dialog-bubble", label: "Dialog bubble" },
    { id: "feedback", label: "Feedback strip" },
    { id: "skeleton", label: "Skeleton" },
    { id: "star-rating", label: "Star rating" },
    { id: "rubric", label: "Rubric checklist" },
    { id: "xp-chart", label: "Weekly XP chart" },
    { id: "streak-grid", label: "Streak grid" },
    { id: "league", label: "League rows" },
    { id: "bottom-tabs", label: "Bottom tabs" },
  ]},
  { group: "Applied screens", items: [
    { id: "applied-dashboard", label: "Bridge dashboard" },
    { id: "applied-track-home", label: "Track home" },
    { id: "applied-lesson", label: "Lesson player" },
    { id: "applied-complete", label: "Lesson complete" },
    { id: "applied-leaderboard", label: "Honor league" },
  ]},
] as const

export default async function DesignSystemPage({ params }: Props) {
  if (process.env.NODE_ENV === "production") notFound()
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="min-h-screen bg-bg-deep">
      <div className="mx-auto grid max-w-[1480px] grid-cols-[260px_1fr] gap-10 px-8 py-10">
        <aside className="sticky top-10 self-start max-h-[calc(100vh-5rem)] overflow-y-auto pr-2">
          <div className="mb-6 flex items-center gap-3">
            <div className="inline-flex size-10 items-center justify-center rounded-md bg-primary shadow-[0_4px_0_0_var(--primary-shadow)]">
              <Sparkles className="size-5 text-primary-foreground" strokeWidth={3} />
            </div>
            <div>
              <div className="font-display font-bold text-lg leading-none tracking-tight text-ink-1">
                Naveo <span className="text-primary">·</span> Bridge
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
                v1 · design system
              </div>
            </div>
          </div>
          <nav className="flex flex-col gap-4">
            {NAV.map((group) => (
              <div key={group.group}>
                <div className="mb-1.5 px-2 font-display font-bold text-[10px] uppercase tracking-[0.16em] text-ink-3">
                  {group.group}
                </div>
                <ul className="flex flex-col">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="block rounded-sm px-2.5 py-1.5 font-display font-bold text-[13px] text-ink-2 transition-colors hover:bg-bg-raised hover:text-ink-1"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <header className="mb-12 border-b-2 border-line-soft pb-8">
            <Eyebrow className="text-primary">Naveo · Bridge</Eyebrow>
            <h1 className="mt-2 font-display font-bold text-5xl tracking-tight text-ink-1">
              Design System
            </h1>
            <p className="mt-4 max-w-2xl font-sans font-semibold text-lg text-ink-2">
              Dark-mode chunky-3D for applied-AI learning. Every primitive on
              this page renders from{" "}
              <code className="font-mono text-primary">@/common/components/ui</code>.
              Tokens live in{" "}
              <code className="font-mono text-primary">src/app/globals.css</code>.
            </p>
          </header>

          <Section id="colors-surfaces" title="Colors · Surfaces">
            <SwatchGrid>
              {SURFACE_TOKENS.map((t) => (
                <Swatch key={t.name} className={t.swatch} name={t.name} hex={t.hex} />
              ))}
            </SwatchGrid>
          </Section>

          <Section id="colors-ink" title="Colors · Ink (foreground tiers)">
            <Card className="p-6">
              <div className="flex flex-col gap-3">
                {INK_TOKENS.map((t) => (
                  <div key={t.name} className="flex items-baseline justify-between">
                    <span className={`font-display font-bold text-2xl ${t.text}`}>
                      The crew aligns the bridge
                    </span>
                    <span className="font-mono text-xs text-ink-3">{t.name} · {t.hex}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Section>

          <Section id="colors-tracks" title="Colors · Tracks">
            <SwatchGrid>
              {TRACKS.map((t) => (
                <Swatch key={t.id} className={t.swatch} name={`track-${t.id}`} hex={t.hex} />
              ))}
            </SwatchGrid>
          </Section>

          <Section id="colors-stats" title="Colors · Stats & status">
            <SwatchGrid>
              {STATS.map((t) => (
                <Swatch key={t.name} className={t.swatch} name={t.name} hex={t.hex} />
              ))}
            </SwatchGrid>
          </Section>

          <Section id="typography" title="Typography">
            <Card className="p-8">
              <div className="space-y-6">
                <div>
                  <Eyebrow>Display · Fredoka 700</Eyebrow>
                  <div className="mt-2 font-display font-bold text-6xl tracking-tight text-ink-1">
                    Coordinate the bridge.
                  </div>
                </div>
                <div>
                  <Eyebrow>Title · Fredoka 700 · 32 / 1.1</Eyebrow>
                  <div className="mt-2 font-display font-bold text-3xl tracking-tight text-ink-1">
                    Track 2 · Build your first agent
                  </div>
                </div>
                <div>
                  <Eyebrow>Body · Nunito 600 · 16 / 1.5</Eyebrow>
                  <p className="mt-2 max-w-prose font-sans font-semibold text-base text-ink-2">
                    Body sits at Nunito 600 because 400 reads thin on the dark canvas.
                    Paragraphs use ink-2; captions and eyebrows drop to ink-3.
                  </p>
                </div>
                <div>
                  <Eyebrow>Mono · JetBrains Mono 400</Eyebrow>
                  <pre className="mt-2 rounded-md bg-bg-sunken p-4 font-mono text-sm text-ink-2 shadow-elev-inset">
                    {`const greet = (crew) => `}<span className="text-primary">{`\`hi $\{crew\}\``}</span>;
                  </pre>
                </div>
              </div>
            </Card>
          </Section>

          <Section id="radius" title="Radius">
            <SwatchGrid>
              {RADII.map((r) => (
                <Card key={r.name} className="p-4">
                  <div className={`h-16 w-full bg-primary ${r.name}`} />
                  <div className="mt-3 font-display font-bold text-sm text-ink-1">{r.name}</div>
                  <div className="font-mono text-xs text-ink-3">{r.value}px</div>
                </Card>
              ))}
            </SwatchGrid>
          </Section>

          <Section id="elevation" title="Elevation · chunky drops">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {ELEVATIONS.map((e) => (
                <div key={e.name} className="flex flex-col items-center gap-3">
                  <div className={`h-20 w-full rounded-xl border-2 border-line-soft bg-bg-surface ${e.className}`} />
                  <div className="text-center">
                    <div className="font-display font-bold text-sm text-ink-1">{e.name}</div>
                    <div className="font-mono text-[11px] text-ink-3">{e.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="buttons-sizes" title="Buttons · sizes">
            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
                <Separator orientation="vertical" />
                <Button size="icon" aria-label="icon"><Bolt /></Button>
                <Button size="icon-sm" aria-label="icon-sm"><Bolt /></Button>
                <Button size="icon-lg" aria-label="icon-lg"><Bolt /></Button>
              </div>
            </Card>
          </Section>

          <Section id="buttons-variants" title="Buttons · variants">
            <Card className="p-6">
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </Card>
          </Section>

          <Section id="buttons-tracks" title="Buttons · tracks">
            <Card className="p-6">
              <div className="flex flex-wrap gap-3">
                {TRACKS.map((t) => (
                  <Button key={t.id} variant={`track-${t.id}` as const}>
                    {t.name}
                  </Button>
                ))}
              </div>
            </Card>
          </Section>

          <Section id="chips" title="Chips">
            <Card className="p-6">
              <div className="flex flex-wrap gap-2">
                <Chip tone="primary">Primary</Chip>
                <Chip tone="success">Success</Chip>
                <Chip tone="warn">Warn</Chip>
                <Chip tone="danger">Danger</Chip>
                <Chip tone="xp">XP</Chip>
                <Chip tone="streak">Streak</Chip>
                <Chip tone="heart">Heart</Chip>
                <Chip tone="gem">Gem</Chip>
                <Chip tone="outline">Outline</Chip>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {TRACKS.map((t) => (
                  <Chip key={t.id} tone={t.id}>{t.name}</Chip>
                ))}
              </div>
            </Card>
          </Section>

          <Section id="hud-pills" title="HUD pills">
            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <HudPill kind="xp" value="1,240" label="XP" icon={<Bolt className="size-3.5" strokeWidth={2.5} />} />
                <HudPill kind="streak" value="14" label="Streak" icon={<Flame className="size-3.5" strokeWidth={2.5} />} />
                <HudPill kind="heart" value="5" label="Lives" icon={<Heart className="size-3.5" strokeWidth={2.5} />} />
                <HudPill kind="gem" value="320" label="Gems" icon={<Gem className="size-3.5" strokeWidth={2.5} />} />
              </div>
            </Card>
          </Section>

          <Section id="inputs" title="Inputs">
            <Card className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Enter your prompt…" />
                <Input placeholder="Disabled state" disabled />
              </div>
            </Card>
          </Section>

          <Section id="callouts" title="Callouts">
            <div className="grid gap-3 md:grid-cols-2">
              <Callout tone="info" eyebrow="Tip">
                The body sits in Nunito 600 because 400 reads thin on dark.
              </Callout>
              <Callout tone="success" eyebrow="Passed">
                All four criteria are green. Ready to ship.
              </Callout>
              <Callout tone="warn" eyebrow="Heads up">
                You&apos;re three lessons behind your weekly target.
              </Callout>
              <Callout tone="danger" eyebrow="Error">
                The model returned an unparseable tool call.
              </Callout>
            </div>
          </Section>

          <Section id="progress" title="Progress">
            <Card className="p-6">
              <div className="space-y-5">
                <ChunkyProgress value={62} label="XP this week" tone="xp" showLabel />
                <ChunkyProgress value={88} label="Track · MCP" tone="mcp" showLabel />
                <ChunkyProgress value={34} label="Track · Agents" tone="agents" showLabel />
                <Separator />
                <SegmentedProgress total={6} current={3} tone="prompting" />
                <SegmentedProgress total={5} current={5} tone="skills" />
              </div>
            </Card>
          </Section>

          <Section id="lesson-nodes" title="Lesson nodes">
            <Card className="p-8">
              <div className="flex flex-wrap items-end gap-8">
                <LessonNode track="prompting" state="done" icon="★" label="Done" />
                <LessonNode track="mcp" state="active" icon="★" label="Active" />
                <LessonNode track="skills" state="available" icon="★" label="Open" />
                <LessonNode track="agents" state="locked" icon="✕" label="Locked" />
                <LessonNode track="tooling" state="available" icon="★" label="Open" />
                <LessonNode track="evals" state="available" icon="★" label="Open" />
              </div>
            </Card>
          </Section>

          <Section id="mcq" title="MCQ options · 4 states">
            <Card className="p-6">
              <div className="grid gap-3 md:grid-cols-2">
                <MCQOption letter="A" label="Idle option. choose me" state="idle" />
                <MCQOption letter="B" label="Selected option" state="selected" />
                <MCQOption letter="C" label="Correct answer" state="correct" />
                <MCQOption letter="D" label="Wrong answer" state="wrong" />
              </div>
            </Card>
          </Section>

          <Section id="track-banner" title="Track banner">
            <div className="space-y-4">
              <TrackBanner
                track="prompting"
                eyebrow="Section 1 · Unit 4"
                title="Use prompts that ground the model"
              />
              <TrackBanner
                track="mcp"
                eyebrow="Section 2 · Unit 2"
                title="Wire your first MCP server"
              />
            </div>
          </Section>

          <Section id="mascots" title="Mascots (placeholder)">
            <Card className="p-8">
              <div className="flex flex-wrap items-end gap-8">
                <Mascot crew="vega" />
                <Mascot crew="atlas" />
                <Mascot crew="echo" />
                <Mascot crew="forge" />
              </div>
            </Card>
          </Section>

          <Section id="dialog-bubble" title="Dialog bubble">
            <Card className="p-8">
              <div className="flex items-start gap-6">
                <Mascot crew="echo" size={72} showLabel={false} />
                <DialogBubble>
                  Pin the user goal at the top of every prompt. that&apos;s the
                  anchor every model behavior follows from.
                </DialogBubble>
              </div>
            </Card>
          </Section>

          <Section id="feedback" title="Feedback strip">
            <div className="space-y-4 overflow-hidden rounded-xl">
              <FeedbackStrip
                tone="success"
                title="Amazing!"
                body="All four criteria are green. +12 XP."
                action={<Button>Continue</Button>}
              />
              <FeedbackStrip
                tone="error"
                title="Not quite"
                body="The model needs a concrete goal before the system prompt."
                action={<Button variant="destructive">Try again</Button>}
                secondary={<Button variant="ghost">Skip</Button>}
              />
            </div>
          </Section>

          <Section id="skeleton" title="Skeleton">
            <Card className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          </Section>

          <Section id="star-rating" title="Star rating">
            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-8">
                <StarRating value={0} max={3} />
                <StarRating value={1} max={3} />
                <StarRating value={2} max={3} />
                <StarRating value={3} max={3} />
                <Separator orientation="vertical" />
                <StarRating value={4} max={5} size={24} />
              </div>
            </Card>
          </Section>

          <Section id="rubric" title="Rubric checklist">
            <div className="grid gap-3 md:grid-cols-2">
              <RubricCheck
                state="passed"
                label="Goal is named in the first sentence"
                hint="Pinned the user's intent before any system prompt. clean."
              />
              <RubricCheck state="passed" label="Output format is explicit" />
              <RubricCheck
                state="failed"
                label="Tool call returns parseable JSON"
                hint="The trailing comma broke the parser. Add a schema constraint."
              />
              <RubricCheck state="pending" label="Edge cases are covered" />
            </div>
          </Section>

          <Section id="xp-chart" title="Weekly XP chart">
            <Card className="p-6">
              <XpChart
                days={[
                  { label: "M", value: 40 },
                  { label: "T", value: 80 },
                  { label: "W", value: 55 },
                  { label: "T", value: 95 },
                  { label: "F", value: 30 },
                  { label: "S", value: 70 },
                  { label: "S", value: 62, isToday: true },
                ]}
              />
            </Card>
          </Section>

          <Section id="streak-grid" title="Streak grid">
            <Card className="p-6">
              <div className="flex flex-col gap-4">
                <StreakGrid
                  weeks={[
                    [3, 2, 3, 0, 1, 3, 3],
                    [2, 3, 3, 3, 2, 1, 0],
                    [0, 1, 2, 3, 3, 3, 2],
                    [3, 3, 2, 0, 0, 1, 2],
                  ]}
                />
                <p className="font-sans text-xs font-semibold text-ink-3">
                  4 weeks · intensity from 0 (idle) → 3 (full streak day)
                </p>
              </div>
            </Card>
          </Section>

          <Section id="league" title="League rows">
            <div className="flex flex-col gap-2">
              <LeagueRow rank={1} name="Vega Prime" sub="Track · Prompting" xp="2,480" zone="promote" avatar={<Mascot crew="vega" size={36} showLabel={false} />} />
              <LeagueRow rank={2} name="Atlas Node" sub="Track · MCP" xp="2,120" zone="promote" avatar={<Mascot crew="atlas" size={36} showLabel={false} />} />
              <LeagueRow rank={3} name="Echo Drift" sub="Track · Skills" xp="1,940" zone="promote" avatar={<Mascot crew="echo" size={36} showLabel={false} />} />
              <LeagueRow rank={7} name="You" sub="Track · Agents" xp="1,420" zone="safe" isCurrentUser avatar={<Mascot crew="forge" size={36} showLabel={false} />} />
              <LeagueRow rank={12} name="Forge Spark" sub="Track · Evals" xp="980" zone="demote" avatar={<Mascot crew="forge" size={36} showLabel={false} />} />
            </div>
          </Section>

          <Section id="bottom-tabs" title="Bottom tabs (mobile)">
            <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border-2 border-line-soft bg-bg-deep shadow-elev-3">
              <div className="flex h-40 items-center justify-center font-display font-bold text-sm text-ink-3">
                [ screen content ]
              </div>
              <BottomTabs
                active="bridge"
                items={[
                  { id: "bridge", label: "Bridge", icon: <Home className="size-full" strokeWidth={2.5} /> },
                  { id: "tracks", label: "Tracks", icon: <Route className="size-full" strokeWidth={2.5} /> },
                  { id: "practice", label: "Practice", icon: <Dumbbell className="size-full" strokeWidth={2.5} /> },
                  { id: "league", label: "League", icon: <Crown className="size-full" strokeWidth={2.5} /> },
                  { id: "crew", label: "Crew", icon: <Users className="size-full" strokeWidth={2.5} /> },
                ]}
              />
            </div>
          </Section>

          <AppliedScreens />

          <footer className="mt-20 border-t-2 border-line-soft pt-6 font-mono text-xs uppercase tracking-wider text-ink-3">
            Naveo · Bridge. see <code className="text-primary">docs/design-system.md</code>
          </footer>
        </main>
      </div>
    </div>
  )
}

/* ============================================================
   Applied screens. five compositions showing primitives in a
   real layout. They mirror the Naveo Screens reference (Bridge
   dashboard, Track home desktop, Lesson player, Lesson complete,
   Honor League) and act as the smoke test for the DS.
   ============================================================ */

const HUD_NAV = [
  { id: "bridge", label: "Bridge" },
  { id: "tracks", label: "Tracks" },
  { id: "practice", label: "Practice" },
  { id: "league", label: "League" },
  { id: "crew", label: "Crew" },
] as const

function BrandMark() {
  return (
    <>
      <div className="inline-flex size-9 items-center justify-center rounded-sm bg-primary shadow-[0_4px_0_0_var(--primary-shadow)]">
        <Sparkles className="size-5 text-primary-foreground" strokeWidth={3} />
      </div>
      <span className="font-display font-bold text-xl tracking-tight text-ink-1">
        naveo<span className="text-primary">.</span>
      </span>
    </>
  )
}

function HudPillRow() {
  return (
    <>
      <HudPill kind="xp" value="1,248" label="XP" icon={<Bolt className="size-3.5" strokeWidth={2.5} />} />
      <HudPill kind="streak" value="12" icon={<Flame className="size-3.5" strokeWidth={2.5} />} />
      <HudPill kind="heart" value="4" icon={<Heart className="size-3.5" strokeWidth={2.5} />} />
      <HudPill kind="gem" value="248" icon={<Gem className="size-3.5" strokeWidth={2.5} />} />
    </>
  )
}

function UserBadge() {
  return (
    <div className="inline-flex size-10 items-center justify-center rounded-sm border-2 border-line-strong bg-bg-raised font-display font-bold text-sm text-ink-1">
      YO
    </div>
  )
}

function ScreenFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-line-strong bg-bg-deep shadow-elev-3">
      {children}
    </div>
  )
}

function AppliedScreens() {
  return (
    <>
      {/* ── Bridge Dashboard ─────────────────────────────────────── */}
      <Section id="applied-dashboard" title="Applied · Bridge dashboard">
        <ScreenFrame>
          <TopHud
            nav={HUD_NAV}
            active="bridge"
            brand={<BrandMark />}
            pills={<HudPillRow />}
            trailing={<UserBadge />}
          />

          {/* Hero banner */}
          <div className="px-8 pt-7">
            <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/20 to-bg-surface p-6">
              <Eyebrow className="text-primary">Bridge · welcome back, YO</Eyebrow>
              <h2 className="mt-1.5 font-display font-bold text-4xl tracking-tight leading-tight text-ink-1">
                One more lesson and your streak hits 13.
              </h2>
              <p className="mt-2 font-sans font-semibold text-base text-ink-2">
                You left off at{" "}
                <span className="font-bold text-track-prompting">
                  Prompting · Section 1 · Unit 4
                </span>
                {" "} Ground the model with system prompts.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button size="lg">Continue lesson</Button>
                <Button variant="secondary">Practice instead</Button>
                <div className="ml-auto flex items-center gap-3">
                  <Mascot crew="echo" size={56} showLabel={false} />
                  <DialogBubble>
                    Pick a 5-min drill and I&apos;ll grade you live.
                  </DialogBubble>
                </div>
              </div>
            </div>
          </div>

          {/* Crew row */}
          <div className="px-8 pt-6">
            <Eyebrow className="mb-3">Crew · standing by</Eyebrow>
            <div className="grid grid-cols-4 gap-4">
              <CrewStatusTile crew="vega" role="Skills" line="Watching for fluff. Ready to mark." status="Auditing" tone="skills" />
              <CrewStatusTile crew="echo" role="Rubric" line="Last 6 calls passed. Standing by." status="Idle" tone="success" />
              <CrewStatusTile crew="atlas" role="Runtime" line="Heavy run. 80k tokens, batch eval." status="Running" tone="mcp" />
              <CrewStatusTile crew="forge" role="Evals" line="3 rubrics drafted. Awaiting review." status="Drafting" tone="evals" />
            </div>
          </div>

          {/* Lower grid: weekly XP + streak + practice rail */}
          <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-4 p-8 pt-6">
            <Card className="p-5">
              <div className="flex items-baseline justify-between">
                <div>
                  <Eyebrow>This week</Eyebrow>
                  <div className="mt-1 font-display font-bold text-3xl tracking-tight text-ink-1">
                    340 <span className="text-base text-ink-3">XP</span>
                  </div>
                </div>
                <Chip tone="primary">+22% vs last</Chip>
              </div>
              <div className="mt-4">
                <XpChart
                  height={110}
                  days={[
                    { label: "M", value: 24 },
                    { label: "T", value: 56 },
                    { label: "W", value: 36 },
                    { label: "T", value: 78 },
                    { label: "F", value: 92, isToday: true },
                    { label: "S", value: 38 },
                    { label: "S", value: 16 },
                  ]}
                />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-baseline justify-between">
                <div>
                  <Eyebrow>Streak</Eyebrow>
                  <div className="mt-1 flex items-center gap-2 font-display font-bold text-3xl tracking-tight text-ink-1">
                    12
                    <Flame className="size-6 text-stat-streak" strokeWidth={2.5} />
                  </div>
                </div>
                <Chip tone="warn">Best 18</Chip>
              </div>
              <div className="mt-4">
                <StreakGrid
                  cellSize={28}
                  weeks={[[3, 3, 3, 3, 1, 0, 0]]}
                />
              </div>
              <p className="mt-3 text-center font-sans text-xs font-bold text-ink-3">
                Today:{" "}
                <span className="text-stat-streak">complete 1 lesson</span>{" "}
                to keep the flame
              </p>
            </Card>

            <Card className="p-5">
              <Eyebrow className="mb-3">Practice rail</Eyebrow>
              <div className="flex flex-col gap-2">
                <PracticeRailItem track="prompting" label="5-min prompting drill" icon={<Dumbbell className="size-3.5" strokeWidth={2.5} />} />
                <PracticeRailItem track="skills" label="Build a mini-skill" icon={<Brain className="size-3.5" strokeWidth={2.5} />} />
                <PracticeRailItem track="agents" label="Chat with Echo" icon={<Sparkles className="size-3.5" strokeWidth={2.5} />} />
                <PracticeRailItem track="mcp" label="Wire a tool to MCP" icon={<Bolt className="size-3.5" strokeWidth={2.5} />} />
              </div>
            </Card>
          </div>
        </ScreenFrame>
      </Section>

      {/* ── Track Home Desktop ───────────────────────────────────── */}
      <Section id="applied-track-home" title="Applied · Track home (desktop)">
        <ScreenFrame>
          <TopHud
            nav={HUD_NAV}
            active="tracks"
            brand={<BrandMark />}
            pills={<HudPillRow />}
            trailing={<UserBadge />}
          />
          <div className="grid grid-cols-[260px_1fr_320px]" style={{ minHeight: 720 }}>
            {/* Track list rail */}
            <aside className="border-r-2 border-line-strong bg-bg-surface p-5">
              <Eyebrow className="mb-3">Tracks</Eyebrow>
              <div className="flex flex-col gap-1.5">
                <TrackRailItem track="prompting" label="Prompting" done={12} total={18} active />
                <TrackRailItem track="mcp" label="MCP" done={4} total={14} />
                <TrackRailItem track="skills" label="Skills" done={0} total={12} />
                <TrackRailItem track="agents" label="Agents" done={0} total={16} locked />
                <TrackRailItem track="tooling" label="Tooling" done={0} total={10} locked />
                <TrackRailItem track="evals" label="Evals" done={0} total={8} locked />
              </div>
            </aside>

            {/* Lesson path */}
            <main className="space-y-6 px-10 py-7">
              <TrackBanner
                track="prompting"
                eyebrow="Section 1 · Unit 4"
                title="Ground the model with system prompts"
              />
              <div className="flex flex-col items-center gap-5 py-4">
                <LessonNode track="prompting" state="done" icon="★" />
                <div style={{ transform: "translateX(-60px)" }}>
                  <LessonNode track="prompting" state="done" icon="✓" />
                </div>
                <div style={{ transform: "translateX(-100px)" }}>
                  <LessonNode track="prompting" state="done" icon="★" />
                </div>
                <div style={{ transform: "translateX(-60px)" }}>
                  <LessonNode track="prompting" state="done" icon="★" />
                </div>
                <LessonNode track="prompting" state="active" icon="★" />
                <div style={{ transform: "translateX(60px)" }}>
                  <LessonNode track="skills" state="available" icon="◆" />
                </div>
                <div style={{ transform: "translateX(100px)" }}>
                  <LessonNode track="prompting" state="locked" icon="★" />
                </div>
                <div style={{ transform: "translateX(60px)" }}>
                  <LessonNode track="prompting" state="locked" icon="★" />
                </div>
                <LessonNode track="prompting" state="locked" icon="✕" size={110} />
              </div>
            </main>

            {/* Section guide */}
            <aside className="space-y-5 border-l-2 border-line-strong bg-bg-surface p-6">
              <div className="flex justify-center">
                <Mascot crew="echo" size={88} />
              </div>
              <DialogBubble>
                You are 4 lessons from the boss. Want me to drill you on the
                last 3 ideas?
              </DialogBubble>
              <div>
                <Eyebrow className="mb-2">Section 1 progress</Eyebrow>
                <ChunkyProgress value={44} tone="prompting" />
                <div className="mt-2 flex justify-between font-mono text-[11px] font-bold text-ink-3">
                  <span>4 of 9 lessons</span>
                  <span>44%</span>
                </div>
              </div>
              <div>
                <Eyebrow className="mb-2">What you will learn</Eyebrow>
                <div className="flex flex-col gap-2">
                  <RubricCheck state="passed" label="What a system prompt is" />
                  <RubricCheck state="passed" label="Role + tone + constraint" />
                  <RubricCheck state="passed" label="Ground vs improvise" />
                  <RubricCheck state="pending" label="Caching system prompts" />
                  <RubricCheck state="pending" label="Boss: write your own" />
                </div>
              </div>
            </aside>
          </div>
        </ScreenFrame>
      </Section>

      {/* ── Lesson Player (dual pane) ────────────────────────────── */}
      <Section id="applied-lesson" title="Applied · Lesson player (dual-pane)">
        <ScreenFrame>
          <TopHud
            nav={HUD_NAV}
            active="tracks"
            brand={<BrandMark />}
            pills={<HudPillRow />}
            trailing={<UserBadge />}
          />
          <LessonSubHeader
            breadcrumb={{
              track: "prompting",
              trackLabel: "Prompting",
              unit: "Section 1 · Unit 4",
              lesson: "Lesson 5",
            }}
            progress={45}
            step="STEP 3 / 6"
            trailing={<Button variant="secondary" size="sm">Tutor</Button>}
          />
          <div className="grid grid-cols-2" style={{ minHeight: 620 }}>
            {/* Reading pane */}
            <div className="space-y-5 border-r-2 border-line-strong p-8">
              <Chip tone="primary">Reading · 2 min</Chip>
              <h1 className="font-display font-bold text-3xl tracking-tight leading-tight text-ink-1">
                System prompts{" "}
                <span className="text-track-prompting">ground</span> the model.
              </h1>
              <p className="font-sans font-semibold text-base leading-relaxed text-ink-2">
                Before a user even types, you can hand Claude a role, a tone,
                and a set of rules. That is a{" "}
                <strong className="text-ink-1">system prompt</strong>. Without it
                the model improvises; with it the model has a stance.
              </p>
              <Callout tone="warn" eyebrow="Vega · crew tip">
                If you cannot say the system prompt in one breath, the model
                cannot act on it. Tight is better than ornate.
              </Callout>
              <div>
                <Chip tone="skills">Example</Chip>
                <pre className="mt-2 rounded-md bg-bg-sunken p-4 font-mono text-xs leading-relaxed text-ink-2 shadow-elev-inset">
                  {`{
  "role": "system",
  "content": "You are Vega, a terse senior engineer.
   Refuse fluff. Answer in <= 3 sentences."
}`}
                </pre>
              </div>
            </div>

            {/* Practice pane */}
            <div className="flex flex-col bg-track-prompting/5 p-8">
              <div className="flex gap-2">
                <Chip tone="primary">Multiple choice</Chip>
                <Chip tone="xp">+25 XP</Chip>
              </div>
              <h2 className="mt-3 font-display font-bold text-2xl tracking-tight leading-snug text-ink-1">
                Which system prompt grounds the model most firmly?
              </h2>
              <div className="mt-5 flex flex-1 flex-col gap-3">
                <MCQOption letter="A" label='"Be helpful."' state="idle" />
                <MCQOption letter="B" label='"You are Vega, a terse senior engineer. Refuse fluff. Answer in ≤ 3 sentences."' state="correct" />
                <MCQOption letter="C" label='"Always answer in bullet points."' state="idle" />
                <MCQOption letter="D" label='"Be a good assistant for the user."' state="idle" />
              </div>
              <div className="mt-5 overflow-hidden rounded-md">
                <FeedbackStrip
                  tone="success"
                  title="That is it."
                  body="B grounds the model with a role, a tone, AND a hard constraint. Echo gave you full marks."
                  action={<Button>Continue</Button>}
                  secondary={<Button variant="secondary">Explain</Button>}
                />
              </div>
            </div>
          </div>
        </ScreenFrame>
      </Section>

      {/* ── Lesson Complete ──────────────────────────────────────── */}
      <Section id="applied-complete" title="Applied · Lesson complete (celebration)">
        <ScreenFrame>
          <TopHud
            nav={HUD_NAV}
            active="tracks"
            brand={<BrandMark />}
            pills={<HudPillRow />}
            trailing={<UserBadge />}
          />
          <div className="relative">
            {/* Confetti dots */}
            <ConfettiBackdrop />
            <div className="relative flex flex-col items-center px-6 py-10">
              <Mascot crew="echo" size={120} showLabel={false} />
              <Eyebrow className="mt-4 text-primary">Lesson complete</Eyebrow>
              <h1 className="mt-1 font-display font-bold text-5xl tracking-tight text-ink-1">
                Well grounded.
              </h1>
              <p className="mt-3 max-w-md text-center font-sans font-semibold text-base text-ink-2">
                You wrote a system prompt that named a role and a hard
                constraint. Echo gave it full marks.
              </p>
              <div className="mt-7 flex w-full max-w-3xl justify-center gap-4">
                <StatTile tone="xp" label="XP earned" value="+25" />
                <StatTile tone="success" label="Accuracy" value="100%" />
                <StatTile tone="prompting" label="Time" value="2:48" />
                <StatTile tone="streak" label="Streak" value="13" />
              </div>
              <div className="mt-7 flex gap-3">
                <Button variant="secondary">Back to path</Button>
                <Button size="lg">Continue lesson 6</Button>
              </div>
            </div>
          </div>
        </ScreenFrame>
      </Section>

      {/* ── Honor League ─────────────────────────────────────────── */}
      <Section id="applied-leaderboard" title="Applied · Honor league">
        <ScreenFrame>
          <TopHud
            nav={HUD_NAV}
            active="league"
            brand={<BrandMark />}
            pills={<HudPillRow />}
            trailing={<UserBadge />}
          />
          <div className="grid grid-cols-[1fr_360px]" style={{ minHeight: 700 }}>
            <main className="space-y-5 p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Eyebrow>Week 18 · 3 days left</Eyebrow>
                  <h1 className="mt-1 font-display font-bold text-4xl tracking-tight text-ink-1">
                    Honor League
                  </h1>
                  <p className="mt-1 font-sans font-semibold text-base text-ink-2">
                    Top 3 promote · Bottom 5 drop · You are{" "}
                    <strong className="text-primary">safe</strong>
                  </p>
                </div>
                <div className="inline-flex size-24 items-center justify-center rounded-full bg-stat-xp shadow-[0_6px_0_0_var(--stat-xp-shadow)]">
                  <Crown className="size-12 text-track-skills-ink" strokeWidth={2.5} />
                </div>
              </div>
              <Card className="space-y-1 p-4">
                <LeagueRow rank={1} name="Mara V." sub="Promotes Sunday" xp={840} zone="promote" avatar={<InitialBadge initials="MV" tone="skills" />} />
                <LeagueRow rank={2} name="Daniel R." sub="Promotes Sunday" xp={792} zone="promote" avatar={<InitialBadge initials="DR" tone="mcp" />} />
                <LeagueRow rank={3} name="Lukas O." sub="Promotes Sunday" xp={610} zone="promote" avatar={<InitialBadge initials="LO" tone="prompting" />} />
                <LeagueRow rank={4} name="You" sub="you · 12 day streak" xp={512} isCurrentUser avatar={<InitialBadge initials="YO" tone="primary" />} />
                <LeagueRow rank={5} name="Sora N." sub="Joined this week" xp={478} avatar={<InitialBadge initials="SN" tone="agents" />} />
                <LeagueRow rank={6} name="Imani T." sub="Joined this week" xp={420} avatar={<InitialBadge initials="IT" tone="tooling" />} />
                <LeagueRow rank={7} name="Jin H." sub="Joined this week" xp={380} avatar={<InitialBadge initials="JH" tone="evals" />} />
                <LeagueRow rank={8} name="Maya P." sub="Joined this week" xp={340} avatar={<InitialBadge initials="MP" tone="prompting" />} />
              </Card>
            </main>

            <aside className="space-y-5 border-l-2 border-line-strong bg-bg-surface p-6">
              <Mascot crew="forge" size={88} />
              <DialogBubble>You earn 1.5× XP this hour. Burn it.</DialogBubble>
              <div>
                <Eyebrow className="mb-2">This week ends</Eyebrow>
                <Countdown
                  units={[
                    { label: "days", value: 3 },
                    { label: "hours", value: 18 },
                    { label: "mins", value: 42 },
                  ]}
                />
              </div>
              <div>
                <Eyebrow className="mb-2">Rewards if you promote</Eyebrow>
                <div className="flex flex-col gap-2">
                  <RewardLine icon={<Gem className="size-4 text-stat-gem" strokeWidth={2.5} />} label="50 gems" />
                  <RewardLine icon={<Bolt className="size-4 text-stat-xp" strokeWidth={2.5} />} label="+200 XP bonus" />
                  <RewardLine icon={<Crown className="size-4 text-stat-xp" strokeWidth={2.5} />} label="Bridge League access" />
                </div>
              </div>
            </aside>
          </div>
        </ScreenFrame>
      </Section>
    </>
  )
}

/* ----------------------------- screen helpers ----------------------------- */

const CREW_TRACK = {
  vega: "skills",
  echo: "prompting",
  atlas: "mcp",
  forge: "evals",
} as const

function CrewStatusTile({
  crew,
  role,
  line,
  status,
  tone,
}: {
  crew: "vega" | "echo" | "atlas" | "forge"
  role: string
  line: string
  status: string
  tone: "skills" | "prompting" | "mcp" | "agents" | "tooling" | "evals" | "success"
}) {
  const trackTextClass = {
    skills: "text-track-skills",
    prompting: "text-track-prompting",
    mcp: "text-track-mcp",
    agents: "text-track-agents",
    tooling: "text-track-tooling",
    evals: "text-track-evals",
    success: "text-success",
  }[tone]
  return (
    <Card className="flex flex-col items-center gap-3 p-5 text-center">
      <Mascot crew={crew} size={72} showLabel={false} />
      <div>
        <div className="font-display font-bold text-base text-ink-1">
          {crew[0].toUpperCase() + crew.slice(1)}
        </div>
        <div className={`mt-0.5 font-display font-bold text-[10px] uppercase tracking-wide ${trackTextClass}`}>
          {role}
        </div>
      </div>
      <p className="font-sans font-semibold text-xs leading-relaxed text-ink-2">
        {line}
      </p>
      <Chip tone={tone === "success" ? "success" : CREW_TRACK[crew]}>{status}</Chip>
    </Card>
  )
}

function PracticeRailItem({
  track,
  label,
  icon,
}: {
  track: "prompting" | "mcp" | "skills" | "agents" | "tooling" | "evals"
  label: string
  icon: React.ReactNode
}) {
  const bg = {
    prompting: "bg-track-prompting text-track-prompting-ink",
    mcp: "bg-track-mcp text-white",
    skills: "bg-track-skills text-track-skills-ink",
    agents: "bg-track-agents text-white",
    tooling: "bg-track-tooling text-track-tooling-ink",
    evals: "bg-track-evals text-white",
  }[track]
  return (
    <button
      type="button"
      className="flex items-center gap-2.5 rounded-sm border-2 border-line-soft bg-bg-raised px-3 py-2.5 text-left transition-colors hover:border-line-strong"
    >
      <span className={`inline-flex size-7 items-center justify-center rounded-xs ${bg}`}>
        {icon}
      </span>
      <span className="flex-1 font-display font-bold text-[13px] text-ink-1">
        {label}
      </span>
      <ChevronRightIcon />
    </button>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-ink-3"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function TrackRailItem({
  track,
  label,
  done,
  total,
  active,
  locked,
}: {
  track: "prompting" | "mcp" | "skills" | "agents" | "tooling" | "evals"
  label: string
  done: number
  total: number
  active?: boolean
  locked?: boolean
}) {
  const trackBgClass = {
    prompting: "bg-track-prompting",
    mcp: "bg-track-mcp",
    skills: "bg-track-skills",
    agents: "bg-track-agents",
    tooling: "bg-track-tooling",
    evals: "bg-track-evals",
  }[track]
  const trackBorderClass = {
    prompting: "border-track-prompting",
    mcp: "border-track-mcp",
    skills: "border-track-skills",
    agents: "border-track-agents",
    tooling: "border-track-tooling",
    evals: "border-track-evals",
  }[track]
  return (
    <button
      type="button"
      disabled={locked}
      className={[
        "flex items-center gap-3 rounded-sm border-2 px-3 py-2.5 text-left transition-colors",
        active ? `${trackBorderClass} bg-bg-raised` : "border-transparent hover:bg-bg-raised",
        locked ? "opacity-50" : "",
      ].join(" ")}
    >
      <span
        className={`inline-block size-9 rounded-sm ${trackBgClass} ${active ? "shadow-elev-1" : ""} ${locked ? "opacity-40" : ""}`}
      />
      <div className="flex-1">
        <div
          className={`font-display font-bold text-sm ${locked ? "text-ink-3" : "text-ink-1"}`}
        >
          {label}
        </div>
        <div className="font-mono text-[11px] font-bold text-ink-3">
          {done}/{total} lessons
        </div>
      </div>
    </button>
  )
}

function ConfettiBackdrop() {
  /* Confetti dots. 30 deterministic positions so SSR matches client.
     Each shard inherits one of 5 track / stat hues. */
  const TONES = [
    "bg-primary",
    "bg-stat-xp",
    "bg-stat-streak",
    "bg-track-mcp",
    "bg-track-prompting",
  ]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => {
        const tone = TONES[i % TONES.length]
        const left = (i * 37) % 100
        const top = ((i * 53) % 70) + 8
        const rotate = (i * 17) % 360
        return (
          <span
            key={i}
            aria-hidden
            className={`absolute block size-2 ${tone}`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              transform: `rotate(${rotate}deg)`,
              width: 8,
              height: 14,
              borderRadius: 2,
            }}
          />
        )
      })}
    </div>
  )
}

function InitialBadge({
  initials,
  tone,
}: {
  initials: string
  tone:
    | "primary"
    | "prompting"
    | "mcp"
    | "skills"
    | "agents"
    | "tooling"
    | "evals"
}) {
  const map = {
    primary: "bg-primary text-primary-foreground",
    prompting: "bg-track-prompting text-track-prompting-ink",
    mcp: "bg-track-mcp text-white",
    skills: "bg-track-skills text-track-skills-ink",
    agents: "bg-track-agents text-white",
    tooling: "bg-track-tooling text-track-tooling-ink",
    evals: "bg-track-evals text-white",
  } as const
  return (
    <span
      className={`inline-flex size-10 items-center justify-center rounded-full font-display font-bold text-sm ${map[tone]}`}
    >
      {initials}
    </span>
  )
}

function RewardLine({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-sm border-2 border-line-soft bg-bg-raised px-3 py-2.5">
      <span className="inline-flex size-7 items-center justify-center rounded-xs bg-bg-sunken shadow-elev-inset">
        {icon}
      </span>
      <span className="font-display font-bold text-sm text-ink-1">{label}</span>
    </div>
  )
}

/* ----------------------------- helpers ----------------------------- */

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mt-14 scroll-mt-10">
      <Eyebrow className="mb-4">{title}</Eyebrow>
      {children}
    </section>
  )
}

function SwatchGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
      {children}
    </div>
  )
}

function Swatch({
  className,
  name,
  hex,
}: {
  className: string
  name: string
  hex: string
}) {
  return (
    <div className="overflow-hidden rounded-md border border-line-soft">
      <div className={`relative h-20 ${className}`}>
        <span className="absolute bottom-2 left-2.5 font-mono text-[11px] font-semibold text-white/90 drop-shadow">
          {hex}
        </span>
      </div>
      <div className="bg-bg-raised px-3 py-2">
        <div className="font-display font-bold text-[13px] text-ink-1">
          {name}
        </div>
      </div>
    </div>
  )
}
