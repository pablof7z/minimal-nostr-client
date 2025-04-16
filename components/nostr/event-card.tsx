"use client"

import { useState } from "react"
import { useSubscribe, useProfile, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks"
import { type NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import { cn } from "@/lib/utils"
import UserAvatar from "@/components/user/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Share2, MoreHorizontal, Send } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { Reaction } from "@/components/nostr/reaction"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface EventCardProps {
  event: NDKEvent
  className?: string
}

export function EventCard({ event, className }: EventCardProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const currentUser = useNDKCurrentUser()

  // Get profile data for the event author
  const profile = useProfile(event.pubkey)

  // Get replies to this event
  const { events: replies } = useSubscribe({
    kinds: [NDKKind.Text],
    ...event.filter(),
  })

  // Format the created_at timestamp
  const timestamp = event.created_at
    ? formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true })
    : "unknown time"

  // Get display name from profile or fallback to truncated pubkey
  const displayName = profile?.displayName || profile?.name || event.pubkey.substring(0, 8) + "..."
  const username = profile?.name || event.pubkey.substring(0, 8) + "..."

  const handleReply = () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "You need to login to reply to events",
        variant: "destructive",
      })
      return
    }

    if (!replyContent.trim()) {
      toast({
        title: "Empty Reply",
        description: "Please enter some content for your reply",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const replyEvent = event.reply()
      replyEvent.content = replyContent
      replyEvent.publish()

      setReplyContent("")
      setIsSubmitting(false)
      setReplyOpen(false)

      toast({
        title: "Reply Sent",
        description: "Your reply has been published",
      })
    } catch (error) {
      console.error("Error publishing reply:", error)
      toast({
        title: "Error",
        description: "Failed to publish your reply",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  const handleShare = () => {
    // Use event.encode() to get the proper Nostr URI
    const nostrUri = event.encode()
    navigator.clipboard.writeText(nostrUri)
    toast({
      title: "Link Copied",
      description: "Event link copied to clipboard",
    })
  }

  return (
    <div
      className={cn(
        "w-full max-w-2xl mx-auto",
        "bg-white dark:bg-zinc-900",
        "border border-zinc-200 dark:border-zinc-800",
        "rounded-3xl shadow-xl",
        className,
      )}
    >
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        <div className="p-6">
          {/* Author section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <UserAvatar pubkey={event.pubkey} size="default" />
              <div>
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{displayName}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  @{username} · {timestamp}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-zinc-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(event.id)}>
                  Copy Event ID
                </DropdownMenuItem>
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

          {/* Content section */}
          <p className="text-zinc-600 dark:text-zinc-300 mb-4 whitespace-pre-wrap break-words">{event.content}</p>

          {/* Engagement section */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-6">
              <Reaction event={event} />
              <button
                type="button"
                onClick={() => setReplyOpen(!replyOpen)}
                className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{replies.length || 0}</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-green-500 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Reply section */}
          {replyOpen && (
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                disabled={!currentUser || isSubmitting}
                className="min-h-[80px] w-full mb-2 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!currentUser || isSubmitting || !replyContent.trim()}
                  className="rounded-full"
                >
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
