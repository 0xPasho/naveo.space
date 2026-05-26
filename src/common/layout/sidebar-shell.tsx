type Props = {
  children: React.ReactNode
  // Kept for back-compat with callers; no longer drives a CSS class. The
  // sidebar itself is now rendered by `(site)/layout.tsx`, so this is just
  // a content wrapper.
  mainClass?: "catalog-main" | "detail-main"
}

// SidebarShell — historical wrapper. The (site) layout now renders the
// Sidebar globally, so this just passes children through. Kept so existing
// pages (`tracks`, `workbench`, `shop`, etc.) don't need a code change.
export async function SidebarShell({ children }: Props) {
  return <>{children}</>
}
