import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { updateLinkSchema } from "@/lib/validations"
import { NextResponse } from "next/server"
import { z } from "zod"

async function getOwnedLink(id: string, userId: string) {
  return db.link.findFirst({
    where: { id, userId, deletedAt: null },
  })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const link = await getOwnedLink(id, session.user.id)
  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const [clickCount, clicks] = await Promise.all([
    db.click.count({ where: { linkId: id } }),
    db.click.findMany({
      where: { linkId: id },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
  ])

  return NextResponse.json({
    ...link,
    clickCount,
    recentClicks: clicks,
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const link = await getOwnedLink(id, session.user.id)
    if (!link) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const json = await req.json()
    const data = updateLinkSchema.parse(json)

    const updated = await db.link.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const link = await getOwnedLink(id, session.user.id)
  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await db.link.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
