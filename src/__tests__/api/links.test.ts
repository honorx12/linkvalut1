import { describe, it, expect, vi, beforeEach } from "vitest"
import { createRequest } from "../helpers"

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))


beforeEach(() => {
  vi.clearAllMocks()
})

describe("POST /api/links", () => {
  it("creates a link with valid data", async () => {
    const { POST } = await import("@/app/api/links/route")
    const req = createRequest("/api/links", {
      method: "POST",
      body: JSON.stringify({
        slug: "my-link",
        destinationUrl: "https://example.com",
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.slug).toBe("my-link")
    expect(body.destinationUrl).toBe("https://example.com")
  })

  it("rejects missing slug", async () => {
    const { POST } = await import("@/app/api/links/route")
    const req = createRequest("/api/links", {
      method: "POST",
      body: JSON.stringify({ destinationUrl: "https://example.com" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("rejects invalid URL", async () => {
    const { POST } = await import("@/app/api/links/route")
    const req = createRequest("/api/links", {
      method: "POST",
      body: JSON.stringify({ slug: "my-link", destinationUrl: "not-a-url" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("rejects duplicate slug", async () => {
    const { POST } = await import("@/app/api/links/route")
    const req1 = createRequest("/api/links", {
      method: "POST",
      body: JSON.stringify({
        slug: "my-link",
        destinationUrl: "https://example.com",
      }),
    })
    await POST(req1)

    const req2 = createRequest("/api/links", {
      method: "POST",
      body: JSON.stringify({
        slug: "my-link",
        destinationUrl: "https://other.com",
      }),
    })
    const res2 = await POST(req2)
    expect(res2.status).toBe(409)
  })
})

describe("GET /api/links", () => {
  it("returns a list of links for the authenticated user", async () => {
    const { POST, GET } = await import("@/app/api/links/route")

    await POST(
      createRequest("/api/links", {
        method: "POST",
        body: JSON.stringify({
          slug: "link-1",
          destinationUrl: "https://example.com/1",
        }),
      })
    )
    await POST(
      createRequest("/api/links", {
        method: "POST",
        body: JSON.stringify({
          slug: "link-2",
          destinationUrl: "https://example.com/2",
        }),
      })
    )

    const res = await GET(createRequest("/api/links"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.links).toHaveLength(2)
  })

  it("returns empty list when no links exist", async () => {
    const { GET } = await import("@/app/api/links/route")
    const res = await GET(createRequest("/api/links"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.links).toEqual([])
  })

  it("searches by slug", async () => {
    const { POST, GET } = await import("@/app/api/links/route")

    await POST(
      createRequest("/api/links", {
        method: "POST",
        body: JSON.stringify({
          slug: "alpha",
          destinationUrl: "https://example.com/alpha",
        }),
      })
    )
    await POST(
      createRequest("/api/links", {
        method: "POST",
        body: JSON.stringify({
          slug: "beta",
          destinationUrl: "https://example.com/beta",
        }),
      })
    )

    const res = await GET(createRequest("/api/links?search=alpha"))
    const body = await res.json()
    expect(body.links).toHaveLength(1)
    expect(body.links[0].slug).toBe("alpha")
  })

  it("supports cursor pagination", async () => {
    const { POST, GET } = await import("@/app/api/links/route")

    for (let i = 0; i < 5; i++) {
      await POST(
        createRequest("/api/links", {
          method: "POST",
          body: JSON.stringify({
            slug: "link-" + i,
            destinationUrl: "https://example.com/" + i,
          }),
        })
      )
    }

    const res = await GET(createRequest("/api/links?take=2"))
    const body = await res.json()
    expect(body.links).toHaveLength(2)
    expect(body.nextCursor).toBeDefined()
  })
})

describe("PATCH /api/links/:id", () => {
  it("updates a link's destination URL", async () => {
    const { POST } = await import("@/app/api/links/route")
    const { PATCH } = await import("@/app/api/links/[id]/route")

    const createRes = await POST(
      createRequest("/api/links", {
        method: "POST",
        body: JSON.stringify({
          slug: "my-link",
          destinationUrl: "https://example.com",
        }),
      })
    )
    const link = await createRes.json()

    const res = await PATCH(
      createRequest("/api/links/" + link.id, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Title" }),
      }),
      { params: Promise.resolve({ id: link.id }) }
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe("Updated Title")
  })

  it("returns 404 for non-existent link", async () => {
    const { PATCH } = await import("@/app/api/links/[id]/route")
    const res = await PATCH(
      createRequest("/api/links/nonexistent", {
        method: "PATCH",
        body: JSON.stringify({ title: "Test" }),
      }),
      { params: Promise.resolve({ id: "nonexistent" }) }
    )
    expect(res.status).toBe(404)
  })
})

describe("DELETE /api/links/:id", () => {
  it("soft-deletes a link", async () => {
    const { POST } = await import("@/app/api/links/route")
    const { DELETE, GET } = await import("@/app/api/links/[id]/route")

    const createRes = await POST(
      createRequest("/api/links", {
        method: "POST",
        body: JSON.stringify({
          slug: "my-link",
          destinationUrl: "https://example.com",
        }),
      })
    )
    const link = await createRes.json()

    const deleteRes = await DELETE(
      createRequest("/api/links/" + link.id, { method: "DELETE" }),
      { params: Promise.resolve({ id: link.id }) }
    )
    expect(deleteRes.status).toBe(200)

    const getRes = await GET(
      createRequest("/api/links/" + link.id),
      { params: Promise.resolve({ id: link.id }) }
    )
    expect(getRes.status).toBe(404)
  })

  it("returns 404 for non-existent link", async () => {
    const { DELETE } = await import("@/app/api/links/[id]/route")
    const res = await DELETE(
      createRequest("/api/links/nonexistent", { method: "DELETE" }),
      { params: Promise.resolve({ id: "nonexistent" }) }
    )
    expect(res.status).toBe(404)
  })
})

describe("GET /:slug (redirect)", () => {
  it("redirects to the destination URL with 302", async () => {
    const { POST } = await import("@/app/api/links/route")
    const { GET } = await import("@/app/[slug]/route")

    await POST(
      createRequest("/api/links", {
        method: "POST",
        body: JSON.stringify({
          slug: "test-slug",
          destinationUrl: "https://example.com/page",
        }),
      })
    )

    const res = await GET(
      createRequest("/test-slug"),
      { params: Promise.resolve({ slug: "test-slug" }) }
    )
    expect(res.status).toBe(302)
    expect(res.headers.get("location")).toBe("https://example.com/page")
  })

  it("returns 404 for unknown slug", async () => {
    const { GET } = await import("@/app/[slug]/route")

    await expect(
      GET(
        createRequest("/unknown"),
        { params: Promise.resolve({ slug: "unknown" }) }
      )
    ).rejects.toThrow("NEXT_NOT_FOUND")
  })

  it("logs a click on redirect", async () => {
    const db = await import("@/lib/db")
    const { POST } = await import("@/app/api/links/route")
    const { GET } = await import("@/app/[slug]/route")

    const createRes = await POST(
      createRequest("/api/links", {
        method: "POST",
        body: JSON.stringify({
          slug: "click-test",
          destinationUrl: "https://example.com",
        }),
      })
    )
    const link = await createRes.json()

    await GET(
      new Request("http://localhost:3000/click-test", {
        headers: {
          "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)",
          referer: "https://twitter.com",
        },
      }),
      { params: Promise.resolve({ slug: "click-test" }) }
    )

    expect(db.db.click.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        linkId: link.id,
        device: "mobile",
      }),
    })
  })
})
