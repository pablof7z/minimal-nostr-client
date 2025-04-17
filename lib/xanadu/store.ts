import { create } from "zustand"
import type { NDKEvent } from "@nostr-dev-kit/ndk"

export interface EventNode {
  id: string
  event: NDKEvent
  x?: number
  y?: number
  vx?: number
  vy?: number
  isProcessed: boolean
  depth: number
}

export interface EventConnection {
  source: string
  target: string
  type: "reply" | "quote"
}

interface XanaduState {
  nodes: Map<string, EventNode>
  connections: EventConnection[]
  selectedNodeId: string | null
  openCardIds: Set<string>
  maxNodes: number
  maxDepth: number

  // Actions
  addNode: (event: NDKEvent, depth: number) => void
  addConnection: (source: string, target: string, type: "reply" | "quote") => void
  setNodePosition: (id: string, x: number, y: number) => void
  markNodeAsProcessed: (id: string) => void
  selectNode: (id: string | null) => void
  toggleOpenCard: (id: string) => void
  hasNode: (id: string) => boolean
  hasConnection: (source: string, target: string, type: "reply" | "quote") => boolean
  getUnprocessedNodes: () => EventNode[]
  reset: () => void
}

export const useXanaduStore = create<XanaduState>((set, get) => ({
  nodes: new Map(),
  connections: [],
  selectedNodeId: null,
  openCardIds: new Set(),
  maxNodes: 1000,
  maxDepth: 5,

  addNode: (event: NDKEvent, depth: number) => {
    const { nodes, maxNodes } = get()

    // Don't add if we've reached the maximum number of nodes
    if (nodes.size >= maxNodes) return

    // Don't add if the node already exists
    if (nodes.has(event.id)) return

    set((state) => {
      const newNodes = new Map(state.nodes)
      newNodes.set(event.id, {
        id: event.id,
        event,
        isProcessed: false,
        depth,
      })
      return { nodes: newNodes }
    })
  },

  addConnection: (source: string, target: string, type: "reply" | "quote") => {
    // Don't add if the connection already exists
    if (get().hasConnection(source, target, type)) return

    // Allow connections even if nodes don't exist yet
    set((state) => ({
      connections: [...state.connections, { source, target, type }],
    }))
  },

  setNodePosition: (id: string, x: number, y: number) => {
    set((state) => {
      const newNodes = new Map(state.nodes)
      const node = newNodes.get(id)
      if (node) {
        newNodes.set(id, { ...node, x, y })
      }
      return { nodes: newNodes }
    })
  },

  markNodeAsProcessed: (id: string) => {
    set((state) => {
      const newNodes = new Map(state.nodes)
      const node = newNodes.get(id)
      if (node) {
        newNodes.set(id, { ...node, isProcessed: true })
      }
      return { nodes: newNodes }
    })
  },

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id })
  },

  toggleOpenCard: (id: string) => {
    set((state) => {
      const newOpenCardIds = new Set(state.openCardIds)
      if (newOpenCardIds.has(id)) {
        newOpenCardIds.delete(id)
      } else {
        newOpenCardIds.add(id)
      }
      return { openCardIds: newOpenCardIds }
    })
  },

  hasNode: (id: string) => {
    return get().nodes.has(id)
  },

  hasConnection: (source: string, target: string, type: "reply" | "quote") => {
    return get().connections.some((conn) => conn.source === source && conn.target === target && conn.type === type)
  },

  getUnprocessedNodes: () => {
    const { nodes } = get()
    return Array.from(nodes.values()).filter((node) => !node.isProcessed)
  },

  reset: () => {
    set({
      nodes: new Map(),
      connections: [],
      selectedNodeId: null,
      openCardIds: new Set(),
    })
  },
}))
