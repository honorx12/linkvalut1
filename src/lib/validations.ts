import { z } from "zod"

export const createLinkSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be under 100 characters")
    .regex(/^[a-zA-Z0-9-]+$/, "Slug can only contain letters, numbers, and hyphens"),
  destinationUrl: z.string().url("Must be a valid URL"),
  title: z.string().max(200, "Title must be under 200 characters").optional(),
})

export const updateLinkSchema = z.object({
  destinationUrl: z.string().url("Must be a valid URL").optional(),
  title: z.string().max(200, "Title must be under 200 characters").optional(),
})

export type CreateLinkInput = z.infer<typeof createLinkSchema>
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>
