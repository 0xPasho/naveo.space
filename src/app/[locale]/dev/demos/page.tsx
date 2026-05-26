import { setRequestLocale } from "next-intl/server"

import type { ContentLocale } from "@/modules/content/types"

import { DevDemosClient } from "./client"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

export default async function DevDemosPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return <DevDemosClient />
}
