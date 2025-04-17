"use client"

import { useSubscribe } from "@nostr-dev-kit/ndk-hooks"
import { NDKKind } from "@nostr-dev-kit/ndk"
import { XanaduView } from "@/components/xanadu/xanadu-view"
import { Loader2 } from "lucide-react"
import ErrorBoundary from "@/components/error-boundary"

export default function XanaduPage() {
  // Fetch initial events from the specified pubkey
  const { events } = useSubscribe({
    kinds: [NDKKind.Text],
    authors: ["fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52"],
    limit: 20, // Start with fewer events since we'll recursively load more
  })

  return (
    <div className="fixed inset-0 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-4">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-3xl font-bold">Xanadu View</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            A Project Xanadu-inspired visualization of interconnected Nostr events
          </p>
        </div>
      </div>

      <div className="absolute inset-0 pt-20">
        <ErrorBoundary>
          {events.length > 0 ? (
            <XanaduView initialEvents={events} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              <span className="ml-2 text-zinc-500">Loading events...</span>
            </div>
          )}
        </ErrorBoundary>
      </div>
    </div>
  )
}
