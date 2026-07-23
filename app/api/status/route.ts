import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import type { Game, GameStatus } from "@/lib/types"

const VALID: GameStatus[] = ["played", "playing", "not_played"]

export async function GET() {
  try {
    const rows = await sql`
      SELECT game_id, status, game
      FROM game_status
      ORDER BY updated_at DESC
    `
    return NextResponse.json({ statuses: rows })
  } catch (err) {
    console.log("[v0] GET /api/status error:", err)
    return NextResponse.json({ error: "Failed to load statuses." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { status: GameStatus; game: Game }
    const { status, game } = body

    if (!VALID.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 })
    }
    if (!game || typeof game.id !== "number") {
      return NextResponse.json({ error: "Invalid game payload." }, { status: 400 })
    }

    await sql`
      INSERT INTO game_status (game_id, status, game, updated_at)
      VALUES (${game.id}, ${status}, ${JSON.stringify(game)}, now())
      ON CONFLICT (game_id)
      DO UPDATE SET status = EXCLUDED.status, game = EXCLUDED.game, updated_at = now()
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.log("[v0] POST /api/status error:", err)
    return NextResponse.json({ error: "Failed to save status." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = Number(searchParams.get("gameId"))
    if (!gameId) {
      return NextResponse.json({ error: "Missing gameId." }, { status: 400 })
    }
    await sql`DELETE FROM game_status WHERE game_id = ${gameId}`
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.log("[v0] DELETE /api/status error:", err)
    return NextResponse.json({ error: "Failed to remove status." }, { status: 500 })
  }
}
