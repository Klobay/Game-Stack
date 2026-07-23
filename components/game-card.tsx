"use client"

import { motion } from "framer-motion"
import { Star, Calendar, Check, Play, Bookmark, X } from "lucide-react"
import type { Game, GameStatus } from "@/lib/types"

const platformIcon: Record<string, string> = {
  pc: "PC",
  playstation: "PS",
  xbox: "Xbox",
  nintendo: "NSW",
  mac: "Mac",
  linux: "Linux",
  ios: "iOS",
  android: "And",
}

function metacriticColor(score: number) {
  if (score >= 80) return "text-primary border-primary/40 bg-primary/10"
  if (score >= 60) return "text-accent border-accent/40 bg-accent/10"
  return "text-muted-foreground border-border bg-muted"
}

const STATUS_BUTTONS: { value: GameStatus; label: string; icon: typeof Check }[] = [
  { value: "played", label: "Played", icon: Check },
  { value: "playing", label: "Playing", icon: Play },
  { value: "not_played", label: "Not played", icon: Bookmark },
]

function StatusControls({
  game,
  current,
  onSet = () => {},
  onClear = () => {},
}: {
  game: Game
  current?: GameStatus
  onSet?: (game: Game, status: GameStatus) => void
  onClear?: (gameId: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {STATUS_BUTTONS.map(({ value, label, icon: Icon }) => {
        const active = current === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => (active ? onClear(game.id) : onSet(game, value))}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-secondary-foreground hover:border-primary/50"
            }`}
          >
            <Icon className="size-3" />
            {label}
          </button>
        )
      })}
      {current ? (
        <button
          type="button"
          onClick={() => onClear(game.id)}
          aria-label="Remove from list"
          className="inline-flex items-center rounded-md border border-border bg-secondary p-1 text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  )
}

export function GameCard({
  game,
  index,
  view,
  status,
  onSet,
  onClear,
}: {
  game: Game
  index: number
  view: "grid" | "list"
  status?: GameStatus
  onSet: (game: Game, status: GameStatus) => void
  onClear: (gameId: number) => void
}) {
  const year = game.released ? new Date(game.released).getFullYear() : null

  if (view === "list") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3), ease: "easeOut" }}
        className="flex gap-4 overflow-hidden rounded-xl border border-border bg-card p-3"
      >
        <div className="relative aspect-[16/10] w-40 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-48">
          {game.background_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={game.background_image || "/placeholder.svg"}
              alt={`${game.name} cover art`}
              crossOrigin="anonymous"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-lg font-semibold leading-tight text-balance text-card-foreground">
              {game.name}
            </h3>
            {game.metacritic ? (
              <span
                className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-sm font-semibold ${metacriticColor(
                  game.metacritic,
                )}`}
              >
                {game.metacritic}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-4 fill-primary text-primary" />
              {game.rating ? game.rating.toFixed(1) : "—"}
            </span>
            {year ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4" />
                {year}
              </span>
            ) : null}
            {game.genres.length > 0 ? (
              <span className="truncate text-xs">
                {game.genres.slice(0, 3).map((g) => g.name).join(" • ")}
              </span>
            ) : null}
          </div>

          <div className="mt-auto pt-1">
            <StatusControls game={game} current={status} onSet={onSet} onClear={onClear} />
          </div>
        </div>
      </motion.article>
    )
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.4), ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {game.background_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.background_image || "/placeholder.svg"}
            alt={`${game.name} cover art`}
            crossOrigin="anonymous"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        {game.metacritic ? (
          <span
            className={`absolute right-3 top-3 rounded-md border px-2 py-0.5 font-mono text-sm font-semibold ${metacriticColor(
              game.metacritic,
            )}`}
          >
            {game.metacritic}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {(game.parent_platforms ?? []).slice(0, 4).map(({ platform }) => (
            <span
              key={platform.id}
              className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {platformIcon[platform.slug] ?? platform.name}
            </span>
          ))}
        </div>

        <h3 className="font-display text-lg font-semibold leading-tight text-balance text-card-foreground">
          {game.name}
        </h3>

        <div className="flex items-center justify-between pt-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Star className="size-4 fill-primary text-primary" />
            {game.rating ? game.rating.toFixed(1) : "—"}
          </span>
          {year ? (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4" />
              {year}
            </span>
          ) : null}
        </div>

        {game.genres.length > 0 ? (
          <p className="truncate text-xs text-muted-foreground/80">
            {game.genres.slice(0, 3).map((g) => g.name).join(" • ")}
          </p>
        ) : null}

        <div className="mt-auto border-t border-border pt-3">
          <StatusControls game={game} current={status} onSet={onSet} onClear={onClear} />
        </div>
      </div>
    </motion.article>
  )
}
