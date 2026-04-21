import { Link } from "react-router-dom"
import { MapPinned, MapPin, ExternalLink } from "lucide-react"
import { useEffect } from "react"
import L from "leaflet"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import "@/lib/leafletIcons"
import { Badge } from "@/components/ui/Badge"
import { useCompaniesStore } from "@/stores/companiesStore"
import { filterCompanies } from "@/utils/directory"

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap()

  useEffect(() => {
    if (!points.length) return
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])))
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, points])

  return null
}

export default function MapPage() {
  const companies = useCompaniesStore((s) => s.companies)
  const filters = useCompaniesStore((s) => s.filters)
  const selectedId = useCompaniesStore((s) => s.selectedId)
  const select = useCompaniesStore((s) => s.select)

  const filtered = filterCompanies(companies, filters)
  const mappable = filtered.filter((c) => c.lat != null && c.lng != null)
  const points = mappable.map((c) => [c.lat as number, c.lng as number] as [number, number])

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-6 shadow-paper">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--paper))]">
            <MapPinned size={18} />
          </div>
          <div className="min-w-0">
            <div className="font-editorial text-2xl tracking-tight">Carte</div>
            <div className="mt-1 text-sm text-[hsl(var(--muted))]">
              {mappable.length} points géolocalisés (sur {filtered.length} résultats filtrés).
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="overflow-hidden rounded-[28px] border border-[hsl(var(--line))] bg-[hsl(var(--paper))] shadow-paper lg:col-span-8">
          <MapContainer
            center={[48.8, 1.9]}
            zoom={10}
            scrollWheelZoom
            style={{ height: 560, width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds points={points} />
            {mappable.map((c) => (
              <Marker
                key={c.id}
                position={[c.lat as number, c.lng as number]}
                eventHandlers={{
                  click: () => select(c.id),
                }}
              >
                <Popup>
                  <div className="space-y-2">
                    <div className="font-editorial text-base">{c.name}</div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="ink">{c.type}</Badge>
                      <Badge tone="accent">{c.category}</Badge>
                    </div>
                    <div className="text-sm text-[hsl(var(--muted))]">{c.city ?? "France"}</div>
                    <div className="flex flex-col gap-2 pt-1 text-sm">
                      <Link to={`/entreprise/${c.id}`} className="inline-flex items-center gap-2 text-[hsl(var(--ink))]">
                        <MapPin size={16} />
                        Voir la fiche
                      </Link>
                      {c.websiteUrl ? (
                        <a
                          href={c.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-[hsl(var(--ink))]"
                        >
                          <ExternalLink size={16} />
                          Site
                        </a>
                      ) : null}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="rounded-[28px] border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-4 shadow-paper lg:col-span-4">
          <div className="flex items-center justify-between gap-3 px-2 pb-3">
            <div className="text-sm text-[hsl(var(--muted))]">Sélection</div>
            <button
              className="text-xs text-[hsl(var(--muted))] hover:text-[hsl(var(--ink))]"
              onClick={() => select(null)}
            >
              Effacer
            </button>
          </div>

          <div className="max-h-[520px] space-y-2 overflow-auto px-2">
            {filtered.slice(0, 50).map((c) => (
              <button
                key={c.id}
                onClick={() => select(c.id)}
                className={[
                  "w-full rounded-2xl border px-4 py-3 text-left transition",
                  selectedId === c.id
                    ? "border-[hsl(var(--ink))]/20 bg-[hsl(var(--ink))]/4"
                    : "border-[hsl(var(--line))] hover:bg-[hsl(var(--ink))]/3",
                ].join(" ")}
              >
                <div className="truncate font-editorial text-[17px]">{c.name}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge tone="muted">{c.type}</Badge>
                  <Badge tone="accent">{c.category}</Badge>
                  {c.city ? <span className="text-xs text-[hsl(var(--muted))]">{c.city}</span> : null}
                </div>
                {c.lat == null || c.lng == null ? (
                  <div className="mt-2 text-xs text-[hsl(var(--muted))]">Pas de coordonnées (lat/lng) pour la carte.</div>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
