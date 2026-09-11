"use client"

import useSWR from "swr"
import type { Game, GameStatus, StatusMap, StatusResponse } from "@/lib/types"

const fetcher = async (url: string): Promise<StatusResponse> => {
  const res = await fetch(url); const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? "Failed to load statuses")
  return data
}

export function useStatuses() {
  const { data, mutate, isLoading } = useSWR<StatusResponse>("/api/status", fetcher, { revalidateOnFocus: false })
  const rows = data?.statuses ?? []
  const statusMap: StatusMap = Object.fromEntries(rows.map((row) => [row.game_id, row.status]))
  const gamesByStatus = (status: GameStatus): Game[] => rows.filter((row) => row.status === status).map((row) => row.game)
  const allGames = rows.map((row) => row.game)

  async function save(body: Record<string, unknown>) {
    const response = await fetch("/api/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (!response.ok) { const error = await response.json(); throw new Error(error.error ?? "Could not save change") }
    await mutate()
  }
  async function setStatus(game: Game, status: GameStatus) {
    const previous = data
    const current = rows.filter((row) => row.game_id !== game.id)
    await mutate({ statuses: [{ game_id: game.id, status, game }, ...current] }, { revalidate: false })
    try { await save({ status, game }) } catch (error) { await mutate(previous, { revalidate: false }); throw error }
  }
  async function clearStatus(gameId: number) {
    const previous = data
    await mutate({ statuses: rows.filter((row) => row.game_id !== gameId) }, { revalidate: false })
    try { const response = await fetch(`/api/status?gameId=${gameId}`, { method: "DELETE" }); if (!response.ok) throw new Error("Could not remove game"); await mutate() } catch (error) { await mutate(previous, { revalidate: false }); throw error }
  }
  async function setTagExcluded(game: Game, tag: "horror" | "other", excluded: boolean) {
    const updated = {
      ...game,
      horrorTagged: tag === "horror" ? !excluded : false,
      otherTagged: tag === "other" ? !excluded : false,
      horrorExcluded: undefined,
      otherExcluded: undefined,
    }
    const previous = data
    await mutate({ statuses: rows.map((row) => row.game_id === game.id ? { ...row, game: updated } : row) }, { revalidate: false })
    try { await save({ game: updated, status: rows.find((row) => row.game_id === game.id)?.status ?? "not_played" }) } catch (error) { await mutate(previous, { revalidate: false }); throw error }
  }
  return { statusMap, gamesByStatus, allGames, setStatus, clearStatus, setTagExcluded, isLoading, count: rows.length }
}
