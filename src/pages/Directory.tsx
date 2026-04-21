import { useEffect, useMemo, useRef, useState } from "react"
import { Search, Download, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { CompanyCard } from "@/components/CompanyCard"
import { useCompaniesStore } from "@/stores/companiesStore"
import { ACTIVITY_DOMAINS, FR_DEPARTMENTS } from "@/data/france"
import { filterCompanies, uniqueActivityDomains, uniqueTechs } from "@/utils/directory"
import { exportCompaniesCsv } from "@/utils/csv"
import { downloadTextFile } from "@/utils/download"

export default function DirectoryPage() {
  const localCompanies = useCompaniesStore((s) => s.companies)
  const remoteByDepartment = useCompaniesStore((s) => s.remoteByDepartment)
  const filters = useCompaniesStore((s) => s.filters)
  const setFilters = useCompaniesStore((s) => s.setFilters)
  const resetFilters = useCompaniesStore((s) => s.resetFilters)
  const loadDepartment = useCompaniesStore((s) => s.loadDepartment)

  const techs = uniqueTechs(localCompanies)
  const activityDomains = useMemo(() => {
    const predefined = ACTIVITY_DOMAINS.map((d) => d.label)
    const extra = uniqueActivityDomains(localCompanies).filter((x) => !predefined.includes(x))
    return [...predefined, ...extra]
  }, [localCompanies])

  const remoteForSelected = filters.department !== "all" ? remoteByDepartment[filters.department]?.items ?? [] : []
  const remoteState = filters.department !== "all" ? remoteByDepartment[filters.department] : null
  const companies = useMemo(() => {
    if (filters.department === "all") return localCompanies
    return [...remoteForSelected, ...localCompanies]
  }, [filters.department, localCompanies, remoteForSelected])

  const filtered = filterCompanies(companies, filters)
  const remoteHasOnlyNoWebsite = useMemo(() => {
    if (filters.department === "all") return false
    if (!remoteForSelected.length) return false
    return remoteForSelected.every((c) => !c.websiteUrl)
  }, [filters.department, remoteForSelected])

  const [cityDraft, setCityDraft] = useState(filters.city === "all" ? "" : filters.city)
  const [cityOptions, setCityOptions] = useState<Array<{ name: string; department: string }>>([])
  const [cityDeptHint, setCityDeptHint] = useState<string | null>(null)
  const [showCityOptions, setShowCityOptions] = useState(false)
  const cityFetchAbort = useRef<AbortController | null>(null)

  useEffect(() => {
    setCityDraft(filters.city === "all" ? "" : filters.city)
  }, [filters.city])

  useEffect(() => {
    if (filters.department === "all") return
    const st = remoteByDepartment[filters.department]
    if (st?.loading) return
    if (st?.items?.length) return
    if (st?.error) return
    void loadDepartment(filters.department, { reset: true })
  }, [filters.department, loadDepartment, remoteByDepartment])

  useEffect(() => {
    const q = cityDraft.trim()
    setCityDeptHint(null)

    if (cityFetchAbort.current) cityFetchAbort.current.abort()
    if (q.length < 2) {
      setCityOptions([])
      return
    }

    const abort = new AbortController()
    cityFetchAbort.current = abort

    const handle = window.setTimeout(() => {
      const url = new URL("https://geo.api.gouv.fr/communes")
      url.searchParams.set("nom", q)
      url.searchParams.set("fields", "nom,departement")
      url.searchParams.set("boost", "population")
      url.searchParams.set("limit", "8")
      if (filters.department !== "all") url.searchParams.set("codeDepartement", filters.department)

      fetch(url.toString(), { signal: abort.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((items: any[]) => {
          const opts =
            items?.map((it) => ({
              name: String(it?.nom ?? "").trim(),
              department: String(it?.departement?.code ?? "").trim(),
            })) ?? []
          setCityOptions(opts.filter((o) => o.name))
        })
        .catch(() => {})
    }, 250)

    return () => window.clearTimeout(handle)
  }, [cityDraft, filters.department])

  function applyCityFilter() {
    const v = cityDraft.trim()
    if (!v) {
      setFilters({ city: "all" })
      return
    }

    if (filters.department === "all" && cityDeptHint) {
      setFilters({ city: v, department: cityDeptHint })
      return
    }

    setFilters({ city: v })
  }

  return (
    <div className="space-y-6">
      <section className="grid-paper rounded-[28px] border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-6 shadow-paper">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-editorial text-3xl leading-[1.05] tracking-tight">
              Annuaire MarTech — {filters.department === "all" ? "France" : `Département ${filters.department}`}
            </div>
            <div className="mt-2 max-w-2xl text-sm text-[hsl(var(--muted))]">
              SaaS et agences orientées marketing. Recherche, filtres, export et navigation vers Contact/Mentions.
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="ink">SaaS</Badge>
              <Badge tone="ink">Agences</Badge>
              <Badge tone="accent">Export CSV</Badge>
              <Badge tone="muted">Carte OSM</Badge>
            </div>
          </div>

          <div className="w-full md:w-[420px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted))]" size={18} />
              <Input
                placeholder="Rechercher : CRM, SEO, automation, Versailles…"
                className="pl-11"
                value={filters.query}
                onChange={(e) => setFilters({ query: e.target.value })}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-5 shadow-paper">
        <div className="grid gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-3">
            <div className="text-xs text-[hsl(var(--muted))]">Domaine d’activité</div>
            <Select value={filters.activityDomain} onChange={(e) => setFilters({ activityDomain: e.target.value })}>
              <option value="all">Tous</option>
              {activityDomains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs text-[hsl(var(--muted))]">Type (tech)</div>
            <Select value={filters.category} onChange={(e) => setFilters({ category: e.target.value as any })}>
              <option value="all">Toutes</option>
              <option value="crm">CRM</option>
              <option value="emailing">Emailing</option>
              <option value="automation">Automation</option>
              <option value="ads">Ads</option>
              <option value="seo">SEO</option>
              <option value="analytics">Analytics</option>
              <option value="social">Social</option>
              <option value="content">Content</option>
              <option value="ecommerce">E-commerce</option>
              <option value="other">Autre</option>
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-[hsl(var(--muted))]">Entreprise</div>
            <Select value={filters.type} onChange={(e) => setFilters({ type: e.target.value as any })}>
              <option value="all">Toutes</option>
              <option value="saas">SaaS</option>
              <option value="agence">Agences</option>
              <option value="freelance">Freelances</option>
              <option value="esn">ESN</option>
              <option value="cabinet">Cabinets</option>
              <option value="other">Autres</option>
            </Select>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs text-[hsl(var(--muted))]">Technos</div>
            <Select value={filters.tech} onChange={(e) => setFilters({ tech: e.target.value })}>
              <option value="all">Toutes</option>
              {techs.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-[hsl(var(--muted))]">Taille</div>
            <Select value={filters.size} onChange={(e) => setFilters({ size: e.target.value as any })}>
              <option value="tpe_pme">TPE + PME</option>
              <option value="tpe">TPE</option>
              <option value="pme">PME</option>
              <option value="all">Toutes</option>
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-[hsl(var(--muted))]">Sites</div>
            <Select value={filters.website} onChange={(e) => setFilters({ website: e.target.value as any })}>
              <option value="only">Avec site web</option>
              <option value="all">Tous</option>
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-[hsl(var(--muted))]">Zone</div>
            <Select value={filters.department} onChange={(e) => setFilters({ department: e.target.value, city: "all" })}>
              <option value="all">France entière</option>
              {FR_DEPARTMENTS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} — {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-[hsl(var(--muted))]">Ville</div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder={filters.department === "all" ? "Ex: Paris" : "Ex: Versailles"}
                  value={cityDraft}
                  onChange={(e) => {
                    setCityDraft(e.target.value)
                    setShowCityOptions(true)
                  }}
                  onFocus={() => setShowCityOptions(true)}
                  onBlur={() => window.setTimeout(() => setShowCityOptions(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      applyCityFilter()
                    }
                  }}
                />
                {showCityOptions && cityOptions.length ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--paper))] shadow-paper">
                    {cityOptions.map((o) => (
                      <button
                        key={`${o.name}-${o.department}`}
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-[hsl(var(--ink))]/3"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setCityDraft(o.name)
                          setCityDeptHint(o.department || null)
                          setShowCityOptions(false)
                        }}
                      >
                        <span className="truncate">{o.name}</span>
                        {o.department ? <span className="shrink-0 text-xs text-[hsl(var(--muted))]">{o.department}</span> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <Button variant="outline" onClick={() => applyCityFilter()}>
                Valider
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[hsl(var(--muted))]">
            <span className="font-editorial text-[hsl(var(--ink))]/80">{filtered.length}</span>
            <span>résultats</span>
            <span className="text-[hsl(var(--line))]">•</span>
            <span>{companies.length} au total</span>
            {filters.department !== "all" && remoteState?.loading ? (
              <>
                <span className="text-[hsl(var(--line))]">•</span>
                <span>Chargement du département {filters.department}…</span>
              </>
            ) : null}
            {filters.department !== "all" &&
            !remoteState?.loading &&
            filtered.length === 0 &&
            remoteHasOnlyNoWebsite &&
            filters.website === "only" ? (
              <>
                <span className="text-[hsl(var(--line))]">•</span>
                <span>La source “département” ne fournit pas les sites web : passe “Sites” sur “Tous”.</span>
              </>
            ) : null}
            {filters.department !== "all" && remoteState?.error ? (
              <>
                <span className="text-[hsl(var(--line))]">•</span>
                <span>Erreur API: {remoteState.error}</span>
              </>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:justify-end">
            {filters.department !== "all" && remoteHasOnlyNoWebsite && filters.website === "only" ? (
              <Button variant="outline" onClick={() => setFilters({ website: "all" })}>
                Afficher sans site
              </Button>
            ) : null}
            {filters.department !== "all" && remoteState?.error ? (
              <Button variant="outline" onClick={() => void loadDepartment(filters.department, { reset: true })}>
                Réessayer
              </Button>
            ) : null}
            {filters.department !== "all" && remoteState && !remoteState.error && remoteState.page < remoteState.totalPages ? (
              <Button
                variant="outline"
                disabled={remoteState.loading}
                onClick={() => void loadDepartment(filters.department, { reset: false })}
              >
                Charger plus
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => {
                const csv = exportCompaniesCsv(filtered)
                downloadTextFile(`martech-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv")
              }}
            >
              <Download size={16} />
              Export CSV
            </Button>
            <Button variant="ghost" onClick={() => resetFilters()}>
              <RotateCcw size={16} />
              Réinitialiser
            </Button>
          </div>
        </div>

      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {filtered.length ? (
          filtered.map((c) => <CompanyCard key={c.id} company={c} />)
        ) : (
          <div className="rounded-[28px] border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-8 text-sm text-[hsl(var(--muted))] shadow-paper md:col-span-2">
            Aucun résultat. Importez un CSV depuis “Données” ou élargissez les filtres.
          </div>
        )}
      </section>
    </div>
  )
}
