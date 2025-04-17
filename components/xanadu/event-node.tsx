"use client"

import type React from "react"

import { useState, useRef } from "react"
import type { NDKEvent } from "@nostr-dev-kit/ndk"
import { useProfile } from "@nostr-dev-kit/ndk-hooks"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import UserAvatar from "@/components/user/avatar"
import { useDrag } from "@use-gesture/react"
import { MessageSquare, Quote, ArrowDown, ArrowUp } from "lucide-react"

interface EventNodeProps {
  event: NDKEvent
  position: { x: number; y: number }
  onDrag: (position: { x: number; y: number }) => void
  isSelected: boolean
  isRelated: boolean
  onClick: () => void
  isOpen: boolean
  replyCount: number
  quoteCount: number
  incomingReplyCount: number
  incomingQuoteCount: number
}

export function EventNode({
  event,
  position,
  onDrag,
  isSelected,
  isRelated,
  onClick,
  isOpen,
  replyCount,
  quoteCount,
  incomingReplyCount,
  incomingQuoteCount,
}: EventNodeProps) {
  const profile = useProfile(event.pubkey)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)

  // Format the created_at timestamp
  const timestamp = event.created_at
    ? formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true })
    : "unknown time"

  // Get display name from profile or fallback to truncated pubkey
  const displayName = profile?.displayName || profile?.name || event.pubkey.substring(0, 8) + "..."

  // Set up drag gesture
  const bind = useDrag(
    ({ movement: [mx, my], first, last }) => {
      if (first) setIsDragging(true)
      if (last) setIsDragging(false)

      onDrag({
        x: position.x + mx,
        y: position.y + my,
      })
    },
    {
      filterTaps: true,
    },
  )

  // Truncate content if it's too long
  const truncatedContent = event.content.length > 140 ? event.content.substring(0, 140) + "..." : event.content

  // Determine if card should be shown
  const showCard = isOpen || isHovered

  // Handle click without triggering drag
  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      onClick()
    }
    e.stopPropagation()
  }

  return (
    <div
      ref={nodeRef}
      className={cn("absolute transition-all duration-300 ease-in-out", isDragging && "cursor-grabbing z-30")}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: isSelected || isDragging || showCard ? 20 : 10,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Avatar only view (when not hovered/open) */}
      <div
        className={cn(
          "w-6 h-6 transition-all duration-300 ease-in-out",
          isSelected
            ? "ring-2 ring-blue-500 shadow-blue-200 dark:shadow-blue-900/20"
            : isRelated
              ? "ring-2 ring-green-500"
              : "ring-1 ring-zinc-200 dark:ring-zinc-700",
          showCard ? "opacity-0 scale-0" : "opacity-100 scale-100",
          "rounded-full overflow-hidden",
        )}
      >
        {profile?.picture ? (
          <img
            src={profile.picture || "/placeholder.svg"}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image fails to load
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
        ) : (
          <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-800 dark:text-zinc-200">
            {displayName.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Card view (when hovered/open) */}
      <div
        className={cn(
          "w-72 rounded-lg shadow-lg transition-all duration-300 ease-in-out",
          "bg-white dark:bg-zinc-900 border",
          isSelected
            ? "border-blue-500 shadow-blue-200 dark:shadow-blue-900/20"
            : isRelated
              ? "border-green-500"
              : "border-zinc-200 dark:border-zinc-700",
          showCard ? "opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none",
          isDragging && "shadow-xl",
        )}
        style={{
          transformOrigin: "top left",
        }}
      >
        <div
          className={cn(
            "p-3 cursor-grab active:cursor-grabbing rounded-t-lg",
            isSelected
              ? "bg-blue-50 dark:bg-blue-950/30"
              : isRelated
                ? "bg-green-50 dark:bg-green-950/30"
                : "bg-zinc-50 dark:bg-zinc-800",
          )}
          {...bind()}
        >
          <div className="flex items-center gap-2">
            <UserAvatar pubkey={event.pubkey} size="sm" />
            <div>
              <div className="font-medium text-sm">{displayName}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{timestamp}</div>
            </div>
          </div>
        </div>

        <div className="p-3">
          <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">{truncatedContent}</p>
        </div>

        <div className="p-2 text-xs border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">ID: {event.id.substring(0, 8)}...</span>

            <div className="flex gap-2">
              {/* Outgoing connections */}
              <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400" title="Replies to other events">
                <ArrowUp className="h-3 w-3" />
                <span>{replyCount}</span>
              </div>

              <div
                className="flex items-center gap-1 text-green-500 dark:text-green-400"
                title="Quotes of other events"
              >
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
    </div>
  )
}
