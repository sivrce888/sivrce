'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/guards'
import { normalizePhone } from '@/lib/inquiries/phone'
import { isServiceCategoryId, serviceSlug } from '@/lib/services'

export type AddServiceState = { error: string | null }

function asInt(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isInteger(n) && n >= 0 && n <= 999_999 ? n : null
}

export async function createServiceListing(
  _prev: AddServiceState,
  fd: FormData,
): Promise<AddServiceState> {
  const user = await requireUser('/add-service')

  const name = String(fd.get('name') ?? '').trim().replace(/\s+/g, ' ')
  if (name.length < 2 || name.length > 160) return { error: 'სახელი 2–160 სიმბოლო.' }

  const category = String(fd.get('category') ?? '')
  if (!isServiceCategoryId(category)) return { error: 'აირჩიე კატეგორია.' }

  const city = String(fd.get('city') ?? '').trim()
  if (city.length < 2 || city.length > 100) return { error: 'ქალაქი აუცილებელია.' }

  const phone = normalizePhone(String(fd.get('phone') ?? ''))
  if (!phone) return { error: 'ტელეფონი: +995 XXX XX XX XX' }

  const description = String(fd.get('description') ?? '').trim()
  if (description.length < 40 || description.length > 2000) {
    return { error: 'აღწერა 40–2000 სიმბოლო.' }
  }

  let website = String(fd.get('website') ?? '').trim()
  if (website) {
    if (!/^https:\/\//i.test(website) || website.length > 240) {
      return { error: 'ვებსაიტი უნდა იწყებოდეს https://-ით.' }
    }
  } else {
    website = ''
  }

  const priceMin = asInt(fd.get('priceMin'))
  const priceMax = asInt(fd.get('priceMax'))
  if (priceMin != null && priceMax != null && priceMax < priceMin) {
    return { error: 'მაქსიმალური ფასი მინიმუმზე ნაკლებია.' }
  }

  let slug = serviceSlug(name) || 'company'
  const taken = await db.serviceProvider.findUnique({ where: { slug }, select: { id: true } })
  if (taken) slug = `${slug}-${user.id.slice(0, 6)}`

  await db.serviceProvider.create({
    data: {
      ownerId: user.id,
      name,
      slug,
      category,
      description,
      phone,
      website: website || null,
      city,
      priceRangeMin: priceMin,
      priceRangeMax: priceMax,
      currency: 'GEL',
      isActive: true,
      verified: false,
    },
  })

  revalidatePath('/services')
  revalidatePath(`/services/${category}`)
  redirect(`/services/${category}/${slug}`)
}
