"use client"

import type { NDKArticle } from "@nostr-dev-kit/ndk"
import { useProfile } from "@nostr-dev-kit/ndk-hooks"
import UserAvatar from "@/components/user/avatar"
import { Clock } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ArticleCardProps {
  article: NDKArticle
  className?: string
  href?: string
}

export function ArticleCard({ article, className, href }: ArticleCardProps) {
  const profile = useProfile(article.pubkey)

  // Extract article metadata using NDKArticle properties
  const title = article.title || "Untitled"
  const summary = article.summary || article.content.slice(0, 140) + "..."
  const image = article.image

  // Calculate reading time (rough estimate: 200 words per minute)
  const wordCount = article.content.split(/\s+/).length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  // Get author name
  const authorName = profile?.displayName || profile?.name || article.pubkey.slice(0, 8) + "..."

  // Content to render inside the container
  const content = (
    <>
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: image ? `url(${image})` : "none" }}
      >
        {/* Fallback background if no image */}
        {!image && <div className="absolute inset-0 bg-gradient-to-br from-purple-700 to-blue-900" />}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-6 text-white">
        <div>
          <h3 className="text-xl font-bold mb-2 line-clamp-3 group-hover:underline">{title}</h3>
          <p className="text-sm text-zinc-200 line-clamp-3">{summary}</p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <UserAvatar pubkey={article.pubkey} size="sm" />
            <span className="text-sm">{authorName}</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-zinc-300">
            <Clock className="w-3 h-3" />
            <span>{readingTime} min read</span>
          </div>
        </div>
      </div>
    </>
  )

  // Common class names for the container
  const containerClassName = cn(
    "block relative overflow-hidden rounded-xl h-80 group",
    "transition-transform hover:-translate-y-1",
    className,
  )

  // Render with or without a link based on the href prop
  return href ? (
    <Link href={href} className={containerClassName}>
      {content}
    </Link>
  ) : (
    <div className={containerClassName}>{content}</div>
  )
}
