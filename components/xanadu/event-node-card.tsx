"use client"

import { useProfile } from "@nostr-dev-kit/ndk-hooks"
import type { NDKEvent } from "@nostr-dev-kit/ndk"
import { formatDistanceToNow } from "date-fns"
import { X, MessageSquare, Quote, ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import UserAvatar from "@/components/user/avatar"
import { useXanaduStore } from "@/lib/xanadu/store"

interface EventNodeCardProps {
  event: NDKEvent
  position: { x: number; y: number }
  isSelected: boolean
  isRelated: boolean
  onClose: () => void
}

export function EventNodeCard({ event, position, isSelected, isRelated, onClose }: EventNodeCardProps) {
  const profile = useProfile(event.pubkey)
  const connections = useXanaduStore((state) => state.connections)

  // Format the created_at timestamp
  const timestamp = event.created_at
    ? formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true })
    : "unknown time"

  // Get display name from profile or fallback to truncated pubkey
  const displayName = profile?.displayName || profile?.name || event.pubkey.substring(0, 8) + "..."

  // Truncate content if it's too long
  const truncatedContent = event.content.length > 140 ? event.content.substring(0, 140) + "..." : event.content

  // Count connections
  const replyCount = connections.filter((conn) => conn.source === event.id && conn.type === "reply").length
  const quoteCount = connections.filter((conn) => conn.source === event.id && conn.type === "quote").length
  const incomingReplyCount = connections.filter((conn) => conn.target === event.id && conn.type === "reply").length
  const incomingQuoteCount = connections.filter((conn) => conn.target === event.id && conn.type === "quote").length

  return (
    <div
      className={cn(
        "absolute w-72 rounded-lg shadow-lg",
        "bg-white dark:bg-zinc-900 border",
        isSelected
          ? "border-blue-500 shadow-blue-200 dark:shadow-blue-900/20"
          : isRelated
            ? "border-green-500"
            : "border-zinc-200 dark:border-zinc-700",
        "z-50",
      )}
      style={{
        left: position.x + 15, // Offset from the node
        top: position.y - 15,
        transform: "translate(-50%, -100%)", // Position above the node
      }}
    >
      <div
        className={cn(
          "p-3 rounded-t-lg flex items-center justify-between",
          isSelected
            ? "bg-blue-50 dark:bg-blue-950/30"
            : isRelated
              ? "bg-green-50 dark:bg-green-950/30"
              : "bg-zinc-50 dark:bg-zinc-800",
        )}
      >
        <div className="flex items-center gap-2">
          <UserAvatar pubkey={event.pubkey} size="sm" />
          <div>
            <div className="font-medium text-sm">{displayName}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{timestamp}</div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3">
        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">{truncatedContent}</p>
      </div>

      <div className="p-2 text-xs border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex justify-between">
          <span
            className="text-zinc-500 dark:text-zinc-400 cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              window.open(`https://njump.me/${event.id}`, "_blank")
            }}
          >
            ID: {event.id.substring(0, 8)}...
          </span>

          <div className="flex gap-2">
            {/* Outgoing connections */}
            <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400" title="Replies to other events">
              <ArrowUp className="h-3 w-3" />
              <span>{replyCount}</span>
            </div>

            <div className="flex items-center gap-1 text-green-500 dark:text-green-400" title="Quotes of other events">
              <Quote className="h-3 w-3" />
              <span>{quoteCount}</span>
            </div>

            {/* Incoming connections */}
            <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400" title="Replies to this event">
              <ArrowDown className="h-3 w-3" />
              <span>{incomingReplyCount}</span>
            </div>

            <div className="flex items-center gap-1 text-green-500 dark:text-green-400" title="Quotes of this event">
              <MessageSquare className="h-3 w-3" />
              <span>{incomingQuoteCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
