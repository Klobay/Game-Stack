"use client"

import { motion } from "framer-motion"
import { Star, Calendar, Check, Play, Bookmark, X, Ghost, Tags } from "lucide-react"
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
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {STATUS_BUTTONS.map(({ value, label, icon: Icon }, index) => {
          const active = current === value
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => (active ? onClear(game.id) : onSet(game, value))}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-[background-color,border-color,color,transform] active:scale-[0.98] sm:min-h-9 sm:rounded-lg sm:py-1.5 sm:text-xs ${
                index === 2 ? "col-span-2 sm:col-span-1" : ""
              } ${
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-secondary/70 text-secondary-foreground hover:border-primary/50 hover:bg-secondary"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          )
        })}
      </div>
      {current ? (
        <button
          type="button"
          onClick={() => onClear(game.id)}
          aria-label={`Remove ${game.name} from this list`}
          className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3.5" />
          Remove from list
        </button>
      ) : null}
    </div>
  )
}

function TagControls({ game, onToggle }: { game: Game; onToggle: (game: Game, tag: "horror" | "other", enabled: boolean) => void }) {
  const tags = [
    {
      key: "horror" as const,
      label: "Horror",
      icon: Ghost,
      active: game.horrorTagged ?? (!game.horrorExcluded && game.genres.concat(game.tags ?? []).some((tag) => `${tag.slug} ${tag.name}`.toLowerCase().includes("horror"))),
    },
    {
      key: "other" as const,
      label: "Other Games",
      icon: Tags,
      active: game.otherTagged ?? !game.otherExcluded,
    },
  ]

  return (
    <div className="flex flex-col gap-2" aria-label="Game tags">
      <div className="grid grid-cols-2 gap-2">
        {tags.map(({ key, label, icon: Icon, active }) => (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            aria-label={`${active ? "Remove from" : "Add to"} ${label} for ${game.name}`}
            onClick={() => onToggle(game, key, !active)}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-medium transition-[background-color,border-color,color,transform] active:scale-[0.98] sm:min-h-9 sm:rounded-lg ${
              active
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-secondary/70 text-muted-foreground hover:border-primary/50 hover:bg-secondary"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            <span>{active ? `In ${label}` : `Add to ${label}`}</span>
          </button>
        ))}
      </div>
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
  onTagToggle,
}: {
  game: Game
  index: number
  view: "grid" | "list"
  status?: GameStatus
  onSet: (game: Game, status: GameStatus) => void
  onClear: (gameId: number) => void
  onTagToggle: (game: Game, tag: "horror" | "other", enabled: boolean) => void
}) {
  const year = game.released ? new Date(game.released).getFullYear() : null

  if (view === "list") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: Math.min(index * 0.012, 0.12), ease: "easeOut" }}
        className="flex flex-row gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-sm sm:gap-4"
      >
        <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg bg-muted sm:aspect-[16/10] sm:w-48">
          {game.background_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={game.background_image || "/placeholder.svg"}
              alt={`${game.name} cover art`}
              crossOrigin="anonymous"
              loading="lazy"
              decoding="async"
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
            <TagControls game={game} onToggle={onTagToggle} />
          </div>
        </div>
      </motion.article>
    )
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index * 0.015, 0.15), ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
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
          <TagControls game={game} onToggle={onTagToggle} />
        </div>
      </div>
    </motion.article>
  )
}
