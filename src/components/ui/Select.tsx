import { type SelectHTMLAttributes } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className, children, ...props }: Props) {
  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--paper))] px-4 pr-10 text-[15px] text-[hsl(var(--ink))] transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--bg))]",
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted))]"
      />
    </div>
  )
}

