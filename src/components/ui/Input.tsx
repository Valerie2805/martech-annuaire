import { type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type Props = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--paper))] px-4 text-[15px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--muted))] transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--bg))]",
        className,
      )}
      {...props}
    />
  )
}
