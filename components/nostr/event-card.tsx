"use client"

import type { NDKEvent } from "@nostr-dev-kit/ndk"
import { cn } from "@/lib/utils"
import { EventCardHeader } from "@/components/nostr/event-card-header"
import { EventCardFooter } from "@/components/nostr/event-card-footer"

interface EventCardProps {
  event: NDKEvent
  className?: string
  compact?: boolean
}

export function EventCard({ event, className, compact = false }: EventCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-2xl mx-auto",
        "bg-white dark:bg-zinc-900",
        "border border-zinc-200 dark:border-zinc-800",
        "rounded-3xl shadow-xl",
        compact && "shadow-sm",
        className,
      )}
    >
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        <div className={cn("p-6", compact && "p-4")}>
          {/* Author section */}
          <EventCardHeader event={event} compact={compact} className="mb-4" />

          {/* Content section */}
          <p
            className={cn(
              "text-zinc-600 dark:text-zinc-300 mb-4 whitespace-pre-wrap break-words",
              compact ? "text-sm" : "text-base",
            )}
          >
            {event.content}
          </p>

          {/* Engagement section */}
          {!compact && <EventCardFooter event={event} />}
        </div>
      </div>
    </div>
  )
}
