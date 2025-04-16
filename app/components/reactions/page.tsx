"use client"

import { Badge } from "@/components/ui/badge"
import { EventCard } from "@/components/nostr/event-card"
import { Reaction } from "@/components/nostr/reaction"
import { useSubscribe } from "@nostr-dev-kit/ndk-hooks"
import { CodeBlock } from "@/components/code-block"

export default function ReactionsPage() {
  // Fetch a specific event by ID
  const { events } = useSubscribe({
    ids: ["e3ae0dda313b8d02576fe54461b605965aa3640ff2ede6734acdf96806c32815"],
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Reactions</h1>
        <p className="text-muted-foreground mb-8">Components for displaying and creating kind 7 reactions</p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold">Reaction</h2>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
              kind 7
            </Badge>
          </div>

          <div className="p-6 border rounded-lg max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Basic Reaction</h3>
            {events.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Default reaction button (showMany=false). Click to see emoji options:
                </p>
                <div className="p-4 border rounded-lg">
                  <Reaction event={events[0]} />
                </div>

                <p className="text-sm text-muted-foreground mb-2 mt-6">
                  Reaction with top reactions displayed (showMany=5):
                </p>
                <div className="p-4 border rounded-lg">
                  <Reaction event={events[0]} showMany={5} />
                </div>

                <p className="text-sm text-muted-foreground mb-2 mt-6">Reaction integrated in an EventCard:</p>
                <EventCard event={events[0]} />
              </div>
            ) : (
              <p className="text-muted-foreground">Loading event...</p>
            )}

            <div className="mt-8 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Usage</h4>
              <CodeBlock code={`<Reaction event={event} />`} language="tsx" />
              <p className="mt-2 text-sm text-muted-foreground">
                Basic usage with default settings (only shows count). Click to see emoji options.
              </p>

              <CodeBlock code={`<Reaction event={event} showMany={5} />`} language="tsx" className="mt-4" />
              <p className="mt-2 text-sm text-muted-foreground">
                Shows the top 5 reaction types with their counts. Click on a reaction to add your own reaction of that
                type.
              </p>

              <h4 className="text-sm font-semibold mb-2 mt-6">How it works</h4>
              <p className="text-sm text-muted-foreground">
                The Reaction component fetches kind 7 reactions for an event using the event's filter. It groups similar
                reactions (+ and 👍 are grouped as 👍, - and 👎 are grouped as 👎) and counts them. When clicked, it
                shows a dropdown with emoji options.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                When a user selects an emoji, the component creates and publishes a reaction event using event.react().
                The showMany prop controls whether to display the top reaction types with their counts.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                The component also tracks if the current user has already reacted to the event and updates the UI
                accordingly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
