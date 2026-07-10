import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createLinkSchema } from "@/lib/validations"
import { NextResponse } from "next/server"
import { z } from "zod"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const json = await req.json()
    const data = createLinkSchema.parse(json)

    const existing = await db.link.findFirst({
      where: { slug: data.slug },
    })
    if (existing) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 })
    }

    const link = await db.link.create({
      data: {
        slug: data.slug,
        destinationUrl: data.destinationUrl,
        title: data.title ?? null,
        userId: session.user.id,
      },
    })

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || ""
  const sort = searchParams.get("sort") || "newest"
  const take = Math.min(Number(searchParams.get("take")) || 50, 100)
  const cursor = searchParams.get("cursor")

  const where: Record<string, unknown> = {
    userId: session.user.id,
    deletedAt: null,
  }

  if (search) {
    where.OR = [
      { slug: { contains: search } },
      { destinationUrl: { contains: search } },
    ]
  }

  const orderBy =
    sort === "clicks"
      ? { clicks: { _count: "desc" as const } }
      : { createdAt: "desc" as const }

  const links = await db.link.findMany({
    where,
    orderBy,
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      _count: { select: { clicks: true } },
    },
  })

  const hasMore = links.length > take
  const items = hasMore ? links.slice(0, take) : links
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({
    links: items.map(({ _count, ...link }) => ({
      ...link,
      clickCount: _count.clicks,
    })),
    nextCursor,
  })
}
