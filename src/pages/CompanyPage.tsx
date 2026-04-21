import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Building2, ExternalLink, Mail, Scale, Link2, MapPin, Clock } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { useCompaniesStore } from "@/stores/companiesStore"

function formatDateISO(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
}

export default function CompanyPage() {
  const { id } = useParams()
  const company = useCompaniesStore((s) => s.companies.find((c) => c.id === id))

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-6 shadow-paper">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--paper))]">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <div className="font-editorial text-3xl leading-[1.05] tracking-tight">{company?.name ?? "Entreprise"}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {company ? (
                  <>
                    <Badge tone="ink">{company.type}</Badge>
                    <Badge tone="accent">{company.category}</Badge>
                    {company.city ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--muted))]">
                        <MapPin size={14} />
                        <span className="truncate">{company.postalCode ? `${company.postalCode} ` : ""}{company.city}</span>
                      </span>
                    ) : null}
                    {company.siteFirstSeenAt ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--muted))]">
                        <Clock size={14} />
                        <span>Créé {formatDateISO(company.siteFirstSeenAt)}</span>
                      </span>
                    ) : null}
                    {company.redesignEstimatedAt ? (
                      <span className="text-xs text-[hsl(var(--muted))]">Refonte probable</span>
                    ) : null}
                  </>
                ) : (
                  <Badge tone="muted">Introuvable</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-[hsl(var(--muted))]">
            <div>Département : {company?.department ?? "N/A"}</div>
            <div>ID : {id}</div>
          </div>
        </div>
      </div>

      {company ? (
        <div className="grid gap-4 md:grid-cols-12">
          <div className="rounded-[28px] border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-6 shadow-paper md:col-span-7">
            <div className="font-editorial text-xl tracking-tight">Coordonnées</div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Link2 size={16} className="mt-0.5 text-[hsl(var(--muted))]" />
                {company.websiteUrl ? (
                  <a className="break-all hover:underline" href={company.websiteUrl} target="_blank" rel="noreferrer">
                    {company.websiteUrl}
                  </a>
                ) : (
                  <span className="text-[hsl(var(--muted))]">Site : N/A</span>
                )}
              </div>

              <div className="flex items-start gap-3">
                <Mail size={16} className="mt-0.5 text-[hsl(var(--muted))]" />
                {company.decisionEmail ? (
                  <a className="break-all hover:underline" href={`mailto:${company.decisionEmail}`}>
                    {company.decisionEmail}
                  </a>
                ) : (
                  <span className="text-[hsl(var(--muted))]">Email : N/A</span>
                )}
              </div>

              <div className="flex items-start gap-3">
                <ExternalLink size={16} className="mt-0.5 text-[hsl(var(--muted))]" />
                {company.contactUrl ? (
                  <a className="break-all hover:underline" href={company.contactUrl} target="_blank" rel="noreferrer">
                    Contact
                  </a>
                ) : (
                  <span className="text-[hsl(var(--muted))]">Contact : N/A</span>
                )}
              </div>

              <div className="flex items-start gap-3">
                <Scale size={16} className="mt-0.5 text-[hsl(var(--muted))]" />
                {company.legalUrl ? (
                  <a className="break-all hover:underline" href={company.legalUrl} target="_blank" rel="noreferrer">
                    Mentions légales
                  </a>
                ) : (
                  <span className="text-[hsl(var(--muted))]">Mentions légales : N/A</span>
                )}
              </div>
            </div>

            {company.tags.length ? (
              <div className="mt-6">
                <div className="text-xs text-[hsl(var(--muted))]">Tags</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {company.tags.map((t) => (
                    <Badge key={t} tone="muted">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {company.siteFirstSeenAt || company.redesignEstimatedAt ? (
              <div className="mt-6">
                <div className="font-editorial text-xl tracking-tight">Historique du site</div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Clock size={16} className="mt-0.5 text-[hsl(var(--muted))]" />
                    {company.siteFirstSeenAt ? (
                      <div className="min-w-0">
                        <div>Création (première trace Wayback) : {formatDateISO(company.siteFirstSeenAt)}</div>
                        {company.siteFirstSeenEvidenceUrl ? (
                          <a
                            className="break-all text-xs text-[hsl(var(--muted))] hover:underline"
                            href={company.siteFirstSeenEvidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Preuve
                          </a>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-[hsl(var(--muted))]">Création : N/A</span>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock size={16} className="mt-0.5 text-[hsl(var(--muted))]" />
                    {company.redesignEstimatedAt ? (
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>Refonte : probable</span>
                          {company.redesignConfidence ? (
                            <Badge tone="muted">{company.redesignConfidence}</Badge>
                          ) : null}
                        </div>
                        {company.redesignWindowStart && company.redesignWindowEnd ? (
                          <div className="text-xs text-[hsl(var(--muted))]">
                            Fenêtre : {formatDateISO(company.redesignWindowStart)} → {formatDateISO(company.redesignWindowEnd)}
                          </div>
                        ) : null}
                        {company.redesignEvidenceUrls.length ? (
                          <div className="mt-2 space-y-1">
                            {company.redesignEvidenceUrls.map((u) => (
                              <a
                                key={u}
                                className="block break-all text-xs text-[hsl(var(--muted))] hover:underline"
                                href={u}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Preuve
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-[hsl(var(--muted))]">Refonte : non conclu</span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-6 shadow-paper md:col-span-5">
            <div className="font-editorial text-xl tracking-tight">Sources</div>
            <div className="mt-3 space-y-2 text-sm">
              {company.sources.length ? (
                company.sources.map((s) => (
                  <a key={s} href={s} target="_blank" rel="noreferrer" className="block break-all text-[hsl(var(--ink))]/85 hover:underline">
                    {s}
                  </a>
                ))
              ) : (
                <div className="text-[hsl(var(--muted))]">N/A</div>
              )}
            </div>

            {company.notes ? (
              <div className="mt-6">
                <div className="text-xs text-[hsl(var(--muted))]">Notes</div>
                <div className="mt-2 text-sm text-[hsl(var(--ink))]/85">{company.notes}</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rounded-[28px] border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-6 text-sm text-[hsl(var(--muted))] shadow-paper">
          Cette entreprise n’existe pas encore dans votre catalogue local.
        </div>
      )}

      <div className="flex">
        <Link
          to="/annuaire"
          className="inline-flex items-center gap-2 text-sm text-[hsl(var(--muted))] hover:text-[hsl(var(--ink))]"
        >
          <ArrowLeft size={16} />
          Retour à l’annuaire
        </Link>
      </div>
    </div>
  )
}
