import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — chunky 3D button.
   Solid bottom-drop shadow + active:translate-y collapses the drop into
   a press. `--press-y` is the drop distance for the current size; each
   variant supplies its own --press-shadow-color via class. */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2",
    "font-display font-bold uppercase tracking-wider whitespace-nowrap",
    "border-2 border-transparent select-none outline-none",
    "transition-[transform,box-shadow,filter] duration-fast ease-out",
    "focus-visible:ring-4 focus-visible:ring-primary-soft",
    "disabled:opacity-50 disabled:pointer-events-none",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        /* shadcn-compatible names — repointed to Naveo Bridge */
        default:
          "bg-primary text-primary-foreground shadow-[0_var(--press-y)_0_0_var(--primary-shadow)] active:translate-y-[var(--press-y)] active:shadow-none",
        secondary:
          "bg-bg-raised text-ink-1 border-line-strong shadow-[0_var(--press-y)_0_0_rgba(0,0,0,0.55)] active:translate-y-[var(--press-y)] active:shadow-none",
        outline:
          "bg-transparent text-ink-1 border-line-strong hover:bg-bg-raised aria-expanded:bg-bg-raised",
        ghost:
          "bg-transparent text-ink-2 border-transparent hover:bg-bg-raised hover:text-ink-1 aria-expanded:bg-bg-raised aria-expanded:text-ink-1",
        destructive:
          "bg-danger text-white shadow-[0_var(--press-y)_0_0_var(--danger-shadow)] active:translate-y-[var(--press-y)] active:shadow-none",
        link: "bg-transparent text-primary border-transparent underline-offset-4 hover:underline",
        /* Track variants — one per learning track */
        "track-prompting":
          "bg-track-prompting text-track-prompting-ink shadow-[0_var(--press-y)_0_0_var(--track-prompting-shadow)] active:translate-y-[var(--press-y)] active:shadow-none",
        "track-mcp":
          "bg-track-mcp text-white shadow-[0_var(--press-y)_0_0_var(--track-mcp-shadow)] active:translate-y-[var(--press-y)] active:shadow-none",
        "track-skills":
          "bg-track-skills text-track-skills-ink shadow-[0_var(--press-y)_0_0_var(--track-skills-shadow)] active:translate-y-[var(--press-y)] active:shadow-none",
        "track-agents":
          "bg-track-agents text-white shadow-[0_var(--press-y)_0_0_var(--track-agents-shadow)] active:translate-y-[var(--press-y)] active:shadow-none",
        "track-tooling":
          "bg-track-tooling text-track-tooling-ink shadow-[0_var(--press-y)_0_0_var(--track-tooling-shadow)] active:translate-y-[var(--press-y)] active:shadow-none",
        "track-evals":
          "bg-track-evals text-white shadow-[0_var(--press-y)_0_0_var(--track-evals-shadow)] active:translate-y-[var(--press-y)] active:shadow-none",
      },
      size: {
        /* `--press-y` defines the drop distance per size */
        sm: "[--press-y:3px] h-9 rounded-sm px-4 text-xs gap-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        default:
          "[--press-y:5px] h-11 rounded-md px-6 text-sm gap-2 [&_svg:not([class*='size-'])]:size-4",
        lg: "[--press-y:6px] h-13 rounded-lg px-8 text-base gap-2.5 [&_svg:not([class*='size-'])]:size-5",
        icon: "[--press-y:4px] size-10 rounded-md [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "[--press-y:3px] size-8 rounded-sm [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "[--press-y:5px] size-12 rounded-lg [&_svg:not([class*='size-'])]:size-5",
      },
    },
    compoundVariants: [
      /* Ghost / outline / link don't get the chunky press */
      { variant: "ghost", className: "[--press-y:0px]" },
      { variant: "outline", className: "[--press-y:0px]" },
      { variant: "link", className: "[--press-y:0px]" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
