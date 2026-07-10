import { db } from "@/lib/db"
import { parseDevice } from "@/lib/device"

export async function logClick(
  linkId: string,
  req: Request
): Promise<void> {
  try {
    const userAgent = req.headers.get("user-agent") ?? undefined
    const referrer = req.headers.get("referer") ?? undefined
    const country =
      req.headers.get("x-vercel-ip-country") ??
      req.headers.get("cf-ipcountry") ??
      undefined
    const device = parseDevice(userAgent ?? null) ?? undefined

    await db.click.create({
      data: {
        linkId,
        country,
        device,
        referrer,
        userAgent,
      },
    })
  } catch (error) {
    console.error("Failed to log click:", error)
  }
}
