export function createRequest(url: string, options?: RequestInit): Request {
  return new Request(`http://localhost:3000${url}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  })
}
