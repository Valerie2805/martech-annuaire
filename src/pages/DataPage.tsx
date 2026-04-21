import { useMemo, useState } from "react"
import { Upload, FileText, Trash2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Select"
import { useCompaniesStore } from "@/stores/companiesStore"
import { FR_DEPARTMENTS } from "@/data/france"
import { importCompaniesCsv } from "@/utils/csv"

export default function DataPage() {
  const upsertMany = useCompaniesStore((s) => s.upsertMany)
  const clearLocal = useCompaniesStore((s) => s.clearLocal)
  const total = useCompaniesStore((s) => s.companies.length)
  const loading = useCompaniesStore((s) => s.loading)
  const error = useCompaniesStore((s) => s.error)
  const supabaseEnabled = useCompaniesStore((s) => s.supabaseEnabled)

  const [raw, setRaw] = useState<string>("")
  const [filename, setFilename] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [syncDept, setSyncDept] = useState("78")
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncPage, setSyncPage] = useState<number | null>(1)
  const [syncTotalPages, setSyncTotalPages] = useState<number | null>(null)
  const [syncImported, setSyncImported] = useState(0)
  const parsed = useMemo(() => (raw ? importCompaniesCsv(raw) : null), [raw])

  async function syncOnce(reset: boolean) {
    const page = reset ? 1 : syncPage
    if (!page) return

    setSyncLoading(true)
    setSyncError(null)
    try {
      const res = await fetch("/api/sync/department", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ department: syncDept, page }),
      })
      if (!res.ok) {
        const t = await res.text().catch(() => "")
        throw new Error(t || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setSyncImported((x) => (reset ? 0 : x) + Number(data.imported ?? 0))
      setSyncTotalPages(Number(data.totalPages ?? 0) || null)
      setSyncPage(data.nextPage ? Number(data.nextPage) : null)
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSyncLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-6 shadow-paper">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--paper))]">
              <Upload size={18} />
            </div>
            <div>
              <div className="font-editorial text-2xl tracking-tight">Données</div>
              <div className="mt-1 text-sm text-[hsl(var(--muted))]">Import CSV, validation et persistance locale.</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={loading || saving} onClick={() => clearLocal()}>
              <Trash2 size={16} />
              {supabaseEnabled ? "Recharger" : "Réinitialiser"}
            </Button>
          </div>
        </div>

        <div className="mt-4 text-sm text-[hsl(var(--muted))]">
          Base actuelle : <span className="font-editorial text-[hsl(var(--ink))]/80">{total}</span> entrées.
        </div>
        {error ? <div className="mt-3 text-sm text-red-600">Erreur : {error}</div> : null}
      </div>

      <div className="rounded-[28px] border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-6 shadow-paper">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-editorial text-xl tracking-tight">Synchroniser un département</div>
            <div className="mt-1 text-sm text-[hsl(var(--muted))]">
              Importe des entreprises (TPE/PME/ETI/GE) depuis la source publique et les enregistre dans Supabase.
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-4">
            <div className="text-xs text-[hsl(var(--muted))]">Département</div>
            <Select value={syncDept} onChange={(e) => setSyncDept(e.target.value)}>
              {FR_DEPARTMENTS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} — {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-8">
            <div className="flex flex-col gap-2 md:flex-row md:justify-end">
              <Button variant="outline" disabled={syncLoading} onClick={() => void syncOnce(true)}>
                Démarrer
              </Button>
              <Button variant="outline" disabled={syncLoading || !syncPage} onClick={() => void syncOnce(false)}>
                Charger plus
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-[hsl(var(--muted))]">
          Importés : <span className="font-editorial text-[hsl(var(--ink))]/80">{syncImported}</span>
          {syncPage ? ` • Prochaine page : ${syncPage}` : " • Terminé"}
          {syncTotalPages ? ` • Pages : ${syncTotalPages}` : ""}
        </div>
        {syncError ? <div className="mt-3 text-sm text-red-600">Erreur sync : {syncError}</div> : null}
      </div>

      <div className="rounded-[28px] border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-6 shadow-paper">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-editorial text-xl tracking-tight">Importer un CSV</div>
            <div className="mt-1 text-sm text-[hsl(var(--muted))]">
              Colonnes supportées : name, type (saas/agence/freelance/esn/cabinet/other), category, city, postalCode, department,
              activityDomain, websiteUrl, decisionEmail, contactUrl, legalUrl, tags, sources, lat, lng, siteFirstSeenAt, redesignEstimatedAt.
            </div>
          </div>
          {filename ? (
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted))]">
              <FileText size={16} />
              <span className="max-w-[220px] truncate">{filename}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <input
            type="file"
            accept=".csv,text/csv"
            className="block w-full text-sm text-[hsl(var(--muted))] file:mr-4 file:rounded-full file:border file:border-[hsl(var(--line))] file:bg-[hsl(var(--paper))] file:px-4 file:py-2 file:text-sm file:text-[hsl(var(--ink))] file:shadow-paper"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setFilename(file.name)
              file.text().then((t) => setRaw(t))
            }}
          />
        </div>

        {parsed ? (
          <div className="mt-6 grid gap-4 md:grid-cols-12 md:items-start">
            <div className="md:col-span-7">
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--ink))]/80">
                <CheckCircle2 size={16} />
                <span>
                  Importables : <span className="font-editorial">{parsed.imported.length}</span>
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  disabled={!parsed.imported.length}
                  onClick={async () => {
                    setSaving(true)
                    try {
                      await upsertMany(parsed.imported)
                      setRaw("")
                      setFilename(null)
                    } finally {
                      setSaving(false)
                    }
                  }}
                >
                  Ajouter au catalogue
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRaw("")
                    setFilename(null)
                  }}
                >
                  Effacer
                </Button>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--ink))]/80">
                <XCircle size={16} />
                <span>
                  Rejetées : <span className="font-editorial">{parsed.rejected.length}</span>
                </span>
              </div>
              {parsed.rejected.length ? (
                <div className="mt-3 max-h-56 space-y-2 overflow-auto rounded-[22px] border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-3">
                  {parsed.rejected.slice(0, 20).map((r, idx) => (
                    <div key={idx} className="text-xs text-[hsl(var(--muted))]">
                      {r.reason}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-5 text-sm text-[hsl(var(--muted))]">Aucun fichier chargé.</div>
        )}
      </div>
    </div>
  )
}
