"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Gamepad2, LayoutGrid, List, Ghost, LogOut } from "lucide-react"
import { GameCard } from "@/components/game-card"
import { GameSearch } from "@/components/game-search"
import { useStatuses } from "@/lib/use-status"
import { authClient } from "@/lib/auth-client"
import { isHorror, type GameStatus } from "@/lib/types"

type ListId = GameStatus | "horror"

const LISTS: { id: ListId; label: string }[] = [
  { id: "playing", label: "Currently Playing" },
  { id: "played", label: "Played" },
  { id: "not_played", label: "Not Played" },
  { id: "horror", label: "Horror Games" },
]

export function GameLibrary({ userName }: { userName?: string }) {
  const router = useRouter()
  const [activeList, setActiveList] = useState<ListId>("playing")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [signingOut, setSigningOut] = useState(false)
  const { statusMap, gamesByStatus, allGames, setStatus, clearStatus, count } = useStatuses()

  async function handleSignOut() {
    setSigningOut(true)
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  const horrorGames = allGames.filter(isHorror)

  const games = activeList === "horror" ? horrorGames : gamesByStatus(activeList)

  const counts: Record<ListId, number> = {
    playing: gamesByStatus("playing").length,
    played: gamesByStatus("played").length,
    not_played: gamesByStatus("not_played").length,
    horror: horrorGames.length,
  }

  const gridClass =
    view === "grid"
      ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "flex flex-col gap-4"

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Blurry ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-40 size-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-96 rounded-full bg-chart-3/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-8 py-10 sm:py-14">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <Gamepad2 className="size-6" />
              </span>
              <span className="font-display text-xl font-bold tracking-tight">Game Stack</span>
            </div>

            <div className="flex items-center gap-3">
              {userName ? (
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  Hi, <span className="font-medium text-foreground">{userName}</span>
                </span>
              ) : null}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card/50 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur-md transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-60"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <h1 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Search a game. Add it to your stack.
            </h1>
            <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
              Nothing shows up until you search for it and add it. You have{" "}
              <span className="font-medium text-foreground">{count}</span>{" "}
              {count === 1 ? "game" : "games"} in your stack.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            <GameSearch statusMap={statusMap} onSet={setStatus} onClear={clearStatus} />
          </motion.div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div role="tablist" aria-label="Your lists" className="flex flex-wrap items-center gap-2">
              {LISTS.map((list) => {
                const selected = activeList === list.id
                return (
                  <button
                    key={list.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveList(list.id)}
                    className={`relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-md transition-colors ${
                      selected
                        ? "border-primary/60 text-primary-foreground"
                        : "border-white/10 bg-card/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {selected ? (
                      <motion.span
                        layoutId="active-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    ) : null}
                    {list.id === "horror" ? <Ghost className="size-4" /> : null}
                    {list.label}
                    <span
                      className={`rounded-full px-1.5 text-xs ${
                        selected ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {counts[list.id]}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-1 self-start rounded-lg border border-white/10 bg-card/50 p-1 backdrop-blur-md">
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
                className={`rounded-md p-1.5 transition-colors ${
                  view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                aria-label="List view"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
                className={`rounded-md p-1.5 transition-colors ${
                  view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        </header>

        <section aria-live="polite">
          <AnimatePresence mode="wait">
            {games.length === 0 ? (
              <motion.div
                key={`empty-${activeList}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-card/50 py-20 text-center backdrop-blur-md"
              >
                {activeList === "horror" ? (
                  <Ghost className="size-10 text-muted-foreground" />
                ) : (
                  <Gamepad2 className="size-10 text-muted-foreground" />
                )}
                <p className="text-lg font-medium">
                  {activeList === "horror" ? "No horror games yet" : "No games in this list yet"}
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {activeList === "horror"
                    ? "Search for a game and add it to any list. Anything tagged horror shows up here automatically."
                    : "Use the search bar above to find a game, then tap Played, Playing, or Not played to add it here."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`${activeList}-${view}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-5">
                  <p className="text-sm text-muted-foreground">
                    {LISTS.find((l) => l.id === activeList)!.label} · {games.length}{" "}
                    {games.length === 1 ? "game" : "games"}
                  </p>
                </div>
                <div className={gridClass}>
                  {games.map((game, i) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      index={i}
                      view={view}
                      status={statusMap[game.id]}
                      onSet={setStatus}
                      onClear={clearStatus}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  )
}
