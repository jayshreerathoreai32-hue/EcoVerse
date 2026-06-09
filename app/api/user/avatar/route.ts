import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"

export async function PUT(req: Request) {
  try {
    await dbConnect()

    const email = req.headers.get("x-user-email")
    const { avatarId } = await req.json()

    if (!email || !avatarId) {
      return NextResponse.json({ error: !email ? "Unauthorized" : "Missing avatarId" }, { status: !email ? 401 : 400 })
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { avatarId } },
      { new: true }
    )

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("User from DB:", updatedUser?.avatarId)

    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error"
    console.error("🔥 Avatar update error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
