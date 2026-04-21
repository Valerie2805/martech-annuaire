import { type MartechCompany } from "@/types/martech"
import { type DirectoryFilters } from "@/stores/companiesStore"

function normalize(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function isTpe(tranche: string | null) {
  if (!tranche) return false
  const t = tranche.toUpperCase().trim()
  return t === "NN" || t === "00" || t === "0" || t === "01" || t === "02" || t === "03"
}

export function filterCompanies(companies: MartechCompany[], filters: DirectoryFilters) {
  const q = normalize(filters.query)
  const city = filters.city === "all" ? null : normalize(filters.city)
  const activityDomain = filters.activityDomain === "all" ? null : normalize(filters.activityDomain)

  return companies.filter((c) => {
    if (filters.website === "only" && !c.websiteUrl) return false
    if (filters.size !== "all") {
      const isPme = c.categorieEntreprise === "PME"
      const tpe = isTpe(c.trancheEffectifSalarie)
      if (filters.size === "pme" && !isPme) return false
      if (filters.size === "tpe" && !tpe) return false
      if (filters.size === "tpe_pme" && !(isPme || tpe)) return false
    }
    if (filters.type !== "all" && c.type !== filters.type) return false
    if (filters.category !== "all" && c.category !== filters.category) return false
    if (activityDomain && normalize(c.activityDomain || "") !== activityDomain) return false
    if (filters.tech !== "all" && !c.tags.includes(filters.tech)) return false
    if (filters.department !== "all" && (c.department || "") !== filters.department) return false
    if (city && normalize(c.city || "") !== city) return false

    if (!q) return true

    const hay = [
      c.name,
      c.city || "",
      c.postalCode || "",
      c.department || "",
      c.activityDomain || "",
      c.websiteUrl || "",
      c.decisionEmail || "",
      ...c.tags,
    ]
      .map(normalize)
      .join(" ")

    return hay.includes(q)
  })
}

export function uniqueCities(companies: MartechCompany[]) {
  const set = new Set<string>()
  for (const c of companies) if (c.city) set.add(c.city)
  return [...set].sort((a, b) => a.localeCompare(b, "fr"))
}

export function uniqueDepartments(companies: MartechCompany[]) {
  const set = new Set<string>()
  for (const c of companies) if (c.department) set.add(c.department)
  return [...set].sort((a, b) => a.localeCompare(b, "fr"))
}

export function uniqueTechs(companies: MartechCompany[]) {
  const set = new Set<string>()
  for (const c of companies) for (const t of c.tags) if (t) set.add(t)
  return [...set].sort((a, b) => a.localeCompare(b, "fr"))
}

export function uniqueActivityDomains(companies: MartechCompany[]) {
  const set = new Set<string>()
  for (const c of companies) if (c.activityDomain) set.add(c.activityDomain)
  return [...set].sort((a, b) => a.localeCompare(b, "fr"))
}
