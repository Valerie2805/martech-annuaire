import { type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: "ink" | "accent" | "muted"
}

export function Badge({ className, tone = "muted", ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
        tone === "muted" && "border-[hsl(var(--line))] bg-[hsl(var(--paper))] text-[hsl(var(--muted))]",
        tone === "ink" && "border-[hsl(var(--ink))]/15 bg-[hsl(var(--ink))]/4 text-[hsl(var(--ink))]",
        tone === "accent" && "border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))]",
        className,
      )}
      {...props}
    />
  )
}
