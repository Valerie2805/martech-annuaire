import { makeCompanyId } from "@/utils/ids"
import { type MartechCompany } from "@/types/martech"

type SearchResponse = {
  results: Array<{
    siren?: string
    nom_complet?: string
    nom_raison_sociale?: string
    sigle?: string
    activite_principale?: string
    section_activite_principale?: string
    date_creation?: string
    categorie_entreprise?: string
    tranche_effectif_salarie?: string
    matching_etablissements?: Array<{
      siret?: string
      code_postal?: string
      libelle_commune?: string
      geo_adresse?: string
      adresse?: string
      latitude?: string
      longitude?: string
    }>
    siege?: {
      siret?: string
      code_postal?: string
      libelle_commune?: string
      geo_adresse?: string
      adresse?: string
      latitude?: string
      longitude?: string
    }
  }>
  total_results: number
  page: number
  per_page: number
  total_pages: number
}

function sleep(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms))
}

function extractDepartment(postalCode: string | null) {
  if (!postalCode) return null
  const pc = postalCode.trim()
  if (pc.length < 2) return null
  if (pc.startsWith("97") || pc.startsWith("98")) return pc.slice(0, 3)
  if (pc.startsWith("20")) return "2A/2B"
  return pc.slice(0, 2)
}

function toNumberOrNull(v: unknown) {
  const s = String(v ?? "").trim().replace(",", ".")
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function pickName(r: SearchResponse["results"][number]) {
  return String(r.nom_complet || r.nom_raison_sociale || r.sigle || "").trim()
}

function mapToCompanies(dept: string, r: SearchResponse["results"][number]): MartechCompany[] {
  const name = pickName(r)
  if (!name) return []

  const etabs = Array.isArray(r.matching_etablissements) ? r.matching_etablissements : []
  const candidates = etabs.length ? etabs : r.siege ? [r.siege] : []

  const companies: MartechCompany[] = []
  for (const e of candidates) {
    const postalCode = e.code_postal ? String(e.code_postal).trim() : null
    const department = extractDepartment(postalCode)
    if (dept !== "all" && department && dept !== "2A/2B" && department !== dept) continue

    const id = e.siret ? `api-${e.siret}` : makeCompanyId(name, postalCode)
    companies.push({
      id,
      name,
      type: "other",
      category: "other",
      activityDomain: r.section_activite_principale ? String(r.section_activite_principale) : null,
      categorieEntreprise:
        r.categorie_entreprise === "PME" || r.categorie_entreprise === "ETI" || r.categorie_entreprise === "GE"
          ? (r.categorie_entreprise as any)
          : null,
      trancheEffectifSalarie: r.tranche_effectif_salarie ? String(r.tranche_effectif_salarie) : null,
      tags: [
        r.siren ? `SIREN:${r.siren}` : "",
        r.activite_principale ? `NAF:${r.activite_principale}` : "",
      ].filter(Boolean),
      phone: null,
      addressLine: e.geo_adresse ? String(e.geo_adresse) : e.adresse ? String(e.adresse) : null,
      postalCode,
      city: e.libelle_commune ? String(e.libelle_commune) : null,
      department: department && department !== "2A/2B" ? department : dept,
      websiteUrl: null,
      contactUrl: null,
      legalUrl: null,
      decisionEmail: null,
      leaderName: null,
      lat: toNumberOrNull((e as any).latitude),
      lng: toNumberOrNull((e as any).longitude),
      siteFirstSeenAt: null,
      siteFirstSeenEvidenceUrl: null,
      redesignEstimatedAt: null,
      redesignWindowStart: null,
      redesignWindowEnd: null,
      redesignConfidence: null,
      redesignEvidenceUrls: [],
      sources: ["https://recherche-entreprises.api.gouv.fr/"],
      notes: null,
      googlePlaceId: null,
      enrichmentStatus: "pending",
      enrichedAt: null,
      updatedAt: new Date().toISOString(),
    })
  }

  return companies
}

import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

export async function fetchEnterprisesByDepartment(dept: string, page: number, perPage: number) {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // Requête directe vers votre base Supabase
  const { data, count, error } = await supabase
    .from("companies")
    .select("*", { count: "exact" })
    .eq("department", dept)
    .range(from, to);

  if (error) throw error;

  return {
    items: data || [],
    meta: {
      totalResults: count || 0,
      page: page,
      perPage: perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    },
  };
}
    } catch (e) {
      lastError = e
      await sleep(400 * (i + 1))
    }
  }

  throw lastError
}
