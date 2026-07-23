export interface Game {
  id: number
  slug: string
  name: string
  released: string | null
  background_image: string | null
  metacritic: number | null
  rating: number
  ratings_count: number
  genres: { id: number; name: string; slug: string }[]
  tags?: { id: number; name: string; slug: string }[]
  parent_platforms?: { platform: { id: number; name: string; slug: string } }[]
}

/** Detects whether a game belongs to the horror category via genres or tags. */
export function isHorror(game: Game): boolean {
  const haystack = [...(game.genres ?? []), ...(game.tags ?? [])]
  return haystack.some((t) => {
    const s = `${t.slug ?? ""} ${t.name ?? ""}`.toLowerCase()
    return s.includes("horror") || s.includes("survival-horror") || s.includes("survival horror")
  })
}

export interface GamesResponse {
  results: Game[]
  count: number
  next: string | null
  error?: string
}

export type GameStatus = "played" | "playing" | "not_played"

export interface StatusMap {
  [gameId: number]: GameStatus
}

export interface StatusResponse {
  statuses: { game_id: number; status: GameStatus; game: Game }[]
  error?: string
}

export interface GenreOption {
  slug: string
  name: string
}

export const GENRES: GenreOption[] = [
  { slug: "action", name: "Action" },
  { slug: "role-playing-games-rpg", name: "RPG" },
  { slug: "shooter", name: "Shooter" },
  { slug: "adventure", name: "Adventure" },
  { slug: "strategy", name: "Strategy" },
  { slug: "indie", name: "Indie" },
  { slug: "racing", name: "Racing" },
  { slug: "sports", name: "Sports" },
  { slug: "puzzle", name: "Puzzle" },
  { slug: "fighting", name: "Fighting" },
]

export const SORT_OPTIONS = [
  { value: "-metacritic", label: "Top rated" },
  { value: "-released", label: "Newest" },
  { value: "released", label: "Oldest" },
  { value: "name", label: "A–Z" },
  { value: "-added", label: "Most popular" },
]
