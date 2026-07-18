"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { BlogPostStatus } from "@/generated/prisma/enums"
import { logAdminAction } from "@/lib/admin/audit"
import { BLOG_LOCALES, SLUG_RE, type ContentFormState } from "@/lib/admin/content"
import { requireAdminAction } from "@/lib/admin/guard"
import { optString, reqEnum, reqString } from "@/lib/admin/validate"
import { db } from "@/lib/db"

const STATUSES = [
  BlogPostStatus.draft,
  BlogPostStatus.published,
  BlogPostStatus.archived,
] as const

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  )
}

function parseTags(raw: string | null): string[] {
  return (raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20)
}

/** Shape persisted by both create and update. */
function readPostFields(fd: FormData) {
  const slug = reqString(fd, "slug", 240)
  if (!SLUG_RE.test(slug)) {
    throw new Error("Slug may only contain lowercase letters, numbers and hyphens")
  }
  return {
    slug,
    status: reqEnum(fd, "status", STATUSES),
    locale: reqEnum(fd, "locale", BLOG_LOCALES),
    category: optString(fd, "category", 80),
    tags: parseTags(optString(fd, "tags", 500)),
    featuredImage: optString(fd, "featuredImage", 2000),
    titleKa: reqString(fd, "titleKa", 300),
    titleEn: optString(fd, "titleEn", 300),
    titleRu: optString(fd, "titleRu", 300),
    excerptKa: optString(fd, "excerptKa", 2000),
    excerptEn: optString(fd, "excerptEn", 2000),
    excerptRu: optString(fd, "excerptRu", 2000),
    bodyKa: reqString(fd, "bodyKa", 100_000),
    bodyEn: optString(fd, "bodyEn", 100_000),
    bodyRu: optString(fd, "bodyRu", 100_000),
  }
}

export async function saveBlogPost(
  _prev: ContentFormState,
  fd: FormData,
): Promise<ContentFormState> {
  const session = await requireAdminAction()
  const id = optString(fd, "id", 120)

  let data: ReturnType<typeof readPostFields>
  try {
    data = readPostFields(fd)
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid input" }
  }

  if (id) {
    const before = await db.blogPost.findUnique({
      where: { id },
      select: { slug: true, status: true, titleKa: true },
    })
    if (!before) return { error: "Post not found" }
    try {
      await db.blogPost.update({ where: { id }, data })
    } catch (e) {
      if (isUniqueViolation(e)) return { error: "That slug is already in use" }
      throw e
    }
    await logAdminAction(session, "content.blog.update", "BlogPost", id, {
      before,
      after: { slug: data.slug, status: data.status, titleKa: data.titleKa },
    })
    revalidatePath("/admin/content/blog")
    revalidatePath(`/admin/content/blog/${id}`)
    return { error: null }
  }

  let createdId = ""
  try {
    const created = await db.blogPost.create({
      data: {
        ...data,
        authorId: session.user.id,
        ...(data.status === BlogPostStatus.published
          ? { publishedAt: new Date() }
          : {}),
      },
      select: { id: true },
    })
    createdId = created.id
  } catch (e) {
    if (isUniqueViolation(e)) return { error: "That slug is already in use" }
    throw e
  }
  await logAdminAction(session, "content.blog.create", "BlogPost", createdId, {
    after: { slug: data.slug, status: data.status, titleKa: data.titleKa },
  })
  revalidatePath("/admin/content/blog")
  redirect(`/admin/content/blog/${createdId}`)
}

export async function publishBlogPost(fd: FormData): Promise<void> {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.blogPost.findUnique({
    where: { id },
    select: { status: true, publishedAt: true },
  })
  if (!before) throw new Error("Post not found")
  await db.blogPost.update({
    where: { id },
    data: {
      status: BlogPostStatus.published,
      publishedAt: before.publishedAt ?? new Date(),
    },
  })
  await logAdminAction(session, "content.blog.publish", "BlogPost", id, {
    before: { status: before.status },
    after: { status: BlogPostStatus.published },
  })
  revalidatePath("/admin/content/blog")
  revalidatePath(`/admin/content/blog/${id}`)
}

export async function unpublishBlogPost(fd: FormData): Promise<void> {
  const session = await requireAdminAction()
  const id = reqString(fd, "id", 120)
  const before = await db.blogPost.findUnique({
    where: { id },
    select: { status: true },
  })
  if (!before) throw new Error("Post not found")
  await db.blogPost.update({
    where: { id },
    data: { status: BlogPostStatus.draft },
  })
  await logAdminAction(session, "content.blog.unpublish", "BlogPost", id, {
    before: { status: before.status },
    after: { status: BlogPostStatus.draft },
  })
  revalidatePath("/admin/content/blog")
  revalidatePath(`/admin/content/blog/${id}`)
}
