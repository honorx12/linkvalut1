import { db } from "@/lib/db"
import * as argon2 from "argon2"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const data = schema.parse(json)

    const existing = await db.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
    })

    await db.user.create({
      data: {
        email: data.email,
        passwordHash,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
