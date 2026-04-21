import { type ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline"
  size?: "sm" | "md"
}

export function Button({ className, variant = "primary", size = "md", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full text-sm transition will-change-transform",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--bg))]",
        size === "sm" ? "h-9 px-4" : "h-10 px-5",
        variant === "primary" &&
          "bg-[hsl(var(--ink))] text-[hsl(var(--paper))] hover:translate-y-[-1px] hover:bg-[hsl(var(--ink))]/95 active:translate-y-0",
        variant === "outline" &&
          "border border-[hsl(var(--line))] bg-[hsl(var(--paper))] text-[hsl(var(--ink))] hover:translate-y-[-1px] hover:border-[hsl(var(--ink))]/25 active:translate-y-0",
        variant === "ghost" &&
          "bg-transparent text-[hsl(var(--ink))] hover:bg-[hsl(var(--ink))]/5 active:bg-[hsl(var(--ink))]/8",
        className,
      )}
      {...props}
    />
  )
}
