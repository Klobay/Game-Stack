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
  horrorExcluded?: boolean
  otherExcluded?: boolean
  horrorTagged?: boolean
  otherTagged?: boolean
  isManual?: boolean
}

function hasHorrorMetadata(game: Game): boolean {
  return [...(game.genres ?? []), ...(game.tags ?? [])].some((t) => {
    const value = `${t.slug ?? ""} ${t.name ?? ""}`.toLowerCase()
    return value.includes("horror") || value.includes("survival-horror") || value.includes("survival horror")
  })
}

export function isHorror(game: Game): boolean {
  if (game.horrorTagged !== undefined) return game.horrorTagged
  if (game.horrorExcluded) return false
  return hasHorrorMetadata(game)
}

export function isOther(game: Game): boolean {
  if (game.otherTagged !== undefined) return game.otherTagged
  if (game.otherExcluded) return false
  return !isHorror(game)
}

export interface GamesResponse { results: Game[]; count: number; next: string | null; error?: string }
export type GameStatus = "played" | "playing" | "not_played"
export interface StatusMap { [gameId: number]: GameStatus }
export interface StatusResponse { statuses: { game_id: number; status: GameStatus; game: Game }[]; error?: string }
export interface GenreOption { slug: string; name: string }
export const GENRES: GenreOption[] = [
  { slug: "action", name: "Action" }, { slug: "role-playing-games-rpg", name: "RPG" }, { slug: "shooter", name: "Shooter" },
  { slug: "adventure", name: "Adventure" }, { slug: "strategy", name: "Strategy" }, { slug: "indie", name: "Indie" },
  { slug: "racing", name: "Racing" }, { slug: "sports", name: "Sports" }, { slug: "puzzle", name: "Puzzle" }, { slug: "fighting", name: "Fighting" },
]
export const SORT_OPTIONS = [
  { value: "-metacritic", label: "Top rated" }, { value: "-released", label: "Newest" }, { value: "released", label: "Oldest" },
  { value: "name", label: "A–Z" }, { value: "-added", label: "Most popular" },
]

export function createManualGame(name: string, image: string, tags: string[]): Game {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0
  const id = hash === 0 ? -1 : -Math.abs(hash)
  return {
    id, slug: name.toLowerCase().trim().replace(/\s+/g, "-"), name: name.trim(), released: null,
    background_image: image.trim() || null, metacritic: null, rating: 0, ratings_count: 0, genres: [],
    tags: tags.map((tag, index) => ({ id: id - index - 1, name: tag, slug: tag.toLowerCase().trim().replace(/\s+/g, "-") })),
    parent_platforms: [], isManual: true,
  }
}

export const STATUS_LABELS: Record<GameStatus, string> = { played: "Played", playing: "Playing", not_played: "Not played" }
export const VALID_GAME_STATUSES: GameStatus[] = ["played", "playing", "not_played"]
