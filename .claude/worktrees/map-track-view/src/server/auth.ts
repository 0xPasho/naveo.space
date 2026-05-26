import "server-only"

import { currentUser as clerkCurrentUser, type User } from "@clerk/nextjs/server"

export async function currentUser(): Promise<User | null> {
  return clerkCurrentUser()
}
