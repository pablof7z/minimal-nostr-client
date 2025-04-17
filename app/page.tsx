import Feed from "@/components/feed"
import { UserDropdown } from "@/components/user-dropdown"
import Link from "next/link"
import { Network } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <div className="container mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Nostr Feed</h1>
            <nav className="flex items-center gap-4">
              <Link
                href="/components"
                className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
              >
                Components
              </Link>
              <Link
                href="/xanadu"
                className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
              >
                <Network className="h-4 w-4" />
                Xanadu View
              </Link>
            </nav>
          </div>
          <UserDropdown />
        </header>
        <Feed />
      </div>
    </main>
  )
}
