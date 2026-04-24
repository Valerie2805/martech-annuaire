import { createClient } from "@supabase/supabase-js"

type ReqBody = {
  department: string
  page?: number
  perPage?: number
}

type SearchResponse = {
  results: Array<{
    siren?: string
    nom_complet?: string
    nom_raison_sociale?: string
    sigle?: string
    categorie_entreprise?: string
    tranche_effectif_salarie?: string
    activite_principale?: string
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

function json(res: any, status: number, body: any) {
  res.statusCode = status
  res.setHeader("content-type", "application/json")
  res.setHeader("cache-control", "no-store")
  res.end(JSON.stringify(body))
}

function pickName(r: SearchResponse["results"][number]) {
  return String(r.nom_complet || r.nom_raison_sociale || r.sigle || "").trim()
}

function toNumberOrNull(v: unknown) {
  const s = String(v ?? "").trim().replace(",", ".")
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function extractDepartment(postalCode: string | null) {
  if (!postalCode) return null
  const pc = postalCode.trim()
  if (pc.length < 2) return null
  if (pc.startsWith("97") || pc.startsWith("98")) return pc.slice(0, 3)
  if (pc.startsWith("20")) return "2A/2B"
  return pc.slice(0, 2)
}

function mapToRows(dept: string, r: SearchResponse["results"][number]) {
  const name = pickName(r)
  if (!name) return []

  const etabs = Array.isArray(r.matching_etablissements) ? r.matching_etablissements : []
  const candidates = etabs.length ? etabs : r.siege ? [r.siege] : []

  const rows: Array<Record<string, any>> = []
  for (const e of candidates) {
    const siret = e.siret ? String(e.siret).trim() : null
    const postalCode = e.code_postal ? String(e.code_postal).trim() : null
    const computedDept = extractDepartment(postalCode)
    if (computedDept && computedDept !== "2A/2B" && computedDept !== dept) continue

    const id = siret ? `api-${siret}` : `${dept}-${name}-${postalCode || ""}`.toLowerCase().replace(/\s+/g, "-").slice(0, 140)

    rows.push({
      id,
      name,
      type: "other",
      category: "other",
      activity_domain: null,
      categorie_entreprise:
        r.categorie_entreprise === "PME" || r.categorie_entreprise === "ETI" || r.categorie_entreprise === "GE"
          ? r.categorie_entreprise
          : null,
      tranche_effectif_salarie: r.tranche_effectif_salarie ?? null,
      tags: [
        r.siren ? `SIREN:${r.siren}` : "",
        r.activite_principale ? `NAF:${r.activite_principale}` : "",
      ].filter(Boolean),
      phone: null,
      address_line: e.geo_adresse ? String(e.geo_adresse) : e.adresse ? String(e.adresse) : null,
      postal_code: postalCode,
      city: e.libelle_commune ? String(e.libelle_commune) : null,
      department: computedDept && computedDept !== "2A/2B" ? computedDept : dept,
      website_url: null,
      contact_url: null,
      legal_url: null,
      decision_email: null,
      leader_name: null,
      lat: toNumberOrNull((e as any).latitude),
      lng: toNumberOrNull((e as any).longitude),
      site_first_seen_at: null,
      site_first_seen_evidence_url: null,
      redesign_estimated_at: null,
      redesign_window_start: null,
      redesign_window_end: null,
      redesign_confidence: null,
      redesign_evidence_urls: [],
      sources: ["https://recherche-entreprises.api.gouv.fr/"],
      notes: null,
      place_id: null,
      enrichment_status: "pending",
      enriched_at: null,
      updated_at: new Date().toISOString(),
    })
  }

  return rows
}

export default async function handler(req: any, res: any) {
  const method = String(req.method || "").toUpperCase()
  if (method !== "POST" && method !== "GET") return json(res, 405, { error: "method_not_allowed" })

  const url = process.env.SUPABASE_URL || ""
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  if (!url || !key) return json(res, 500, { error: "missing_supabase_env" })

  let body: ReqBody | null = null
  if (method === "POST") {
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
    } catch {
      return json(res, 400, { error: "invalid_json" })
    }
  } else {
    const u = new URL(String(req.url || "/"), "http://localhost")
    const department = u.searchParams.get("department") || u.searchParams.get("departement") || ""
    const page = u.searchParams.get("page") || ""
    const perPage = u.searchParams.get("perPage") || u.searchParams.get("per_page") || ""
    body = {
      department,
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
    }
  }

  const department = String(body?.department || "").trim()
  if (!department || department === "all") return json(res, 400, { error: "invalid_department" })
  const page = Number(body?.page ?? 1)
  const perPage = Math.min(25, Math.max(1, Number(body?.perPage ?? 25)))
  if (!Number.isFinite(page) || page < 1) return json(res, 400, { error: "invalid_page" })

  const upstream = new URL("https://recherche-entreprises.api.gouv.fr/search")
  upstream.searchParams.set("departement", department)
  upstream.searchParams.set("page", String(page))
  upstream.searchParams.set("per_page", String(perPage))

  const upstreamRes = await fetch(upstream.toString(), {
    headers: { Accept: "application/json", "User-Agent": "martech-annuaire/1.0" },
  })

  if (upstreamRes.status === 429) return json(res, 429, { error: "rate_limited" })
  if (!upstreamRes.ok) return json(res, 502, { error: `upstream_${upstreamRes.status}` })

  const data = (await upstreamRes.json()) as SearchResponse
  const rows = data.results.flatMap((r) => mapToRows(department, r))

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const { error } = await supabase.from("companies").upsert(rows, { onConflict: "id" })
  if (error) return json(res, 500, { error: error.message })

  return json(res, 200, {
    imported: rows.length,
    page: data.page,
    perPage: data.per_page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    nextPage: data.page < data.total_pages ? data.page + 1 : null,
  })
}

