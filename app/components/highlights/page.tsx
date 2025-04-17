"use client"

import { Badge } from "@/components/ui/badge"
import { HighlightCard } from "@/components/nostr/highlight-card"
import { useSubscribe } from "@nostr-dev-kit/ndk-hooks"
import type { NDKHighlight } from "@nostr-dev-kit/ndk"
import { CodeBlock } from "@/components/code-block"

export default function HighlightsPage() {
  // Fetch highlights from the specified pubkey
  const { events: highlightEvents } = useSubscribe<NDKHighlight>(
    {
      kinds: [9802], // NDKHighlight.kinds
      authors: ["fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52"],
    },
    { wrap: true },
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Highlights</h1>
        <p className="text-muted-foreground mb-8">Components for displaying kind 9802 highlights from articles</p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold">Highlight</h2>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
              kind 9802
            </Badge>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Highlight Card</h3>
            {highlightEvents.length > 0 ? (
              <div className="space-y-4 max-w-2xl">
                {highlightEvents.slice(0, 3).map((highlight) => (
                  <HighlightCard key={highlight.id} highlight={highlight} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No highlights found. Try creating some highlights first.</p>
            )}

            <div className="mt-8 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Usage</h4>
              <CodeBlock code={`<HighlightCard highlight={highlight} />`} language="tsx" />
              <p className="mt-2 text-sm text-muted-foreground">
                Displays a highlight with the highlighted text, author information, and a reference to the source
                article if available. The component automatically attempts to fetch the source article using
                highlight.getArticle().
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
