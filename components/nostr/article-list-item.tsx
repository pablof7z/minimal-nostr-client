"use client"

import type { NDKArticle } from "@nostr-dev-kit/ndk"
import { useProfile } from "@nostr-dev-kit/ndk-hooks"
import UserAvatar from "@/components/user/avatar"
import { formatDistanceToNow } from "date-fns"
import { Clock } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ArticleListItemProps {
  article: NDKArticle
  className?: string
  href?: string
}

export function ArticleListItem({ article, className, href }: ArticleListItemProps) {
  const profile = useProfile(article.pubkey)

  // Extract article metadata using NDKArticle properties
  const title = article.title || "Untitled"
  const summary = article.summary || article.content.slice(0, 140) + "..."
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

  // Content to render inside the container
  const content = (
    <>
      {image && (
        <div className="flex-shrink-0">
          <img
            src={image || "/placeholder.svg"}
            alt={title}
            className="w-24 h-24 object-cover rounded-md"
            onError={(e) => {
              // Hide image on error
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1 line-clamp-2">{title}</h3>

        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2 line-clamp-2">{summary}</p>

        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <UserAvatar pubkey={article.pubkey} size="sm" />
            <span>{authorName}</span>
          </div>

          <div className="flex items-center gap-4">
            <span>{publishedDate}</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{readingTime} min read</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  // Common class names for the container
  const containerClassName = cn("flex gap-4 p-4 border rounded-lg", className)

  // Render with or without a link based on the href prop
  return href ? (
    <Link href={href} className={cn(containerClassName, "hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors")}>
      {content}
    </Link>
  ) : (
    <div className={containerClassName}>{content}</div>
  )
}
