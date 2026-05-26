"use client"

import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { X } from "lucide-react"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — transient feedback.
   Use `useToast()` from this module to dispatch toasts; mount
   `<ToastViewport />` once at the root of your app inside `<ToastProvider>`.

   For chunky in-flow feedback (after a lesson attempt) use FeedbackStrip
   instead; Toast is for ephemeral notifications. */
function ToastProvider({ children }: { children: React.ReactNode }) {
  return <ToastPrimitive.Provider>{children}</ToastPrimitive.Provider>
}

function ToastViewport({
  className,
  ...props
}: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-2 outline-none",
        className,
      )}
      {...props}
    />
  )
}

function Toast({
  className,
  children,
  ...props
}: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "group relative flex w-full items-start gap-3",
        "rounded-md border-2 border-line-strong bg-bg-surface p-4",
        "font-sans text-sm text-ink-1 shadow-elev-3 outline-none",
        "data-[expanded]:scale-100 data-[expanded]:opacity-100",
        "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        className,
      )}
      {...props}
    >
      {children}
      <ToastPrimitive.Close
        className="ml-auto inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-ink-3 transition-colors hover:bg-bg-raised hover:text-ink-1 focus-visible:ring-4 focus-visible:ring-primary-soft outline-none"
        aria-label="Dismiss"
      >
        <X className="size-3.5" strokeWidth={2.5} />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  )
}

function ToastTitle({
  className,
  ...props
}: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn(
        "font-display font-bold text-base leading-tight text-ink-1",
        className,
      )}
      {...props}
    />
  )
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("mt-1 font-sans text-sm font-semibold text-ink-2", className)}
      {...props}
    />
  )
}

const useToast = ToastPrimitive.useToastManager

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  useToast,
}
