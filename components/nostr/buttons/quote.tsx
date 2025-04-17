"use client"

import { useState } from "react"
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import { useNDKCurrentUser, useSubscribe } from "@nostr-dev-kit/ndk-hooks"
import { Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { EventCard } from "@/components/nostr/event-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface QuoteButtonProps {
  event: NDKEvent
  className?: string
}

export function QuoteButton({ event, className }: QuoteButtonProps) {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [quoteContent, setQuoteContent] = useState("")
  const [isQuoting, setIsQuoting] = useState(false)
  const currentUser = useNDKCurrentUser()

  // Get reposts and quotes of this event
  const { events: reposts } = useSubscribe(
    [
      { kinds: [6, 16], ...event.filter() },
      { kinds: [1], "#q": [event.id] },
    ],
    {},
    [event.id],
  )

  // Handle repost
  const handleRepost = () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "You need to login to repost events",
        variant: "destructive",
      })
      return
    }

    try {
      const repostEvent = event.repost()
      repostEvent.publish()

      toast({
        title: "Reposted",
        description: "Event has been reposted",
      })
    } catch (error) {
      console.error("Error reposting:", error)
      toast({
        title: "Error",
        description: "Failed to repost the event",
        variant: "destructive",
      })
    }
  }

  // Handle quote post
  const handleQuotePost = () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "You need to login to quote events",
        variant: "destructive",
      })
      return
    }

    setQuoteModalOpen(true)
  }

  // Publish quote post
  const publishQuote = () => {
    if (!quoteContent.trim()) {
      toast({
        title: "Empty Quote",
        description: "Please enter some content for your quote",
        variant: "destructive",
      })
      return
    }

    setIsQuoting(true)

    try {
      // Create a new kind 1 event
      const quoteEvent = new NDKEvent(event.ndk)
      quoteEvent.kind = NDKKind.Text

      // Add the user's comment and the nostr URI at the end
      quoteEvent.content = `${quoteContent}\n\nnostr:${event.encode()}`

      // NDK will handle adding the appropriate tags automatically

      // Publish the quote
      quoteEvent.publish()

      setQuoteContent("")
      setIsQuoting(false)
      setQuoteModalOpen(false)

      toast({
        title: "Quote Posted",
        description: "Your quote has been published",
      })
    } catch (error) {
      console.error("Error publishing quote:", error)
      toast({
        title: "Error",
        description: "Failed to publish your quote",
        variant: "destructive",
      })
      setIsQuoting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-green-500 transition-colors"
          >
            <Repeat className="w-5 h-5" />
            {reposts.length > 0 && <span>{reposts.length}</span>}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleRepost}>Repost</DropdownMenuItem>
          <DropdownMenuItem onClick={handleQuotePost}>Quote</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quote Modal */}
      <Dialog open={quoteModalOpen} onOpenChange={setQuoteModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Quote Post</DialogTitle>
            <DialogDescription>Add your thoughts to share along with this post</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Add your comment..."
              value={quoteContent}
              onChange={(e) => setQuoteContent(e.target.value)}
              disabled={isQuoting}
              className="min-h-[120px] w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
            />

            {/* Quoted post - using compact mode */}
            <EventCard event={event} compact={true} className="shadow-sm" />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setQuoteModalOpen(false)} disabled={isQuoting}>
                Cancel
              </Button>
              <Button onClick={publishQuote} disabled={isQuoting || !quoteContent.trim()}>
                {isQuoting ? "Publishing..." : "Publish Quote"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
