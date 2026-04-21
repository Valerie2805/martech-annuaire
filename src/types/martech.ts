export type CompanyType = "saas" | "agence" | "freelance" | "esn" | "cabinet" | "other"

export type MartechCategory =
  | "crm"
  | "emailing"
  | "automation"
  | "ads"
  | "seo"
  | "analytics"
  | "social"
  | "content"
  | "ecommerce"
  | "other"

export type MartechCompany = {
  id: string
  name: string
  type: CompanyType
  category: MartechCategory
  activityDomain: string | null
  categorieEntreprise: "PME" | "ETI" | "GE" | null
  trancheEffectifSalarie: string | null
  tags: string[]
  phone: string | null
  addressLine: string | null
  postalCode: string | null
  city: string | null
  department: string | null
  websiteUrl: string | null
  contactUrl: string | null
  legalUrl: string | null
  decisionEmail: string | null
  leaderName: string | null
  lat: number | null
  lng: number | null
  siteFirstSeenAt: string | null
  siteFirstSeenEvidenceUrl: string | null
  redesignEstimatedAt: string | null
  redesignWindowStart: string | null
  redesignWindowEnd: string | null
  redesignConfidence: "high" | "medium" | "low" | null
  redesignEvidenceUrls: string[]
  sources: string[]
  notes: string | null
  googlePlaceId: string | null
  enrichmentStatus: "pending" | "needs_review" | "enriched" | "no_match"
  enrichedAt: string | null
  updatedAt: string
}
