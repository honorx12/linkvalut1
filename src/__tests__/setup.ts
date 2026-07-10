/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from "vitest"

const testUser = {
  id: "test-user-id",
  email: "test@example.com",
}

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve({ user: testUser })),
}))

let linkIdCounter = 0
let clickIdCounter = 0
const linksStore: Record<string, any> = {}
const clicksStore: Record<string, any> = {}

vi.mock("@/lib/db", () => ({
  db: {
    link: {
      findUnique: vi.fn(({ where }: { where: { id?: string; slug?: string } }) => {
        const link = Object.values(linksStore).find(
          (l: any) =>
            !l.deletedAt &&
            (where.id ? l.id === where.id : l.slug === where.slug)
        )
        return Promise.resolve(link ?? null)
      }),
      findFirst: vi.fn(({ where }: { where: Record<string, unknown> }) => {
        let results = Object.values(linksStore) as any[]
        for (const [key, value] of Object.entries(where ?? {})) {
          if (key === "deletedAt") {
            results = value === null
              ? results.filter((l) => !l.deletedAt)
              : results.filter((l) => l.deletedAt)
          } else if (key === "userId") {
            results = results.filter((l) => l.userId === value)
          } else {
            results = results.filter((l) => l[key] === value)
          }
        }
        return Promise.resolve(results[0] ?? null)
      }),
      findMany: vi.fn(({ where, orderBy, take, skip, cursor, include }: any) => {
        let results = Object.values(linksStore).filter((l: any) => {
          if (l.deletedAt) return false
          if (where?.userId && l.userId !== where.userId) return false
          if (where?.OR) {
            const slugMatch = where.OR[0]?.slug?.contains
              ? l.slug.includes(where.OR[0].slug.contains)
              : true
            const urlMatch = where.OR[1]?.destinationUrl?.contains
              ? l.destinationUrl.includes(where.OR[1].destinationUrl.contains)
              : true
            if (!slugMatch && !urlMatch) return false
          }
          return true
        }) as any[]

        if (orderBy?.createdAt === "desc") {
          results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        } else if (orderBy?.clicks?._count === "desc") {
          results.sort((a, b) => (b._clickCount || 0) - (a._clickCount || 0))
        }

        if (cursor) {
          const cursorIndex = results.findIndex((l) => l.id === cursor.id)
          if (cursorIndex !== -1) {
            results = results.slice(cursorIndex + 1)
          }
        }

        if (take) {
          results = results.slice(0, take)
        }
        if (skip) {
          results = results.slice(skip)
        }

        if (include?._count) {
          results = results.map((l) => ({
            ...l,
            _count: { clicks: l._clickCount || 0 },
          }))
        }

        return Promise.resolve(results)
      }),
      create: vi.fn(({ data }: { data: any }) => {
        linkIdCounter++
        const link = {
          id: `link-${linkIdCounter}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }
        linksStore[link.id] = link
        return Promise.resolve(link)
      }),
      update: vi.fn(({ where, data }: { where: { id: string }; data: any }) => {
        const link = linksStore[where.id]
        if (!link) return Promise.resolve(null)
        Object.assign(link, data, { updatedAt: new Date() })
        return Promise.resolve(link)
      }),
      count: vi.fn(({ where }: { where: any }) => {
        const results = Object.values(linksStore).filter((l: any) => {
          if (l.deletedAt) return false
          if (where?.userId && l.userId !== where.userId) return false
          return true
        })
        return Promise.resolve(results.length)
      }),
    },
    click: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: vi.fn(() => Promise.resolve([])),
      create: vi.fn(({ data }: { data: any }) => {
        clickIdCounter++
        return Promise.resolve({ id: `click-${clickIdCounter}`, ...data, createdAt: new Date() })
      }),
    },
    user: {
      findUnique: vi.fn(({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id === testUser.id || where.email === testUser.email) {
          return Promise.resolve(testUser)
        }
        return Promise.resolve(null)
      }),
    },
    $reset: () => {
      Object.keys(linksStore).forEach((k) => delete linksStore[k])
      Object.keys(clicksStore).forEach((k) => delete clicksStore[k])
    },
  },
}))

beforeEach(() => {
  linkIdCounter = 0
  clickIdCounter = 0
  Object.keys(linksStore).forEach((k) => delete linksStore[k])
  Object.keys(clicksStore).forEach((k) => delete clicksStore[k])
})
