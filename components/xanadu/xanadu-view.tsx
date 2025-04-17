"use client"

import { useState, useEffect, useRef } from "react"
import { useNDK } from "@nostr-dev-kit/ndk-hooks"
import type { NDKEvent } from "@nostr-dev-kit/ndk"
import { D3Graph } from "./d3-graph"
import { EventLoader } from "@/lib/xanadu/event-loader"
import { useXanaduStore } from "@/lib/xanadu/store"
import { Loader2 } from "lucide-react"

interface XanaduViewProps {
  initialEvents: NDKEvent[]
}

export function XanaduView({ initialEvents }: XanaduViewProps) {
  const { ndk } = useNDK()
  const [isLoading, setIsLoading] = useState(true)
  const [eventLoader, setEventLoader] = useState<EventLoader | null>(null)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  const nodes = useXanaduStore((state) => state.nodes)
  const connections = useXanaduStore((state) => state.connections)

  // Initialize event loader and load initial events
  useEffect(() => {
    if (!ndk || !initialEvents || initialEvents.length === 0) return

    const loader = new EventLoader(ndk)
    setEventLoader(loader)

    const loadEvents = async () => {
      try {
        setIsLoading(true)
        setError(null)
        await loader.loadInitialEvents(initialEvents)
      } catch (err) {
        console.error("Error loading events:", err)
        setError("Failed to load events. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()

    // Cleanup function
    return () => {
      // Reset the store when unmounting
      useXanaduStore.getState().reset()
    }
  }, [ndk, initialEvents])

  // Update dimensions on resize
  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    updateDimensions()

    const observer = new ResizeObserver(updateDimensions)
    observer.observe(containerRef.current)

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
      observer.disconnect()
    }
  }, [])

  // Find all unique node IDs referenced in connections but not in our nodes collection
  const missingNodeIds = new Set<string>()
  connections.forEach((conn) => {
    if (!nodes.has(conn.source)) missingNodeIds.add(conn.source)
    if (!nodes.has(conn.target)) missingNodeIds.add(conn.target)
  })

  // If there's an error, show error message
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {isLoading && nodes.size < 5 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <span className="ml-2 text-zinc-500">Loading events...</span>
        </div>
      ) : (
        <>
          {nodes.size > 0 && <D3Graph width={dimensions.width} height={dimensions.height} />}

          {/* Stats display */}
          <div className="absolute top-4 left-4 bg-white dark:bg-zinc-800 rounded-lg shadow-md p-2 z-20 text-xs">
            <div>Events: {nodes.size}</div>
            <div>Connections: {connections.length}</div>
            <div>Missing Events: {missingNodeIds.size}</div>
            {isLoading && <div className="text-blue-500">Loading more events...</div>}
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-zinc-800 rounded-lg shadow-md p-2 z-20 text-xs">
            <div className="font-medium mb-1">Legend:</div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span>Selected Event</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span>Related Event</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600 mr-2"></div>
              <span>Regular Event</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-zinc-400 border border-dashed border-zinc-500 mr-2"></div>
              <span>Missing Event</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
