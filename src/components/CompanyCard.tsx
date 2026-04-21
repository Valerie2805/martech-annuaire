import { Link } from "react-router-dom"
import { ExternalLink, Mail, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import { type MartechCompany } from "@/types/martech"

const typeLabel: Record<MartechCompany["type"], string> = {
  saas: "SaaS",
  agence: "Agence",
  freelance: "Freelance",
  esn: "ESN",
  cabinet: "Cabinet",
  other: "Autre",
}

export function CompanyCard({ company }: { company: MartechCompany }) {
  return (
    <div className="rounded-[26px] border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-5 shadow-paper">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-editorial text-xl tracking-tight">{company.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone="ink">{typeLabel[company.type]}</Badge>
            <Badge tone="accent">{company.category}</Badge>
            {company.city ? (
              <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--muted))]">
                <MapPin size={14} />
                <span className="truncate">{company.city}</span>
              </span>
            ) : null}
            {company.siteFirstSeenAt ? (
              <span className="text-xs text-[hsl(var(--muted))]">Créé {company.siteFirstSeenAt}</span>
            ) : null}
            {company.redesignEstimatedAt ? (
              <span className="text-xs text-[hsl(var(--muted))]">Refonte probable</span>
            ) : null}
          </div>
        </div>

        <Link
          to={`/entreprise/${company.id}`}
          className={cn(
            "shrink-0 rounded-full border border-[hsl(var(--line))] bg-[hsl(var(--paper))] px-4 py-2 text-sm text-[hsl(var(--ink))] transition",
            "hover:translate-y-[-1px] hover:border-[hsl(var(--ink))]/20 active:translate-y-0",
          )}
        >
          Voir la fiche
        </Link>
      </div>

      {company.tags.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {company.tags.slice(0, 6).map((t) => (
            <Badge key={t} tone="muted">
              {t}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 text-sm">
        {company.websiteUrl ? (
          <a
            className="inline-flex items-center gap-2 text-[hsl(var(--ink))]/85 hover:text-[hsl(var(--ink))]"
            href={company.websiteUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={16} />
            <span className="truncate">{company.websiteUrl}</span>
          </a>
        ) : (
          <div className="text-[hsl(var(--muted))]">Site : N/A</div>
        )}

        {company.decisionEmail ? (
          <a
            className="inline-flex items-center gap-2 text-[hsl(var(--ink))]/85 hover:text-[hsl(var(--ink))]"
            href={`mailto:${company.decisionEmail}`}
          >
            <Mail size={16} />
            <span className="truncate">{company.decisionEmail}</span>
          </a>
        ) : (
          <div className="text-[hsl(var(--muted))]">Email : N/A</div>
        )}
      </div>
    </div>
  )
}
