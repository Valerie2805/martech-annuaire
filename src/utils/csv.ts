import Papa from "papaparse"
import { type MartechCompany, type MartechCategory, type CompanyType } from "@/types/martech"
import { makeCompanyId } from "@/utils/ids"

export type ImportResult = {
  imported: MartechCompany[]
  rejected: { row: Record<string, unknown>; reason: string }[]
}

function toNull(v: unknown) {
  const s = String(v ?? "").trim()
  return s ? s : null
}

function toNumberOrNull(v: unknown) {
  const s = String(v ?? "").trim().replace(",", ".")
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function normalizeType(v: unknown): CompanyType | null {
  const s = String(v ?? "").toLowerCase().trim()
  if (!s) return null
  if (s === "saas") return "saas"
  if (s === "agence" || s === "agency") return "agence"
  if (s === "freelance" || s === "independant" || s === "indépendant" || s === "indep") return "freelance"
  if (s === "esn" || s === "ssii") return "esn"
  if (s === "cabinet") return "cabinet"
  if (s === "other" || s === "autre") return "other"
  return null
}

function normalizeCategory(v: unknown): MartechCategory | null {
  const s = String(v ?? "").toLowerCase().trim()
  if (!s) return null
  const allowed: MartechCategory[] = [
    "crm",
    "emailing",
    "automation",
    "ads",
    "seo",
    "analytics",
    "social",
    "content",
    "ecommerce",
    "other",
  ]
  return allowed.includes(s as MartechCategory) ? (s as MartechCategory) : null
}

function splitList(v: unknown) {
  const s = String(v ?? "").trim()
  if (!s) return []
  return s
    .split(/[,;|]/g)
    .map((x) => x.trim())
    .filter(Boolean)
}

export function exportCompaniesCsv(companies: MartechCompany[]) {
  const rows = companies.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    category: c.category,
    activityDomain: c.activityDomain ?? "",
    categorieEntreprise: c.categorieEntreprise ?? "",
    trancheEffectifSalarie: c.trancheEffectifSalarie ?? "",
    tags: c.tags.join(", "),
    phone: c.phone ?? "",
    addressLine: c.addressLine ?? "",
    postalCode: c.postalCode ?? "",
    city: c.city ?? "",
    department: c.department,
    websiteUrl: c.websiteUrl ?? "",
    contactUrl: c.contactUrl ?? "",
    legalUrl: c.legalUrl ?? "",
    decisionEmail: c.decisionEmail ?? "",
    leaderName: c.leaderName ?? "",
    lat: c.lat ?? "",
    lng: c.lng ?? "",
    siteFirstSeenAt: c.siteFirstSeenAt ?? "",
    siteFirstSeenEvidenceUrl: c.siteFirstSeenEvidenceUrl ?? "",
    redesignEstimatedAt: c.redesignEstimatedAt ?? "",
    redesignWindowStart: c.redesignWindowStart ?? "",
    redesignWindowEnd: c.redesignWindowEnd ?? "",
    redesignConfidence: c.redesignConfidence ?? "",
    redesignEvidenceUrls: c.redesignEvidenceUrls.join(", "),
    sources: c.sources.join(", "),
    notes: c.notes ?? "",
    googlePlaceId: c.googlePlaceId ?? "",
    enrichmentStatus: c.enrichmentStatus ?? "",
    enrichedAt: c.enrichedAt ?? "",
    updatedAt: c.updatedAt,
  }))

  return Papa.unparse(rows, { quotes: true })
}

export function importCompaniesCsv(text: string): ImportResult {
  const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true })

  const rejected: ImportResult["rejected"] = []
  const imported: MartechCompany[] = []

  for (const row of parsed.data) {
    const name = toNull(row.name ?? row.Nom ?? row.Entreprise)
    if (!name) {
      rejected.push({ row, reason: "Nom manquant" })
      continue
    }

    const type = normalizeType(row.type ?? row.Type)
    const category = normalizeCategory(row.category ?? row.Categorie ?? row.Catégorie)

    if (!type) {
      rejected.push({ row, reason: "Type invalide (saas/agence/freelance/esn/cabinet/other)" })
      continue
    }

    const postalCode = toNull(row.postalCode ?? row.CP ?? row["Code postal"])
    const departmentFromPostal = postalCode && postalCode.length >= 2 ? postalCode.slice(0, 2) : null
    const department = toNull(row.department ?? row.Departement ?? row["Département"] ?? row["Departement"]) ?? departmentFromPostal

    const company: MartechCompany = {
      id: String(row.id ?? "").trim() || makeCompanyId(name, postalCode),
      name,
      type,
      category: category ?? "other",
      activityDomain: toNull(row.activityDomain ?? row["Domaine d'activité"] ?? row["Domaine"] ?? row.Secteur),
      categorieEntreprise: (() => {
        const s = String(row.categorieEntreprise ?? row.categorie_entreprise ?? row["Catégorie entreprise"] ?? "").toUpperCase().trim()
        if (s === "PME" || s === "ETI" || s === "GE") return s as any
        return null
      })(),
      trancheEffectifSalarie: toNull(row.trancheEffectifSalarie ?? row.tranche_effectif_salarie ?? row["Tranche effectif"] ?? row["Tranche effectif salarié"]),
      tags: splitList(row.tags ?? row.Tags),
      phone: toNull(row.phone ?? row.Tel ?? row.Téléphone ?? row.Telephone),
      addressLine: toNull(row.addressLine ?? row.Adresse),
      postalCode,
      city: toNull(row.city ?? row.Ville),
      department,
      websiteUrl: toNull(row.websiteUrl ?? row.Site ?? row["Site internet"]),
      contactUrl: toNull(row.contactUrl ?? row.Contact),
      legalUrl: toNull(row.legalUrl ?? row.Mentions),
      decisionEmail: toNull(row.decisionEmail ?? row.Email ?? row["Email dirigeant"]),
      leaderName: toNull(row.leaderName ?? row.Dirigeant ?? row["Nom dirigeant"]),
      lat: toNumberOrNull(row.lat ?? row.Lat),
      lng: toNumberOrNull(row.lng ?? row.Lng ?? row.Lon ?? row.Long),
      siteFirstSeenAt: toNull(row.siteFirstSeenAt ?? row["Site créé"] ?? row["Site créé (Wayback)"]),
      siteFirstSeenEvidenceUrl: toNull(row.siteFirstSeenEvidenceUrl ?? row["Preuve création"] ?? row["Preuve création (Wayback)"]),
      redesignEstimatedAt: toNull(row.redesignEstimatedAt ?? row["Refonte (estimée)"]),
      redesignWindowStart: toNull(row.redesignWindowStart ?? row["Refonte début"] ?? row["Refonte (début)"]),
      redesignWindowEnd: toNull(row.redesignWindowEnd ?? row["Refonte fin"] ?? row["Refonte (fin)"]),
      redesignConfidence: (() => {
        const s = String(row.redesignConfidence ?? row["Confiance refonte"] ?? "").toLowerCase().trim()
        if (!s) return null
        if (s === "high" || s === "medium" || s === "low") return s
        if (s === "fort" || s === "élevé" || s === "eleve") return "high"
        if (s === "moyen") return "medium"
        if (s === "faible") return "low"
        return null
      })(),
      redesignEvidenceUrls: splitList(row.redesignEvidenceUrls ?? row["Preuves refonte"] ?? row["Preuves refonte (Wayback)"]),
      sources: splitList(row.sources ?? row.Sources),
      notes: toNull(row.notes ?? row.Notes),
      googlePlaceId: toNull(row.googlePlaceId ?? row.placeId ?? row["Google place id"] ?? row["Place ID"]),
      enrichmentStatus: (() => {
        const s = String(row.enrichmentStatus ?? row["Enrichissement"] ?? "").toLowerCase().trim()
        if (!s) return "pending"
        if (s === "pending" || s === "needs_review" || s === "enriched" || s === "no_match") return s
        if (s === "a_valider" || s === "à valider") return "needs_review"
        if (s === "ok") return "enriched"
        return "pending"
      })(),
      enrichedAt: toNull(row.enrichedAt ?? row["Enrichi le"] ?? row["Enrichi"]),
      updatedAt: new Date().toISOString(),
    }

    imported.push(company)
  }

  return { imported, rejected }
}
