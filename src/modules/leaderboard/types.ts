export type MentorKey =
  | "vega"
  | "echo"
  | "atlas"
  | "forge"
  | "orbit"
  | "hex"

export type OfficerRow = {
  userId: string
  rank: number
  name: string
  handle: string
  xp: number
  todayXp: number
  streak: number
  mentor: MentorKey
  rankDelta: number
  you?: boolean
}

export type Climber = {
  userId: string
  name: string
  handle: string
  rankDelta: number
  todayXp: number
  mentor: MentorKey
  trend: "up" | "down" | "hold"
  you?: boolean
}
