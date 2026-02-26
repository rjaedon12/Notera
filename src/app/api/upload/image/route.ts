import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const MAX_SIZE = 3 * 1024 * 1024 // 3 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, GIF, and WebP images are allowed" },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Image must be under 3 MB" },
      { status: 400 }
    )
  }

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString("base64")
  const dataUrl = `data:${file.type};base64,${base64}`

  return NextResponse.json({ url: dataUrl })
}
