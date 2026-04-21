import { type PropsWithChildren, type ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { Landmark, Map, Sheet, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

function TopNavLink({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
          "hover:bg-[hsl(var(--ink))]/5",
          isActive ? "bg-[hsl(var(--ink))]/7 text-[hsl(var(--ink))]" : "text-[hsl(var(--muted))]",
        )
      }
    >
      <span className="text-[hsl(var(--ink))]/80">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[hsl(var(--line))] bg-[hsl(var(--bg))]/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--paper))] shadow-paper">
              <Sparkles size={18} />
            </div>
            <div className="leading-tight">
              <div className="font-editorial text-[17px] tracking-tight">MarTech 78</div>
              <div className="text-xs text-[hsl(var(--muted))]">Annuaire local — SaaS & agences</div>
            </div>
          </div>

          <nav className="hidden items-center gap-1 rounded-full border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-1 shadow-paper md:flex">
            <TopNavLink to="/annuaire" label="Annuaire" icon={<Landmark size={16} />} />
            <TopNavLink to="/carte" label="Carte" icon={<Map size={16} />} />
            <TopNavLink to="/donnees" label="Données" icon={<Sheet size={16} />} />
          </nav>

          <div className="hidden text-right text-xs text-[hsl(var(--muted))] md:block">
            <div className="font-editorial text-[13px] text-[hsl(var(--ink))]/80">Yvelines</div>
            <div>Version locale</div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-8">{children}</main>
    </div>
  )
}
