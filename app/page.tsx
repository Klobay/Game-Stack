import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { GameLibrary } from "@/components/game-library"

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  return (
    <main className="min-h-screen bg-background">
      <GameLibrary userName={session.user.name} />
    </main>
  )
}
