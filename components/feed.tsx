"use client"

import { useSubscribe } from "@nostr-dev-kit/ndk-hooks"
import { type NDKEvent, NDKKind } from "@nostr-dev-kit/ndk"
import { EventCard } from "@/components/nostr/event-card"
import { useCallback, useEffect, useRef, useState } from "react"

export default function Feed() {
  const [page, setPage] = useState(1)
  const loaderRef = useRef<HTMLDivElement>(null)
  const eventsPerPage = 10

  const { events } = useSubscribe({
    kinds: [NDKKind.Text],
    authors: ["fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52"],
  })

  // Sort events by created_at in descending order (newest first)
  const sortedEvents = [...events].sort((a, b) => {
    return (b.created_at || 0) - (a.created_at || 0)
  })

  // Calculate visible events based on current page
  const visibleEvents = sortedEvents.slice(0, page * eventsPerPage)

  // Memoize the intersection observer callback to prevent recreating it on every render
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && visibleEvents.length < sortedEvents.length) {
        setPage((prevPage) => prevPage + 1)
      }
    },
    [visibleEvents.length, sortedEvents.length],
  )

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, { threshold: 0.5 })

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current)
      }
      observer.disconnect()
    }
  }, [observerCallback])

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 py-4">
      {visibleEvents.map((event: NDKEvent) => (
        <EventCard key={event.id} event={event} />
      ))}

      {visibleEvents.length < sortedEvents.length && (
        <div ref={loaderRef} className="flex justify-center items-center p-4 text-zinc-500 dark:text-zinc-400">
          Loading more events...
        </div>
      )}
    </div>
  )
}
