import { type NextRequest, NextResponse } from "next/server"
import type { Game } from "@/lib/types"
import { POPULAR_GAMES } from "@/lib/popular-games"

const RAWG_BASE = "https://api.rawg.io/api"

// The user provided this key. Prefer the env var, fall back to the provided key
// so search works out of the box.
const FALLBACK_KEY = "93126430d6ab470797af86c8afca8d2f"

/** Lowercase, drop punctuation/apostrophes, collapse whitespace. */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

/**
 * Fix "held-key" typos: any run of 3+ identical letters collapses to one
 * (e.g. "assaaassins" -> "assassins"), while legitimate double letters
 * (run length 2, like the "ss" in "assassins" or "ee" in "creed") are kept.
 */
function fixRepeats(str: string): string {
  return str.replace(/(.)\1{2,}/g, "$1")
}

/** Aggressive signature: collapse ALL adjacent duplicates and remove spaces. */
function squeeze(str: string): string {
  return normalize(str)
    .replace(/(.)\1+/g, "$1")
    .replace(/\s+/g, "")
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        prevDiag + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      prevDiag = tmp
    }
  }
  return prev[b.length]
}

/** 0..1 similarity based on edit distance. */
function ratio(a: string, b: string): number {
  const max = Math.max(a.length, b.length)
  if (max === 0) return 1
  return 1 - levenshtein(a, b) / max
}

/**
 * Popularity gate: RAWG returns a long tail of obscure / duplicate entries that
 * "no one knows". Keep a game only if it has real traction (enough player
 * ratings, a Metacritic score, or a decently-rated backer base). An exact name
 * match to the query is always kept so intentional searches never get dropped.
 */
const MIN_RATINGS = 25

function isKnownGame(game: Game, rawQuery: string): boolean {
  const qn = fixRepeats(normalize(rawQuery))
  if (normalize(game.name) === qn) return true

  const ratingsCount = game.ratings_count ?? 0
  if (game.metacritic != null) return true
  if (ratingsCount >= MIN_RATINGS) return true
  if (ratingsCount >= 8 && (game.rating ?? 0) >= 3.8) return true
  return false
}

function scoreGame(game: Game, rawQuery: string): number {
  const qn = fixRepeats(normalize(rawQuery))
  const qs = squeeze(rawQuery)
  const name = normalize(game.name)
  const ns = squeeze(game.name)
  if (!qn) return 0

  let score = 0
  if (name === qn) score += 1000
  else if (name.startsWith(qn)) score += 600
  else if (name.includes(qn)) score += 400

  // Squeezed signature match handles wildly misspelled / repeated input.
  if (ns === qs) score += 500
  else if (ns.startsWith(qs)) score += 300
  else if (ns.includes(qs)) score += 200

  // Every query token appears somewhere in the name (order independent).
  const qTokens = qn.split(" ").filter(Boolean)
  const nameTokens = name.split(" ").filter(Boolean)
  if (qTokens.length && qTokens.every((qt) => nameTokens.some((nt) => nt.includes(qt)))) {
    score += 150
  }

  // Acronym match ("gta" -> Grand Theft Auto, "gow" -> God of War).
  const qCompact = qn.replace(/\s+/g, "")
  if (qCompact.length >= 2 && !qn.includes(" ")) {
    const acronym = nameTokens
      .filter((t) => !["the", "of", "and", "a"].includes(t))
      .map((t) => t[0])
      .join("")
    if (acronym === qCompact) score += 320
    else if (acronym.startsWith(qCompact)) score += 220
  }

  // Fuzzy similarity of the squeezed signatures.
  score += Math.round(ratio(qs, ns) * 120)

  // Popularity / quality tiebreakers so well-known franchise entries float up.
  score += (game.rating ?? 0) * 4
  score += Math.min(Math.log10((game.ratings_count ?? 0) + 1) * 12, 60)
  if (game.metacritic) score += Math.min(game.metacritic / 5, 20)

  return score
}

/**
 * Expand a short/partial query into full franchise titles using the curated
 * dictionary, so autocomplete-style prefixes ("assa", "resi evel") resolve to
 * real titles before we hit RAWG. Returns up to `limit` best matches.
 */
function expandQuery(rawQuery: string, limit = 3): string[] {
  const qn = fixRepeats(normalize(rawQuery))
  const qs = squeeze(rawQuery)
  if (qn.length < 2) return []

  const scored = POPULAR_GAMES.map((title) => {
    const tn = normalize(title)
    const ts = squeeze(title)
    let s = 0
    if (tn === qn) s += 1000
    else if (tn.startsWith(qn)) s += 500
    else if (tn.includes(qn)) s += 300
    if (ts.startsWith(qs)) s += 250
    else if (ts.includes(qs)) s += 150
    // token-level: each query token prefixes some title token
    const qTokens = qn.split(" ").filter(Boolean)
    const tTokens = tn.split(" ").filter(Boolean)
    const tokenMatch = (qt: string, tt: string) =>
      tt.startsWith(qt) || tt.includes(qt) || (qt.length >= 3 && ratio(squeeze(qt), squeeze(tt)) >= 0.7)
    if (qTokens.length && qTokens.every((qt) => tTokens.some((tt) => tokenMatch(qt, tt)))) {
      s += 320
    }
    // Acronym match: "gta" -> Grand Theft Auto, "gow" -> God of War.
    const acronym = tTokens
      .filter((t) => !["the", "of", "and", "a"].includes(t))
      .map((t) => t[0])
      .join("")
    const qCompact = qn.replace(/\s+/g, "")
    if (qCompact.length >= 2 && (acronym === qCompact || acronym.startsWith(qCompact))) {
      s += 260
    }

    s += Math.round(ratio(qs, ts) * 80)
    return { title, s }
  })
    .filter((x) => x.s >= 250)
    .sort((a, b) => b.s - a.s)

  return scored.slice(0, limit).map((x) => x.title)
}

async function fetchRawg(apiKey: string, query: string): Promise<Game[]> {
  const params = new URLSearchParams({
    key: apiKey,
    page_size: "40",
    search: query,
  })
  const res = await fetch(`${RAWG_BASE}/games?${params.toString()}`, {
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`RAWG ${res.status}`)
  const data = await res.json()
  return (data.results ?? []) as Game[]
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.RAWG_API_KEY || FALLBACK_KEY

  const { searchParams } = new URL(request.url)
  const search = (searchParams.get("search") ?? "").trim()

  // This app only surfaces games the user explicitly searches for.
  if (!search) {
    return NextResponse.json({ results: [], count: 0, next: null })
  }

  // Build a small set of candidate queries: the cleaned original plus the
  // repeat-corrected version. RAWG's fuzzy search + our re-ranking do the rest.
  const cleaned = normalize(search)
  const repaired = fixRepeats(cleaned)
  const expansions = expandQuery(search)
  const candidates = Array.from(new Set([repaired, cleaned, search, ...expansions].filter(Boolean)))

  try {
    const settled = await Promise.allSettled(candidates.map((q) => fetchRawg(apiKey, q)))

    const byId = new Map<number, Game>()
    for (const r of settled) {
      if (r.status === "fulfilled") {
        for (const g of r.value) if (!byId.has(g.id)) byId.set(g.id, g)
      }
    }

    if (byId.size === 0 && settled.every((r) => r.status === "rejected")) {
      return NextResponse.json({ error: "Failed to fetch games from RAWG." }, { status: 502 })
    }

    const known = Array.from(byId.values()).filter((game) => isKnownGame(game, search))

    // If the popularity gate filtered everything out (rare, very niche query),
    // fall back to the unfiltered set so the user still sees their best matches.
    const pool = known.length > 0 ? known : Array.from(byId.values())

    const ranked = pool
      .map((game) => ({ game, score: scoreGame(game, search) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 16)
      .map((r) => r.game)

    return NextResponse.json({ results: ranked, count: ranked.length, next: null })
  } catch {
    return NextResponse.json({ error: "Network error while contacting RAWG." }, { status: 502 })
  }
}
