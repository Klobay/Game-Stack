import { betterAuth } from "better-auth"
import { pool } from "@/lib/db"

const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

function origin(value?: string) {
  if (!value) return undefined
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).origin
  } catch {
    return undefined
  }
}

const previewOrigin = origin(process.env.V0_RUNTIME_URL)
const devOrigin = origin(process.env.V0_DEV_APP_URL)
const buildOrigin = origin(process.env.V0_BUILD_URL)
const sandboxOrigin = origin(process.env.V0_SANDBOX_URL)
const vercelOrigin = origin(process.env.VERCEL_URL)
const productionOrigin = origin(process.env.VERCEL_PROJECT_PRODUCTION_URL)
const configuredBaseURL = origin(process.env.BETTER_AUTH_URL)
const baseURL = configuredBaseURL ?? (process.env.NODE_ENV === "development" ? previewOrigin : undefined) ?? productionOrigin ?? vercelOrigin
const trustedOrigins = Array.from(new Set([
  "http://localhost:3000",
  previewOrigin,
  devOrigin,
  buildOrigin,
  sandboxOrigin,
  "https://new-chat-5u4.v0.build",
  vercelOrigin,
  productionOrigin,
].filter((value): value is string => Boolean(value))))

export const auth = betterAuth({
  database: pool,
  baseURL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: hasGoogle
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : undefined,
  trustedOrigins,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          // In dev (v0 preview iframe), force cross-site cookies so the
          // session cookie is stored by the browser.
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})

export const isGoogleEnabled = hasGoogle
