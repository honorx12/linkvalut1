export type DeviceType = "mobile" | "tablet" | "desktop" | null

export function parseDevice(userAgent: string | null): DeviceType {
  if (!userAgent) return null

  const ua = userAgent.toLowerCase()

  if (/android.+mobile|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    return "mobile"
  }

  if (/ipad|android(?!.*mobile)|tablet|kindle/i.test(ua)) {
    return "tablet"
  }

  if (/mobi/i.test(ua)) {
    return "mobile"
  }

  return "desktop"
}
