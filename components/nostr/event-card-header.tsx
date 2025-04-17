"use client"

import { useProfile } from "@nostr-dev-kit/ndk-hooks"
import type { NDKEvent } from "@nostr-dev-kit/ndk"
import { formatDistanceToNow } from "date-fns"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import UserAvatar from "@/components/user/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface EventCardHeaderProps {
  event: NDKEvent
  compact?: boolean
  className?: string
}

export function EventCardHeader({ event, compact = false, className }: EventCardHeaderProps) {
  // Get profile data for the event author
  const profile = useProfile(event.pubkey)

  // Format the created_at timestamp
  const timestamp = event.created_at
    ? formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true })
    : "unknown time"

  // Get display name from profile or fallback to truncated pubkey
  const displayName = profile?.displayName || profile?.name || event.pubkey.substring(0, 8) + "..."
  const username = profile?.name || event.pubkey.substring(0, 8) + "..."

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-3">
        <UserAvatar pubkey={event.pubkey} size={compact ? "sm" : "default"} />
        <div>
          <h3 className={cn("font-medium text-zinc-900 dark:text-zinc-100", compact ? "text-xs" : "text-sm")}>
            {displayName}
          </h3>
          <p className={cn("text-zinc-500 dark:text-zinc-400", compact ? "text-[10px]" : "text-xs")}>
            @{username} · {timestamp}
          </p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <MoreHorizontal className={cn("text-zinc-400", compact ? "w-4 h-4" : "w-5 h-5")} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(event.id)}>Copy Event ID</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(event.pubkey)}>
            Copy Author Pubkey
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.open(`https://njump.me/${event.id}`, "_blank")}>
            View on njump.me
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
