"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import type { Game, GameStatus } from "@/lib/types"
import { createManualGame } from "@/lib/types"

export function ManualGameDialog({ onAdd }: { onAdd: (game: Game, status: GameStatus) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [image, setImage] = useState("")
  const [tag, setTag] = useState<"horror" | "other">("other")
  const [status, setStatus] = useState<GameStatus>("not_played")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return setError("Enter a game name.")
    setSaving(true); setError("")
    const game = { ...createManualGame(name.trim(), image, []), horrorTagged: tag === "horror", otherTagged: tag === "other" }
    try { await onAdd(game, status); setOpen(false); setName(""); setImage(""); setTag("other") } catch (e) { setError(e instanceof Error ? e.message : "Could not add game") } finally { setSaving(false) }
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"><Plus className="size-4" /> Add game manually</button>
    {open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="manual-game-title"><form onSubmit={submit} className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="manual-game-title" className="font-display text-xl font-semibold">Add a game manually</h2><p className="text-sm text-muted-foreground">For games you cannot find in search.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-2 text-muted-foreground hover:text-foreground"><X className="size-5" /></button></div><label className="flex flex-col gap-1.5 text-sm font-medium">Name<input required maxLength={120} value={name} onChange={e => setName(e.target.value)} className="rounded-lg border border-input bg-secondary px-3 py-2 outline-none focus:ring-2 focus:ring-ring" /></label><label className="flex flex-col gap-1.5 text-sm font-medium">Image URL <span className="text-xs font-normal text-muted-foreground">Optional</span><input type="url" maxLength={2000} value={image} onChange={e => setImage(e.target.value)} className="rounded-lg border border-input bg-secondary px-3 py-2 outline-none focus:ring-2 focus:ring-ring" /></label><fieldset className="flex flex-col gap-2"><legend className="text-sm font-medium">Game tag</legend><div className="grid grid-cols-2 gap-2"><label className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm ${tag === "horror" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"}`}><input type="radio" name="tag" value="horror" checked={tag === "horror"} onChange={() => setTag("horror")} className="sr-only" />Horror</label><label className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm ${tag === "other" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"}`}><input type="radio" name="tag" value="other" checked={tag === "other"} onChange={() => setTag("other")} className="sr-only" />Other Games</label></div></fieldset><label className="flex flex-col gap-1.5 text-sm font-medium">Status<select value={status} onChange={e => setStatus(e.target.value as GameStatus)} className="rounded-lg border border-input bg-secondary px-3 py-2 outline-none focus:ring-2 focus:ring-ring"><option value="playing">Playing</option><option value="played">Played</option><option value="not_played">Not played</option></select></label>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60">{saving ? "Adding…" : "Add game"}</button></form></div> : null}
  </>
}
