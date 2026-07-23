"use client"

import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { AnimatePresence, motion } from "framer-motion"
import { Search, Loader2, Check, Play, Bookmark, X, Star } from "lucide-react"
import type { Game, GamesResponse, GameStatus, StatusMap } from "@/lib/types"

const fetcher = async (url: string): Promise<GamesResponse> => {
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? "Search failed")
  return data
}

const ADD_BUTTONS: { value: GameStatus; label: string; icon: typeof Check }[] = [
  { value: "played", label: "Played", icon: Check },
  { value: "playing", label: "Playing", icon: Play },
  { value: "not_played", label: "Not played", icon: Bookmark },
]

export function GameSearch({
  statusMap,
  onSet,
  onClear,
}: {
  statusMap: StatusMap
  onSet: (game: Game, status: GameStatus) => void
  onClear: (gameId: number) => void
}) {
  const [term, setTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), 220)
    return () => clearTimeout(id)
  }, [term])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const { data, error, isLoading } = useSWR<GamesResponse>(
    debounced ? `/api/games?search=${encodeURIComponent(debounced)}` : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  )

  const results = data?.results ?? []
  const showPanel = open && debounced.length > 0

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search for a game to add..."
          aria-label="Search for a game"
          className="w-full rounded-2xl border border-white/10 bg-card/60 py-3.5 pl-12 pr-11 text-base text-foreground shadow-lg outline-none backdrop-blur-xl transition-colors placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
        />
        {isLoading ? (
          <Loader2 className="absolute right-4 top-1/2 size-5 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : term ? (
          <button
            type="button"
            onClick={() => {
              setTerm("")
              setDebounced("")
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {showPanel ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute z-50 mt-2 max-h-[26rem] w-full overflow-y-auto rounded-2xl border border-white/10 bg-popover/80 p-2 shadow-2xl backdrop-blur-2xl"
          >
            {error ? (
              <p className="px-3 py-6 text-center text-sm text-destructive">{error.message}</p>
            ) : results.length === 0 && !isLoading ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No games found for &ldquo;{debounced}&rdquo;
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {results.map((game, i) => {
                  const current = statusMap[game.id]
                  const year = game.released ? new Date(game.released).getFullYear() : null
                  return (
                    <motion.li
                      key={game.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.25) }}
                      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/5"
                    >
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {game.background_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={game.background_image || "/placeholder.svg"}
                            alt=""
                            crossOrigin="anonymous"
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{game.name}</p>
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Star className="size-3 fill-primary text-primary" />
                            {game.rating ? game.rating.toFixed(1) : "—"}
                          </span>
                          {year ? <span>{year}</span> : null}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        {ADD_BUTTONS.map(({ value, label, icon: Icon }) => {
                          const active = current === value
                          return (
                            <button
                              key={value}
                              type="button"
                              title={label}
                              aria-label={active ? `Remove ${label}` : `Mark as ${label}`}
                              aria-pressed={active}
                              onClick={() => (active ? onClear(game.id) : onSet(game, value))}
                              className={`inline-flex size-8 items-center justify-center rounded-lg border transition-colors ${
                                active
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-white/10 bg-secondary text-muted-foreground hover:border-primary/50 hover:text-foreground"
                              }`}
                            >
                              <Icon className="size-4" />
                            </button>
                          )
                        })}
                      </div>
                    </motion.li>
                  )
                })}
              </ul>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
