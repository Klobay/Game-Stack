import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  console.log("[v0] DATABASE_URL is not set")
}

export const sql = neon(process.env.DATABASE_URL!)
