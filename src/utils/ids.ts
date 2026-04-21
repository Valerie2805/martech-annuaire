export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function makeCompanyId(name: string, postalCode?: string | null) {
  const base = slugify(name)
  const suffix = postalCode ? `-${postalCode}` : ""
  return `${base}${suffix}`.slice(0, 64)
}

