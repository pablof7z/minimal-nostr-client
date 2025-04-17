"use client"

import type { NDKArticle } from "@nostr-dev-kit/ndk"
import { useProfile } from "@nostr-dev-kit/ndk-hooks"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FileText } from "lucide-react"

interface ArticleMentionProps {
  article: NDKArticle
  className?: string
  href?: string
}

export function ArticleMention({ article, className, href }: ArticleMentionProps) {
  const profile = useProfile(article.pubkey)

  // Get article title
  const title = article.title || "Untitled Article"

  // Get author name
  const authorName = profile?.displayName || profile?.name || article.pubkey.substring(0, 8) + "..."

  // Content to render inside the container
  const content = (
    <>
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300">
        <FileText className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{title}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">by {authorName}</div>
      </div>
    </>
  )

  // Common class names for the container
  const containerClassName = cn(
    "flex items-center gap-3 p-3 rounded-md",
    "bg-zinc-50 dark:bg-zinc-900",
    "border border-zinc-200 dark:border-zinc-800",
    href && "hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
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
