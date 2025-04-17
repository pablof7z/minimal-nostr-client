"use client"

import type React from "react"

import { useState, useEffect, type ReactNode } from "react"
import type { NDKArticle, NDKHighlight } from "@nostr-dev-kit/ndk"
import { useProfile, useSubscribe } from "@nostr-dev-kit/ndk-hooks"
import UserAvatar from "@/components/user/avatar"
import { formatDistanceToNow } from "date-fns"
import { Clock } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ArticleViewProps {
  article: NDKArticle
  className?: string
  withHighlights?: boolean
  HighlightComponent?: React.ComponentType<HighlightComponentProps>
}

interface HighlightComponentProps {
  highlight: NDKHighlight
  children: ReactNode
}

// Default component for rendering highlighted text
function DefaultHighlightComponent({ highlight, children }: HighlightComponentProps) {
  const profile = useProfile(highlight.pubkey)
  const displayName = profile?.displayName || profile?.name || highlight.pubkey.substring(0, 8) + "..."

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className="bg-amber-100 dark:bg-amber-900/30 px-0.5 rounded cursor-pointer">{children}</span>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="flex items-start gap-3">
          <UserAvatar pubkey={highlight.pubkey} size="sm" />
          <div className="flex-1">
            <div className="text-sm font-medium">{displayName}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
              {highlight.created_at
                ? formatDistanceToNow(new Date(highlight.created_at * 1000), { addSuffix: true })
                : ""}
            </div>
            <div className="text-sm italic border-l-2 border-amber-500 pl-2">{highlight.content}</div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Function to find the position of a highlight in the article content
function findHighlightPosition(content: string, highlightText: string) {
  if (!highlightText || highlightText.trim() === "") return null

  // Clean up the highlight text - remove extra whitespace
  const cleanHighlight = highlightText.trim().replace(/\s+/g, " ")

  // Simple exact match first
  const exactIndex = content.indexOf(cleanHighlight)
  if (exactIndex !== -1) {
    return {
      start: exactIndex,
      end: exactIndex + cleanHighlight.length,
      text: content.substring(exactIndex, exactIndex + cleanHighlight.length),
    }
  }

  // Case-insensitive match
  const lowerContent = content.toLowerCase()
  const lowerHighlight = cleanHighlight.toLowerCase()
  const lowerIndex = lowerContent.indexOf(lowerHighlight)
  if (lowerIndex !== -1) {
    return {
      start: lowerIndex,
      end: lowerIndex + cleanHighlight.length,
      text: content.substring(lowerIndex, lowerIndex + cleanHighlight.length),
    }
  }

  // Try to find the best partial match by looking for the longest common substring
  const words = cleanHighlight.split(/\s+/).filter(Boolean)
  if (words.length === 0) return null

  // Try to find a sequence of words that match
  for (let windowSize = words.length; windowSize > 0; windowSize--) {
    for (let i = 0; i <= words.length - windowSize; i++) {
      const phrase = words.slice(i, i + windowSize).join(" ")
      if (phrase.length < 5) continue // Skip very short phrases

      const phraseIndex = content.indexOf(phrase)
      if (phraseIndex !== -1) {
        // Found a match for this phrase
        return {
          start: phraseIndex,
          end: phraseIndex + phrase.length,
          text: content.substring(phraseIndex, phraseIndex + phrase.length),
        }
      }

      // Try case-insensitive match for the phrase
      const lowerPhraseIndex = lowerContent.indexOf(phrase.toLowerCase())
      if (lowerPhraseIndex !== -1) {
        return {
          start: lowerPhraseIndex,
          end: lowerPhraseIndex + phrase.length,
          text: content.substring(lowerPhraseIndex, lowerPhraseIndex + phrase.length),
        }
      }
    }
  }

  return null
}

export function ArticleView({
  article,
  className,
  withHighlights = true,
  HighlightComponent = DefaultHighlightComponent,
}: ArticleViewProps) {
  const profile = useProfile(article.pubkey)
  const [highlightPositions, setHighlightPositions] = useState<
    Array<{
      highlight: NDKHighlight
      position: { start: number; end: number; text: string } | null
    }>
  >([])

  // Extract article metadata using NDKArticle properties
  const title = article.title || "Untitled"
  const image = article.image
  const published = article.published_at?.toString() || article.created_at?.toString()

  // Calculate reading time (rough estimate: 200 words per minute)
  const wordCount = article.content.split(/\s+/).length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  // Format date
  const publishedDate = published
    ? formatDistanceToNow(new Date(Number.parseInt(published) * 1000), { addSuffix: true })
    : "recently"

  // Get author name
  const authorName = profile?.displayName || profile?.name || article.pubkey.slice(0, 8) + "..."

  // Fetch highlights if enabled
  const { events: highlights } = useSubscribe<NDKHighlight>(
    withHighlights
      ? {
          kinds: [9802], // NDKHighlight.kinds
          ...article.filter(), // Use article.filter() to get highlights for this article
        }
      : false, // Don't run the subscription if highlights are disabled
    { wrap: true },
    [withHighlights, article.id],
  )

  // Process highlights to find their positions in the article content
  useEffect(() => {
    if (!withHighlights || !highlights || highlights.length === 0) {
      setHighlightPositions([])
      return
    }

    // Sort highlights by length (longest first) to handle overlapping highlights
    const sortedHighlights = [...highlights].sort((a, b) => b.content.length - a.content.length)

    // Find positions for each highlight
    const positions = sortedHighlights
      .map((highlight) => ({
        highlight,
        position: findHighlightPosition(article.content, highlight.content),
      }))
      .filter((item) => item.position !== null)
      .sort((a, b) => (a.position?.start || 0) - (b.position?.start || 0))

    setHighlightPositions(positions)

    // Log for debugging
    console.log(`Found positions for ${positions.length} out of ${highlights.length} highlights`)
    positions.forEach((pos, i) => {
      console.log(
        `Highlight ${i + 1}: "${pos.highlight.content.substring(0, 30)}..." -> Position: ${pos.position?.start}-${pos.position?.end}`,
      )
    })
  }, [article.content, highlights, withHighlights])

  // Custom renderer for text nodes to apply highlights
  const renderText = (text: string, key?: string) => {
    if (!withHighlights || !highlightPositions || highlightPositions.length === 0) {
      return text
    }

    // Find all highlights that overlap with this text node
    const relevantHighlights = highlightPositions.filter(({ position }) => {
      if (!position) return false

      // Check if the highlight position overlaps with this text node
      const textStart = article.content.indexOf(text)
      if (textStart === -1) return false

      const textEnd = textStart + text.length
      return position.start < textEnd && position.end > textStart
    })

    if (relevantHighlights.length === 0) {
      return text
    }

    // Build the result with highlights
    const result: ReactNode[] = []
    let lastIndex = 0
    const textStart = article.content.indexOf(text)

    relevantHighlights.forEach(({ highlight, position }) => {
      if (!position) return

      // Calculate the relative positions within this text node
      const relativeStart = Math.max(0, position.start - textStart)
      const relativeEnd = Math.min(text.length, position.end - textStart)

      if (relativeStart > lastIndex) {
        // Add text before this highlight
        result.push(text.substring(lastIndex, relativeStart))
      }

      // Add the highlighted text
      if (relativeEnd > relativeStart) {
        result.push(
          <HighlightComponent key={highlight.id} highlight={highlight}>
            {text.substring(relativeStart, relativeEnd)}
          </HighlightComponent>,
        )
      }

      lastIndex = relativeEnd
    })

    // Add any remaining text
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex))
    }

    return result
  }

  return (
    <article className={cn("max-w-3xl mx-auto", className)}>
      {/* Article header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <UserAvatar pubkey={article.pubkey} size="default" />
            <div>
              <div className="font-medium">{authorName}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{publishedDate}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
            <Clock className="w-4 h-4" />
            <span>{readingTime} min read</span>
          </div>
        </div>

        {image && (
          <div className="mb-8">
            <img
              src={image || "/placeholder.svg"}
              alt={title}
              className="w-full h-64 md:h-96 object-cover rounded-lg"
              onError={(e) => {
                // Hide image on error
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
          </div>
        )}
      </header>

      {/* Article content */}
      <div className="prose dark:prose-invert prose-zinc max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "")
              return !inline && match ? (
                <div className="relative">
                  <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-md overflow-x-auto">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                  <div className="absolute top-2 right-2 text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">
                    {match[1]}
                  </div>
                </div>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            },
            // Custom text renderer to apply highlights
            text({ children }) {
              return renderText(children as string)
            },
          }}
        >
          {article.content}
        </ReactMarkdown>
      </div>

      {/* Debug info - remove in production */}
      {withHighlights && highlightPositions && highlightPositions.length > 0 && (
        <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400">
          <p>Found {highlightPositions.length} highlights for this article</p>
        </div>
      )}
    </article>
  )
}
