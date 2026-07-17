/** Shared constants & action-state types for the admin content section. */

export const SLUG_RE = /^[a-z0-9-]+$/

export const BLOG_LOCALES = ["ka", "en", "ru"] as const

export const REVIEW_TARGET_TYPES = [
  "listing",
  "project",
  "developer",
  "agent",
  "neighborhood",
  "account",
] as const

/** Form state returned by content server actions (useActionState). */
export type ContentFormState = { error: string | null }
