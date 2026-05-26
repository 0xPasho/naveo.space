"use client"

import { Menu } from "@base-ui/react/menu"
import { useClerk, useUser } from "@clerk/nextjs"
import { useTranslations } from "next-intl"
import { LogOut, User as UserIcon } from "lucide-react"

import { useRouter } from "@/common/i18n/navigation"

// Drop-in replacement for Clerk's <UserButton />. Renders our own avatar
// trigger that opens a Base UI Menu styled to match the .crew-shell HUD —
// instead of the default light Clerk popover that clashes with the dark
// design tokens. Menu items: Profile (navigate to /perfil) + Sign out.
//
// Avatar source: clerkUser.imageUrl, falling back to an initial in a colored
// circle (matches the design's .avatar token used elsewhere in the HUD).
export function UserMenu() {
  const t = useTranslations("common.userMenu")
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  if (!user) return null

  const fallback =
    user.firstName?.[0] ?? user.username?.[0] ?? user.primaryEmailAddress?.emailAddress?.[0] ?? "?"
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    user.primaryEmailAddress?.emailAddress ||
    ""

  const handleProfile = () => {
    router.push("/perfil")
  }

  const handleSignOut = () => {
    void signOut({ redirectUrl: "/" })
  }

  return (
    <Menu.Root>
      <Menu.Trigger className="user-menu-trigger" aria-label={t("openLabel")}>
        {user.imageUrl ? (
          <img src={user.imageUrl} alt="" className="user-menu-avatar-img" />
        ) : (
          <span className="user-menu-avatar-fallback">{fallback.toUpperCase()}</span>
        )}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end">
          <Menu.Popup className="user-menu-popup">
            <div className="user-menu-header">
              <div className="user-menu-name">{displayName}</div>
              {user.primaryEmailAddress?.emailAddress ? (
                <div className="user-menu-email">
                  {user.primaryEmailAddress.emailAddress}
                </div>
              ) : null}
            </div>
            <div className="user-menu-divider" />
            <Menu.Item className="user-menu-item" onClick={handleProfile}>
              <UserIcon className="user-menu-item-icon" aria-hidden />
              <span>{t("profile")}</span>
            </Menu.Item>
            <Menu.Item className="user-menu-item" onClick={handleSignOut}>
              <LogOut className="user-menu-item-icon" aria-hidden />
              <span>{t("signOut")}</span>
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
