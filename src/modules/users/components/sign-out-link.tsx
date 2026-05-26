"use client"

import { useClerk } from "@clerk/nextjs"

type Props = {
  label: string
  className?: string
}

// Plain text link that calls Clerk's signOut. Used in the perfil footer
// where the Clerk-provided <SignOutButton> wrapper trips on multi-child
// JSX (whitespace nodes around the inner button). Mirrors what UserMenu
// already does for the HUD dropdown.
export function SignOutLink({ label, className }: Props) {
  const { signOut } = useClerk()
  const handleClick = () => {
    void signOut({ redirectUrl: "/" })
  }
  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      style={{
        cursor: "pointer",
        background: "transparent",
        border: 0,
        padding: 0,
      }}
    >
      {label}
    </button>
  )
}
