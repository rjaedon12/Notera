import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// POST /api/auth/register — create user with hashed password
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    if (typeof password !== "string" || password.length < 6) {
      return Response.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    return Response.json(user, { status: 201 })
  } catch (error) {
    console.error("Register error:", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
