"use client"

import useSWR from "swr"
import type { Game, GameStatus, StatusMap, StatusResponse } from "@/lib/types"

const fetcher = async (url: string): Promise<StatusResponse> => {
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? "Failed to load statuses")
  return data
}

export function useStatuses() {
  const { data, mutate, isLoading } = useSWR<StatusResponse>("/api/status", fetcher, {
    revalidateOnFocus: false,
  })

  const rows = data?.statuses ?? []

  const statusMap: StatusMap = {}
  for (const row of rows) statusMap[row.game_id] = row.status

  const gamesByStatus = (status: GameStatus): Game[] =>
    rows.filter((r) => r.status === status).map((r) => r.game)

  const allGames: Game[] = rows.map((r) => r.game)

  async function setStatus(game: Game, status: GameStatus) {
    // optimistic update
    const current = data?.statuses ?? []
    const others = current.filter((r) => r.game_id !== game.id)
    const optimistic = [{ game_id: game.id, status, game }, ...others]
    mutate({ statuses: optimistic }, { revalidate: false })

    await fetch("/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, game }),
    })
    mutate()
  }

  async function clearStatus(gameId: number) {
    const current = data?.statuses ?? []
    mutate({ statuses: current.filter((r) => r.game_id !== gameId) }, { revalidate: false })

    await fetch(`/api/status?gameId=${gameId}`, { method: "DELETE" })
    mutate()
  }

  return { statusMap, gamesByStatus, allGames, setStatus, clearStatus, isLoading, count: rows.length }
}
