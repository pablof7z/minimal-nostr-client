"use client"

import { Badge } from "@/components/ui/badge"
import { EventCard } from "@/components/nostr/event-card"
import { useSubscribe } from "@nostr-dev-kit/ndk-hooks"
import { NDKKind } from "@nostr-dev-kit/ndk"
import { CodeBlock } from "@/components/code-block"
import { Repeat } from "lucide-react"

export default function TextNotesPage() {
  // Fetch a single event from the specified pubkey
  const { events } = useSubscribe({
    kinds: [NDKKind.Text],
    authors: ["fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52"],
    limit: 1,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Text Notes</h1>
        <p className="text-muted-foreground mb-8">Components for displaying and interacting with kind 1 text notes</p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold">Text Note</h2>
            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              kind 1
            </Badge>
          </div>

          <div className="p-6 border rounded-lg max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Event Card</h3>
            {events.length > 0 ? (
              <EventCard event={events[0]} />
            ) : (
              <p className="text-muted-foreground">Loading event...</p>
            )}

            <div className="mt-8 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Usage</h4>
              <CodeBlock code={`<EventCard event={event} />`} language="tsx" />
              <p className="mt-2 text-sm text-muted-foreground">
                The EventCard component accepts an NDKEvent object and displays it with the author's profile
                information, content, and timestamp. It also supports interactions like replies, likes, zaps, and
                sharing.
              </p>

              <h4 className="text-sm font-semibold mb-2 mt-4">Repost & Quote</h4>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Repeat className="h-4 w-4 text-zinc-500" />
                Click the repost button to either repost directly or quote the post with your own comment
              </p>
              <CodeBlock
                code={`// Simple repost
const repostEvent = event.repost()
repostEvent.publish()

// Quote post
const quoteEvent = new NDKEvent(ndk)
quoteEvent.kind = NDKKind.Text
quoteEvent.content = \`Your comment\n\nnostr:\${event.encode()}\`
quoteEvent.publish()`}
                language="tsx"
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
