import { db } from "@/lib/db"

/** One palette/search result row. */
export type AdminSearchItem = {
  id: string
  title: string
  sub: string
  href: string
}

export type AdminSearchGroup = {
  id: string
  label: string
  items: AdminSearchItem[]
}

const TAKE = 5

/**
 * Server-side grouped entity search behind the admin command palette.
 * Admin-only endpoint, take-limited per group — safe against large tables.
 */
export async function globalAdminSearch(raw: string): Promise<AdminSearchGroup[]> {
  const q = raw.trim().slice(0, 80)
  if (q.length < 2) return []

  const publicId = /^\d{1,9}$/.test(q) ? Number(q) : null
  const contains = { contains: q, mode: "insensitive" as const }

  const [listings, users, projects, buildings] = await Promise.all([
    db.listing.findMany({
      where: {
        deletedAt: null,
        ...(publicId !== null
          ? { OR: [{ title: contains }, { publicId }] }
          : { title: contains }),
      },
      select: { id: true, publicId: true, title: true, city: true, status: true },
      orderBy: { createdAt: "desc" },
      take: TAKE,
    }),
    db.user.findMany({
      where: { OR: [{ name: contains }, { email: contains }, { phone: contains }] },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { createdAt: "desc" },
      take: TAKE,
    }),
    db.projectDirectory.findMany({
      where: {
        deletedAt: null,
        OR: [{ name: contains }, { developer: contains }, { slug: contains }],
      },
      select: { id: true, slug: true, name: true, developer: true, city: true },
      orderBy: { updatedAt: "desc" },
      take: TAKE,
    }),
    db.mapBuilding.findMany({
      where: {
        OR: [{ title: contains }, { titleEn: contains }, { address: contains }, { code: contains }],
      },
      select: { id: true, title: true, city: true, district: true },
      orderBy: { updatedAt: "desc" },
      take: TAKE,
    }),
  ])

  return [
    {
      id: "listings",
      label: "Listings",
      items: listings.map((l) => ({
        id: l.id,
        title: l.title,
        sub: `SIV-${l.publicId} · ${l.city} · ${l.status}`,
        href: `/admin/listings/${l.id}`,
      })),
    },
    {
      id: "users",
      label: "Users",
      items: users.map((u) => ({
        id: u.id,
        title: u.name ?? u.email,
        sub: `${u.email} · ${u.role}`,
        href: `/admin/users/${u.id}`,
      })),
    },
    {
      id: "projects",
      label: "Projects",
      items: projects.map((p) => ({
        id: p.id,
        title: p.name,
        sub: `${p.developer} · ${p.city}`,
        href: `/admin/professionals?q=${encodeURIComponent(p.slug)}`,
      })),
    },
    {
      id: "buildings",
      label: "Buildings",
      items: buildings.map((b) => ({
        id: b.id,
        title: b.title,
        sub: [b.city, b.district].filter(Boolean).join(" · "),
        href: `/admin/buildings/${b.id}`,
      })),
    },
  ].filter((g) => g.items.length > 0)
}
