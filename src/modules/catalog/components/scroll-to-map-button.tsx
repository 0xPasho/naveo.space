"use client"

import { Button } from "@/common/components/ui"

type Props = {
  label: string
  className?: string
}

export const COURSE_MAP_ANCHOR_ID = "course-map"

export function ScrollToMapButton({ label, className }: Props) {
  const handleClick = () => {
    const el = document.getElementById(COURSE_MAP_ANCHOR_ID)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <Button variant="ghost" onClick={handleClick} className={className}>
      {label}
    </Button>
  )
}
