import type { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk"
import { useXanaduStore, type EventNode } from "./store"
import type NDK from "@/lib/nostr/ndk"

export class EventLoader {
  private ndk: NDK
  private processQueue: string[] = []
  private isProcessing = false
  private maxDepth: number
  private missingEventIds: Set<string> = new Set()

  constructor(ndk: NDK, maxDepth = 5) {
    this.ndk = ndk
    this.maxDepth = maxDepth
  }

  public async loadInitialEvents(events: NDKEvent[]) {
    const store = useXanaduStore.getState()

    // Reset the store
    store.reset()

    // Add initial events to the store
    events.forEach((event) => {
      store.addNode(event, 0)
      this.processQueue.push(event.id)
    })

    // Start processing the queue
    this.processNextBatch()
  }

  private async processNextBatch() {
    if (this.isProcessing || this.processQueue.length === 0) return

    this.isProcessing = true
    const store = useXanaduStore.getState()

    // Process up to 10 events at a time
    const batchSize = Math.min(10, this.processQueue.length)
    const batch = this.processQueue.splice(0, batchSize)

    for (const eventId of batch) {
      const node = store.nodes.get(eventId)
      if (!node || node.isProcessed || node.depth >= this.maxDepth) continue

      try {
        await this.processEvent(node)
      } catch (error) {
        console.error(`Error processing event ${eventId}:`, error)
      }

      store.markNodeAsProcessed(eventId)
    }

    this.isProcessing = false

    // Try to fetch missing events
    if (this.missingEventIds.size > 0) {
      this.tryFetchMissingEvents()
    }

    // Continue processing if there are more events in the queue
    if (this.processQueue.length > 0) {
      setTimeout(() => this.processNextBatch(), 100)
    }
  }

  private async tryFetchMissingEvents() {
    const store = useXanaduStore.getState()
    const missingIds = Array.from(this.missingEventIds)

    // Only try to fetch a batch of missing events at a time
    const batchSize = Math.min(20, missingIds.length)
    const batch = missingIds.slice(0, batchSize)

    // Remove these from the set so we don't try again
    batch.forEach((id) => this.missingEventIds.delete(id))

    try {
      const events = await this.fetchEvents({ ids: batch })

      // Add any found events to the store
      events.forEach((event) => {
        // Use a higher depth for these events since they were missing
        store.addNode(event, this.maxDepth - 1)
        this.processQueue.push(event.id)
      })

      console.log(`Fetched ${events.length} out of ${batch.length} missing events`)
    } catch (error) {
      console.error("Error fetching missing events:", error)
    }
  }

  private async processEvent(node: EventNode) {
    const store = useXanaduStore.getState()
    const event = node.event
    const nextDepth = node.depth + 1

    // Skip if we've reached the maximum depth
    if (nextDepth > this.maxDepth) return

    // 1. Process outgoing connections (e and q tags in the event)
    await this.processOutgoingConnections(event, nextDepth)

    // 2. Process incoming connections (events that reference this event)
    await this.processIncomingConnections(event, nextDepth)

    // 3. Check for missing events in connections
    this.checkForMissingEvents()
  }

  private checkForMissingEvents() {
    const store = useXanaduStore.getState()
    const nodeIds = new Set(Array.from(store.nodes.keys()))

    // Find all node IDs referenced in connections but not in our nodes collection
    store.connections.forEach((conn) => {
      if (!nodeIds.has(conn.source)) this.missingEventIds.add(conn.source)
      if (!nodeIds.has(conn.target)) this.missingEventIds.add(conn.target)
    })
  }

  // Update the processOutgoingConnections method to check for root markers and single e tags
  private async processOutgoingConnections(event: NDKEvent, depth: number) {
    const store = useXanaduStore.getState()

    // Get all e tags
    const eTags = event.getMatchingTags("e")

    // Process reply tags (e tags with reply marker)
    const replyTags = eTags.filter((tag) => tag.length >= 4 && tag[3] === "reply")

    // Process root tags (e tags with root marker)
    const rootTags = eTags.filter((tag) => tag.length >= 4 && tag[3] === "root")

    // If there are no reply or root tags but there's exactly one e tag, use that as a reply
    const singleETags = replyTags.length === 0 && rootTags.length === 0 && eTags.length === 1 ? eTags : []

    // Combine all tags that should be treated as replies
    const allReplyTags = [...replyTags, ...rootTags, ...singleETags]
    const replyIds = allReplyTags.map((tag) => tag[1]).filter(Boolean)

    // Process other e tags as references, not replies
    const referenceIds = eTags
      .filter((tag) => !allReplyTags.includes(tag))
      .map((tag) => tag[1])
      .filter(Boolean)

    if (replyIds.length > 0) {
      // Add connections even if we don't have the events yet
      replyIds.forEach((replyId) => {
        store.addConnection(event.id, replyId, "reply")
        // Track missing events
        if (!store.hasNode(replyId)) {
          this.missingEventIds.add(replyId)
        }
      })

      const replyEvents = await this.fetchEvents({ ids: replyIds })

      replyEvents.forEach((replyEvent) => {
        store.addNode(replyEvent, depth)
        this.processQueue.push(replyEvent.id)
      })
    }

    // Process quote tags (q tags)
    const quoteTags = event.getMatchingTags("q")
    const quoteIds = quoteTags.map((tag) => tag[1]).filter(Boolean)

    if (quoteIds.length > 0) {
      // Add connections even if we don't have the events yet
      quoteIds.forEach((quoteId) => {
        store.addConnection(event.id, quoteId, "quote")
        // Track missing events
        if (!store.hasNode(quoteId)) {
          this.missingEventIds.add(quoteId)
        }
      })

      const quoteEvents = await this.fetchEvents({ ids: quoteIds })

      quoteEvents.forEach((quoteEvent) => {
        store.addNode(quoteEvent, depth)
        this.processQueue.push(quoteEvent.id)
      })
    }
  }

  // Update the processIncomingConnections method to check for root markers and single e tags
  private async processIncomingConnections(event: NDKEvent, depth: number) {
    const store = useXanaduStore.getState()

    // Fetch events that might reference this event
    const referencingFilter: NDKFilter = { kinds: [1], "#e": [event.id] }
    const referencingEvents = await this.fetchEvents(referencingFilter)

    // Filter for actual replies by checking the e tags
    referencingEvents.forEach((referencingEvent) => {
      const eTags = referencingEvent.getMatchingTags("e")

      // Check for reply marker
      const hasReplyMarker = eTags.some((tag) => tag[1] === event.id && tag.length >= 4 && tag[3] === "reply")

      // Check for root marker
      const hasRootMarker = eTags.some((tag) => tag[1] === event.id && tag.length >= 4 && tag[3] === "root")

      // Check if it's the only e tag
      const isSingleETag = eTags.length === 1 && eTags[0][1] === event.id

      // Consider it a reply if it has a reply marker, root marker, or is the only e tag
      const isReply = hasReplyMarker || hasRootMarker || isSingleETag

      if (isReply) {
        store.addNode(referencingEvent, depth)
        store.addConnection(referencingEvent.id, event.id, "reply")
        this.processQueue.push(referencingEvent.id)
      }
    })

    // Fetch events that quote this event
    const quoteFilter: NDKFilter = { kinds: [1], "#q": [event.id] }
    const quoteEvents = await this.fetchEvents(quoteFilter)

    quoteEvents.forEach((quoteEvent) => {
      store.addNode(quoteEvent, depth)
      store.addConnection(quoteEvent.id, event.id, "quote")
      this.processQueue.push(quoteEvent.id)
    })
  }

  private async fetchEvents(filter: NDKFilter): Promise<NDKEvent[]> {
    try {
      const events = await this.ndk.fetchEvents([filter])
      return Array.from(events)
    } catch (error) {
      console.error("Error fetching events:", error)
      return []
    }
  }
}
