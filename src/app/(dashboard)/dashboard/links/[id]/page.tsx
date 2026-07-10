import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
        &larr; Back to links
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Link Details</h1>
      <p className="text-muted-foreground">Link ID: {id}</p>
    </div>
  )
}
