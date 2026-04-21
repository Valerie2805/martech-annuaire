import { create } from "zustand"
import { seedCompanies } from "@/data/seedCompanies"
import { type MartechCategory, type MartechCompany, type CompanyType } from "@/types/martech"
import { fetchEnterprisesByDepartment } from "@/utils/entreprisesApi"
import { supabase } from "@/lib/supabase"

export type DirectoryFilters = {
  query: string
  type: CompanyType | "all"
  category: MartechCategory | "all"
  activityDomain: string | "all"
  website: "only" | "all"
  size: "tpe_pme" | "tpe" | "pme" | "all"
  tech: string | "all"
  department: string | "all"
  city: string | "all"
}

type CompaniesState = {
  companies: MartechCompany[]
  loading: boolean
  error: string | null
  supabaseEnabled: boolean
  remoteByDepartment: Record<
    string,
    {
      items: MartechCompany[]
      page: number
      totalPages: number
      totalResults: number
      loading: boolean
      error: string | null
    }
  >
  selectedId: string | null
  filters: DirectoryFilters
  setFilters: (patch: Partial<DirectoryFilters>) => void
  resetFilters: () => void
  select: (id: string | null) => void
  init: () => Promise<void>
  reload: () => Promise<void>
  upsertMany: (items: MartechCompany[]) => Promise<void>
  loadDepartment: (department: string, opts?: { reset?: boolean }) => Promise<void>
  removeById: (id: string) => Promise<void>
  clearLocal: () => Promise<void>
}

const defaultFilters: DirectoryFilters = {
  query: "",
  type: "all",
  category: "all",
  activityDomain: "all",
  website: "only",
  size: "tpe_pme",
  tech: "all",
  department: "all",
  city: "all",
}

function dedupeById(items: MartechCompany[]) {
  const map = new Map<string, MartechCompany>()
  for (const it of items) map.set(it.id, it)
  return [...map.values()]
}

function normalizeCompany(c: MartechCompany): MartechCompany {
  const postalDepartment = c.postalCode && c.postalCode.length >= 2 ? c.postalCode.slice(0, 2) : null
  const department =
    postalDepartment && c.department && c.department !== postalDepartment ? postalDepartment : (c.department ?? postalDepartment)

  return {
    ...c,
    department,
    activityDomain: c.activityDomain ?? null,
    categorieEntreprise: c.categorieEntreprise ?? null,
    trancheEffectifSalarie: c.trancheEffectifSalarie ?? null,
    phone: c.phone ?? null,
    siteFirstSeenAt: c.siteFirstSeenAt ?? null,
    siteFirstSeenEvidenceUrl: c.siteFirstSeenEvidenceUrl ?? null,
    redesignEstimatedAt: c.redesignEstimatedAt ?? null,
    redesignWindowStart: c.redesignWindowStart ?? null,
    redesignWindowEnd: c.redesignWindowEnd ?? null,
    redesignConfidence: c.redesignConfidence ?? null,
    redesignEvidenceUrls: c.redesignEvidenceUrls ?? [],
    googlePlaceId: c.googlePlaceId ?? null,
    enrichmentStatus: c.enrichmentStatus ?? "pending",
    enrichedAt: c.enrichedAt ?? null,
    updatedAt: c.updatedAt || new Date().toISOString(),
  }
}

type CompanyRow = Record<string, any>

function rowToCompany(row: CompanyRow): MartechCompany {
  const tagsValue = Array.isArray(row.tags) ? row.tags : typeof row.tags === "string" ? row.tags.split(/[,;|]/g) : []
  const tags = tagsValue.map((x: any) => String(x).trim()).filter(Boolean)
  const sourcesValue = Array.isArray(row.sources)
    ? row.sources
    : typeof row.sources === "string"
      ? row.sources.split(/[,;|]/g)
      : []
  const sources = sourcesValue.map((x: any) => String(x).trim()).filter(Boolean)

  return normalizeCompany({
    id: String(row.id),
    name: String(row.name ?? ""),
    type: (row.type as any) || "other",
    category: (row.category as any) || "other",
    activityDomain: row.activity_domain ?? row.activityDomain ?? null,
    categorieEntreprise: row.categorie_entreprise ?? row.categorieEntreprise ?? null,
    trancheEffectifSalarie: row.tranche_effectif_salarie ?? row.trancheEffectifSalarie ?? null,
    tags,
    phone: row.phone ?? null,
    addressLine: row.address_line ?? row.addressLine ?? row.address ?? null,
    postalCode: row.postal_code ?? row.postalCode ?? null,
    city: row.city ?? null,
    department: row.department ?? null,
    websiteUrl: row.website_url ?? row.websiteUrl ?? null,
    contactUrl: row.contact_url ?? row.contactUrl ?? null,
    legalUrl: row.legal_url ?? row.legalUrl ?? null,
    decisionEmail: row.decision_email ?? row.decisionEmail ?? null,
    leaderName: row.leader_name ?? row.leaderName ?? null,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    siteFirstSeenAt: row.site_first_seen_at ?? row.siteFirstSeenAt ?? null,
    siteFirstSeenEvidenceUrl: row.site_first_seen_evidence_url ?? row.siteFirstSeenEvidenceUrl ?? null,
    redesignEstimatedAt: row.redesign_estimated_at ?? row.redesignEstimatedAt ?? null,
    redesignWindowStart: row.redesign_window_start ?? row.redesignWindowStart ?? null,
    redesignWindowEnd: row.redesign_window_end ?? row.redesignWindowEnd ?? null,
    redesignConfidence: row.redesign_confidence ?? row.redesignConfidence ?? null,
    redesignEvidenceUrls: row.redesign_evidence_urls ?? row.redesignEvidenceUrls ?? [],
    sources,
    notes: row.notes ?? null,
    googlePlaceId: row.place_id ?? row.google_place_id ?? row.googlePlaceId ?? null,
    enrichmentStatus: row.enrichment_status ?? row.enrichmentStatus ?? "pending",
    enrichedAt: row.enriched_at ?? row.enrichedAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  })
}

async function fetchCompaniesFromSupabase() {
  if (!supabase) return { data: null as MartechCompany[] | null, error: null as string | null }
  const { data, error } = await supabase.from("companies").select("*").order("updated_at", { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data: (data ?? []).map(rowToCompany), error: null }
}

function companyToRow(c: MartechCompany) {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    category: c.category,
    activity_domain: c.activityDomain,
    categorie_entreprise: c.categorieEntreprise,
    tranche_effectif_salarie: c.trancheEffectifSalarie,
    tags: c.tags,
    phone: c.phone,
    address_line: c.addressLine,
    postal_code: c.postalCode,
    city: c.city,
    department: c.department,
    website_url: c.websiteUrl,
    contact_url: c.contactUrl,
    legal_url: c.legalUrl,
    decision_email: c.decisionEmail,
    leader_name: c.leaderName,
    lat: c.lat,
    lng: c.lng,
    site_first_seen_at: c.siteFirstSeenAt,
    site_first_seen_evidence_url: c.siteFirstSeenEvidenceUrl,
    redesign_estimated_at: c.redesignEstimatedAt,
    redesign_window_start: c.redesignWindowStart,
    redesign_window_end: c.redesignWindowEnd,
    redesign_confidence: c.redesignConfidence,
    redesign_evidence_urls: c.redesignEvidenceUrls,
    sources: c.sources,
    notes: c.notes,
    place_id: c.googlePlaceId,
    enrichment_status: c.enrichmentStatus,
    enriched_at: c.enrichedAt,
    updated_at: c.updatedAt,
  }
}

export const useCompaniesStore = create<CompaniesState>()(
  (set, get) => ({
    companies: seedCompanies.map(normalizeCompany),
    loading: false,
    error: null,
    supabaseEnabled: Boolean(supabase),
    remoteByDepartment: {},
    selectedId: null,
    filters: defaultFilters,
    setFilters: (patch) => set({ filters: { ...get().filters, ...patch } }),
    resetFilters: () => set({ filters: defaultFilters }),
    select: (id) => set({ selectedId: id }),
    init: async () => {
      await get().reload()
    },
    reload: async () => {
      if (!supabase) {
        set({ companies: seedCompanies.map(normalizeCompany), loading: false, error: null })
        return
      }

      set({ loading: true, error: null })
      const { data, error } = await fetchCompaniesFromSupabase()
      if (error) {
        set({ companies: seedCompanies.map(normalizeCompany), loading: false, error })
        return
      }
      set({ companies: data ?? [], loading: false, error: null })
    },
    upsertMany: async (items) => {
      if (!supabase) {
        set((s) => ({
          companies: dedupeById(
            [...items, ...s.companies].map((c) => normalizeCompany(c)),
          ),
        }))
        return
      }

      set({ loading: true, error: null })
      const rows = items.map((c) => companyToRow(normalizeCompany(c)))
      const { error } = await supabase.from("companies").upsert(rows, { onConflict: "id" })
      if (error) {
        set({ loading: false, error: error.message })
        return
      }
      await get().reload()
    },
    loadDepartment: async (department, opts) => {
      const dept = String(department || "").trim()
      if (!dept || dept === "all") return

      const reset = opts?.reset ?? false
      const current = get().remoteByDepartment[dept]
      const nextPage = reset ? 1 : (current?.page ?? 0) + 1
      if (!reset && current?.loading) return
      if (!reset && current && current.page >= current.totalPages) return

      set((s) => ({
        remoteByDepartment: {
          ...s.remoteByDepartment,
          [dept]: {
            items: reset ? [] : (current?.items ?? []),
            page: reset ? 0 : (current?.page ?? 0),
            totalPages: current?.totalPages ?? 1,
            totalResults: current?.totalResults ?? 0,
            loading: true,
            error: null,
          },
        },
      }))

      try {
        const { items, meta } = await fetchEnterprisesByDepartment(dept, nextPage, 25)
        set((s) => {
          const prev = s.remoteByDepartment[dept]
          const merged = dedupeById([...(prev?.items ?? []), ...items])
          return {
            remoteByDepartment: {
              ...s.remoteByDepartment,
              [dept]: {
                items: merged,
                page: meta.page,
                totalPages: meta.totalPages,
                totalResults: meta.totalResults,
                loading: false,
                error: null,
              },
            },
          }
        })
      } catch (e) {
        set((s) => ({
          remoteByDepartment: {
            ...s.remoteByDepartment,
            [dept]: {
              items: current?.items ?? [],
              page: current?.page ?? 0,
              totalPages: current?.totalPages ?? 1,
              totalResults: current?.totalResults ?? 0,
              loading: false,
              error: e instanceof Error ? e.message : "Erreur",
            },
          },
        }))
      }
    },
    removeById: async (id) => {
      if (!supabase) {
        set((s) => ({ companies: s.companies.filter((c) => c.id !== id) }))
        return
      }
      set({ loading: true, error: null })
      const { error } = await supabase.from("companies").delete().eq("id", id)
      if (error) {
        set({ loading: false, error: error.message })
        return
      }
      await get().reload()
    },
    clearLocal: async () => {
      if (!supabase) {
        set({ companies: seedCompanies.map(normalizeCompany), selectedId: null, filters: defaultFilters })
        return
      }
      await get().reload()
    },
  }),
)
