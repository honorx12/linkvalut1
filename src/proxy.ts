import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL("/login", req.nextUrl)
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/api/links/:path*"],
}
