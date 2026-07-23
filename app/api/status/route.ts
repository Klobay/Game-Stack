import { type NextRequest, NextResponse } from "next/server"
import { and, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { gameStatus } from "@/lib/db/schema"
import type { Game, GameStatus } from "@/lib/types"

const VALID: GameStatus[] = ["played", "playing", "not_played"]

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  return session.user.id
}

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rows = await db
      .select()
      .from(gameStatus)
      .where(eq(gameStatus.userId, userId))
      .orderBy(desc(gameStatus.updatedAt))

    const statuses = rows.map((r) => ({
      game_id: r.gameId,
      status: r.status as GameStatus,
      game: r.gameData as Game,
    }))

    return NextResponse.json({ statuses })
  } catch (err) {
    console.log("[v0] GET /api/status error:", err)
    return NextResponse.json({ error: "Failed to load statuses." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = (await request.json()) as { status: GameStatus; game: Game }
    const { status, game } = body

    if (!VALID.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 })
    }
    if (!game || typeof game.id !== "number") {
      return NextResponse.json({ error: "Invalid game payload." }, { status: 400 })
    }

    await db
      .insert(gameStatus)
      .values({ userId, gameId: game.id, status, gameData: game })
      .onConflictDoUpdate({
        target: [gameStatus.userId, gameStatus.gameId],
        set: { status, gameData: game, updatedAt: new Date() },
      })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.log("[v0] POST /api/status error:", err)
    return NextResponse.json({ error: "Failed to save status." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const gameId = Number(searchParams.get("gameId"))
    if (!gameId) {
      return NextResponse.json({ error: "Missing gameId." }, { status: 400 })
    }

    await db
      .delete(gameStatus)
      .where(and(eq(gameStatus.userId, userId), eq(gameStatus.gameId, gameId)))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.log("[v0] DELETE /api/status error:", err)
    return NextResponse.json({ error: "Failed to remove status." }, { status: 500 })
  }
}
