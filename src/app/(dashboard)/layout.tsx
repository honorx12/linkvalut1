import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="flex h-14 items-center px-4 lg:px-6">
          <Link href="/dashboard" className="font-bold text-lg tracking-tight">
            LinkVault
          </Link>
          <nav className="ml-auto flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="hover:underline underline-offset-4">
              Links
            </Link>
            <Link href="/login" className="hover:underline underline-offset-4">
              Settings
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 px-4 py-6 lg:px-6">{children}</main>
    </div>
  )
}
