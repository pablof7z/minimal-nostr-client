"use client"

import { useState, useEffect } from "react"
import { useSubscribe, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks"
import { type NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import { cn } from "@/lib/utils"
import { Heart } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface ReactionProps {
  event: NDKEvent
  showMany?: number | false
  className?: string
}

type ReactionType = {
  content: string
  count: number
  normalized: string
  display: string
}

export function Reaction({ event, showMany = false, className }: ReactionProps) {
  const [isReacted, setIsReacted] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const currentUser = useNDKCurrentUser()

  // Get reactions to this event
  const { events: reactions } = useSubscribe(
    {
      kinds: [NDKKind.Reaction],
      ...event.filter(),
    },
    {},
    [event.id],
  )

  // Check if the current user has already reacted
  useEffect(() => {
    if (currentUser && reactions.length > 0) {
      const hasReacted = reactions.some((reaction) => reaction.pubkey === currentUser.pubkey)
      setIsReacted(hasReacted)
    }
  }, [reactions, currentUser])

  // Process reactions to count and group them
  const processedReactions = reactions.reduce((acc: Record<string, ReactionType>, reaction) => {
    const content = reaction.content

    // Normalize reaction content for grouping
    let normalized = content
    let display = content

    // Group + and 👍 together
    if (content === "+" || content === "👍") {
      normalized = "+"
      display = "👍"
    }

    // Group - and 👎 together
    if (content === "-" || content === "👎") {
      normalized = "-"
      display = "👎"
    }

    if (!acc[normalized]) {
      acc[normalized] = {
        content: content,
        count: 1,
        normalized,
        display,
      }
    } else {
      acc[normalized].count += 1
    }

    return acc
  }, {})

  // Convert to array and sort by count
  const reactionsList = Object.values(processedReactions).sort((a, b) => b.count - a.count)

  // Get total reaction count
  const totalReactions = reactions.length

  // Handle reaction
  const handleReact = (content: string) => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "You need to login to react to events",
        variant: "destructive",
      })
      return
    }

    try {
      event.react(content)
      setIsReacted(true)
      setShowEmojiPicker(false)

      toast({
        title: "Reaction Sent",
        description: "Your reaction has been published",
      })
    } catch (error) {
      console.error("Error publishing reaction:", error)
      toast({
        title: "Error",
        description: "Failed to publish your reaction",
        variant: "destructive",
      })
    }
  }

  // Emoji options for the reaction picker
  const emojiOptions = [
    { emoji: "❤️", content: "+" },
    { emoji: "👍", content: "+" },
    { emoji: "👎", content: "-" },
    { emoji: "😂", content: "😂" },
    { emoji: "🔥", content: "🔥" },
    { emoji: "👀", content: "👀" },
    { emoji: "🎉", content: "🎉" },
    { emoji: "🙏", content: "🙏" },
  ]

  // If showMany is a number, show that many reactions
  const displayedReactions = showMany !== false ? reactionsList.slice(0, showMany as number) : []

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={cn(
            "flex items-center gap-2 text-sm transition-colors",
            isReacted ? "text-rose-600" : "text-zinc-500 dark:text-zinc-400 hover:text-rose-600",
          )}
        >
          <Heart className={cn("w-5 h-5 transition-all", isReacted && "fill-current scale-110")} />
          <span>{totalReactions || 0}</span>
        </button>

        {showMany !== false && displayedReactions.length > 0 && (
          <div className="flex items-center gap-2 ml-4">
            {displayedReactions.map((reaction) => (
              <button
                key={reaction.normalized}
                onClick={() => handleReact(reaction.content)}
                className="flex items-center gap-1 text-sm bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <span>{reaction.display}</span>
                <span className="text-zinc-500 dark:text-zinc-400">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showEmojiPicker && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg z-50 animate-in zoom-in-50 duration-200">
          <div className="flex gap-2">
            {emojiOptions.map((option) => (
              <button
                key={option.emoji}
                onClick={() => handleReact(option.content)}
                className="text-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors"
              >
                {option.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
