import { db } from "@/lib/db"
import { logClick } from "@/lib/click"
import { notFound } from "next/navigation"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const link = await db.link.findFirst({
    where: { slug, deletedAt: null },
  })

  if (!link) {
    notFound()
  }

  logClick(link.id, req)

  return NextResponse.redirect(link.destinationUrl, 302)
}
