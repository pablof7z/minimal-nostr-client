"use client"

import { useState, useEffect } from "react"
import type { NDKHighlight, NDKArticle } from "@nostr-dev-kit/ndk"
import { Card, CardContent } from "@/components/ui/card"
import { Quote } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ArticleMention } from "@/components/nostr/article-mention"
import { EventCardHeader } from "@/components/nostr/event-card-header"
import { EventCardFooter } from "@/components/nostr/event-card-footer"

interface HighlightCardProps {
  highlight: NDKHighlight
  className?: string
}

export function HighlightCard({ highlight, className }: HighlightCardProps) {
  const [sourceArticle, setSourceArticle] = useState<NDKArticle | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Format the created_at timestamp
  const timestamp = highlight.created_at
    ? formatDistanceToNow(new Date(highlight.created_at * 1000), { addSuffix: true })
    : "unknown time"

  // Try to fetch the source article
  useEffect(() => {
    let isMounted = true

    const fetchArticle = async () => {
      try {
        setIsLoading(true)
        const article = await highlight.getArticle()
        if (isMounted && article) {
          setSourceArticle(article)
        }
      } catch (error) {
        console.error("Error fetching source article:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchArticle()

    return () => {
      isMounted = false
    }
  }, [highlight])

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        {/* Use the EventCardHeader component */}
        <EventCardHeader event={highlight} className="mb-4" />

        <div className="pl-4 border-l-2 border-amber-500 mb-4">
          <div className="text-lg italic text-zinc-700 dark:text-zinc-300">
            <Quote className="h-4 w-4 inline-block mr-2 text-amber-500" />
            {highlight.content}
          </div>
        </div>

        {sourceArticle && (
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Highlighted from:</div>
            <ArticleMention article={sourceArticle} />
          </div>
        )}

        {isLoading && <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Loading source article...</div>}

        {/* Add the EventCardFooter component */}
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <EventCardFooter event={highlight} />
        </div>
      </CardContent>
    </Card>
  )
}
