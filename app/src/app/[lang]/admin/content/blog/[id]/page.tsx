import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
  BlogEditorForm,
  type BlogEditorDefaults,
} from "@/components/admin/content/BlogEditorForm"
import { ContentTabs } from "@/components/admin/content/ContentTabs"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { BlogPostStatus } from "@/generated/prisma/enums"
import { fmtDateTime } from "@/lib/admin/format"
import { requireAdmin } from "@/lib/admin/guard"
import { db } from "@/lib/db"

import { publishBlogPost, unpublishBlogPost } from "../actions"

export const metadata = { title: "Blog editor" }

const EMPTY: BlogEditorDefaults = {
  id: "",
  slug: "",
  status: BlogPostStatus.draft,
  locale: "ka",
  category: "",
  tags: "",
  featuredImage: "",
  titleKa: "",
  titleEn: "",
  titleRu: "",
  excerptKa: "",
  excerptEn: "",
  excerptRu: "",
  bodyKa: "",
  bodyEn: "",
  bodyRu: "",
}

export default async function BlogEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const isNew = id === "new"
  const post = isNew ? null : await db.blogPost.findUnique({ where: { id } })
  if (!isNew && !post) notFound()

  const defaults: BlogEditorDefaults = post
    ? {
        id: post.id,
        slug: post.slug,
        status: post.status,
        locale: post.locale,
        category: post.category ?? "",
        tags: post.tags.join(", "),
        featuredImage: post.featuredImage ?? "",
        titleKa: post.titleKa,
        titleEn: post.titleEn ?? "",
        titleRu: post.titleRu ?? "",
        excerptKa: post.excerptKa ?? "",
        excerptEn: post.excerptEn ?? "",
        excerptRu: post.excerptRu ?? "",
        bodyKa: post.bodyKa,
        bodyEn: post.bodyEn ?? "",
        bodyRu: post.bodyRu ?? "",
      }
    : EMPTY

  return (
    <>
      <div className="mb-4">
        <Link
          href="/admin/content/blog"
          className="inline-flex h-9 items-center gap-1.5 text-[13px] font-bold text-sv-ink/50 transition-colors hover:text-sv-ink"
        >
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>
      </div>
      <PageHeader
        title={isNew ? "New blog post" : (post?.titleKa ?? "Edit post")}
        description={
          isNew
            ? "Draft a new article — Georgian content is required, other locales optional"
            : `Created ${fmtDateTime(post?.createdAt)} · Updated ${fmtDateTime(post?.updatedAt)}${
                post?.publishedAt ? ` · Published ${fmtDateTime(post.publishedAt)}` : ""
              }`
        }
        actions={
          post ? (
            post.status === BlogPostStatus.published ? (
              <ConfirmButton
                action={unpublishBlogPost}
                fields={{ id: post.id }}
                label="Unpublish"
                tone="warning"
                confirm="Move this post back to draft? It will disappear from the public blog."
              />
            ) : (
              <ConfirmButton
                action={publishBlogPost}
                fields={{ id: post.id }}
                label="Publish now"
                tone="primary"
              />
            )
          ) : undefined
        }
      />
      <ContentTabs active="/admin/content/blog" />
      <BlogEditorForm defaults={defaults} />
    </>
  )
}
