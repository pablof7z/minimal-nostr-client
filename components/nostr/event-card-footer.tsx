"use client"

import { useState } from "react"
import { useSubscribe, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks"
import { type NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import { MessageCircle, Share2, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Reaction } from "@/components/nostr/buttons/reaction"
import { ZapButton } from "@/components/nostr/buttons/zap"
import { QuoteButton } from "@/components/nostr/buttons/quote"

interface EventCardFooterProps {
  event: NDKEvent
  className?: string
}

export function EventCardFooter({ event, className }: EventCardFooterProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const currentUser = useNDKCurrentUser()

  // Get replies to this event
  const { events: replies } = useSubscribe({
    kinds: [NDKKind.Text],
    ...event.filter(),
  })

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
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-6">
          <Reaction event={event} />
          <button
            type="button"
            onClick={() => setReplyOpen(!replyOpen)}
            className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-blue-500 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            {replies.length > 0 && <span>{replies.length}</span>}
          </button>
          <ZapButton event={event} />
          <QuoteButton event={event} />
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
  )
}
