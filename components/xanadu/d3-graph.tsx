"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import * as d3 from "d3"
import { useXanaduStore } from "@/lib/xanadu/store"
import { EventNodeCard } from "./event-node-card"
import { useProfile } from "@nostr-dev-kit/ndk-hooks"
import { ZoomControls } from "./zoom-controls"

interface D3GraphProps {
  width: number
  height: number
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string
  x: number
  y: number
  depth: number
  hasEvent: boolean
  pubkey?: string
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node
  target: string | D3Node
  type: "reply" | "quote"
}

// Helper component to get profile picture
function NodeAvatar({ pubkey, nodeId }: { pubkey: string; nodeId: string }) {
  const profile = useProfile(pubkey)
  const [hasError, setHasError] = useState(false)
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!mounted || hasError || !profile?.picture) return

    try {
      const avatarEl = document.getElementById(`avatar-${nodeId}`)
      if (!avatarEl) return

      const existingImage = avatarEl.querySelector("image")
      if (existingImage) return // Don't add multiple images

      const image = document.createElement("image")
      image.setAttribute("href", profile.picture)
      image.setAttribute("width", "24")
      image.setAttribute("height", "24")
      image.setAttribute("clip-path", `url(#clip-${nodeId})`)
      image.setAttribute("x", "-12")
      image.setAttribute("y", "-12")

      // Add error handling
      image.onerror = () => {
        if (mounted) {
          setHasError(true)
          image.remove()
          // Show the fallback circle
          const fallbackEl = document.getElementById(`fallback-${nodeId}`)
          if (fallbackEl) {
            fallbackEl.style.display = "block"
          }
        }
      }

      avatarEl.appendChild(image)
    } catch (error) {
      console.error("Error adding avatar image:", error)
      setHasError(true)
    }
  }, [profile, nodeId, mounted, hasError])

  return null
}

export function D3Graph({ width, height }: D3GraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement | null>(null)
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity)
  const [scale, setScale] = useState(1)
  const [mounted, setMounted] = useState(false)

  // Add these refs at the top of the component, after the svgRef
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  // Subscribe to the nodes Map instance, then derive array locally to stabilize getSnapshot
  const nodeMap = useXanaduStore((state) => state.nodes)
  const nodes = useMemo(() => Array.from(nodeMap.values()), [nodeMap])
  const connections = useXanaduStore((state) => state.connections)
  const selectedNodeId = useXanaduStore((state) => state.selectedNodeId)
  const openCardIds = useXanaduStore((state) => state.openCardIds)
  const setNodePosition = useXanaduStore((state) => state.setNodePosition)
  const selectNode = useXanaduStore((state) => state.selectNode)
  const toggleOpenCard = useXanaduStore((state) => state.toggleOpenCard)

  // Set mounted state
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Convert store data to D3 format
  const d3Nodes: D3Node[] = nodes.map((node) => ({
    id: node.id,
    x: node.x ?? Math.random() * width,
    y: node.y ?? Math.random() * height,
    depth: node.depth,
    hasEvent: true,
    pubkey: node.event.pubkey,
  }))

  // Create a set of node IDs for quick lookup
  const nodeIdSet = new Set(d3Nodes.map((node) => node.id))

  // Find all unique node IDs referenced in connections but not in our nodes collection
  const missingNodeIds = new Set<string>()
  connections.forEach((conn) => {
    if (!nodeIdSet.has(conn.source)) missingNodeIds.add(conn.source)
    if (!nodeIdSet.has(conn.target)) missingNodeIds.add(conn.target)
  })

  // Create placeholder nodes for missing events
  const placeholderNodes: D3Node[] = Array.from(missingNodeIds).map((id) => ({
    id,
    x: Math.random() * width,
    y: Math.random() * height,
    depth: 999, // High depth value for placeholder nodes
    hasEvent: false,
  }))

  // Combine real and placeholder nodes
  const allD3Nodes = [...d3Nodes, ...placeholderNodes]

  // All connections are now valid since we have placeholder nodes
  const d3Links: D3Link[] = connections.map((conn) => ({
    source: conn.source,
    target: conn.target,
    type: conn.type,
  }))

  // Initialize zoom behavior
  useEffect(() => {
    if (!svgRef.current || !mounted) return

    // Create zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        if (gRef.current) {
          d3.select(gRef.current).attr("transform", event.transform.toString())
          setTransform(event.transform)
          setScale(event.transform.k)
        }
      })

    // Apply zoom behavior to SVG
    d3.select(svgRef.current).call(zoom)

    // Store zoom behavior in ref
    zoomRef.current = zoom

    // Initial center
    const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8)
    d3.select(svgRef.current).call(zoom.transform, initialTransform)

    return () => {
      // Cleanup
      if (svgRef.current) {
        d3.select(svgRef.current).on(".zoom", null)
      }
    }
  }, [width, height, mounted])

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.2)
  }, [])

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.8)
  }, [])

  const handleResetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8))
  }, [width, height])

  // Update graph when data changes
  useEffect(() => {
    if (!svgRef.current || !mounted || allD3Nodes.length === 0) return

    // Clear previous SVG content but keep the zoom behavior
    const svg = d3.select(svgRef.current)
    svg.selectAll("g.main-group").remove()

    // Create main group for all content
    const g = svg.append("g").attr("class", "main-group")

    // Store the group element reference
    gRef.current = g.node()

    // Apply current transform if it exists
    if (transform) {
      g.attr("transform", transform.toString())
    }

    try {
      // Create the simulation or update existing one
      if (!simulationRef.current) {
        simulationRef.current = d3
          .forceSimulation<D3Node, D3Link>()
          .force(
            "link",
            d3
              .forceLink<D3Node, D3Link>()
              .id((d) => d.id)
              .distance((link) => (link.type === "reply" ? 100 : 150))
              .strength(0.5),
          )
          .force("charge", d3.forceManyBody().strength(-100))
          .force("center", d3.forceCenter(0, 0))
          .force("x", d3.forceX(0).strength(0.05))
          .force("y", d3.forceY(0).strength(0.05))
          .force("collision", d3.forceCollide().radius(30))
      }

      // Update the simulation with new nodes and links
      simulationRef.current.nodes(allD3Nodes)
      simulationRef.current.force(
        "link",
        d3
          .forceLink<D3Node, D3Link>(d3Links)
          .id((d) => d.id)
          .distance((link) => (link.type === "reply" ? 100 : 150))
          .strength(0.5),
      )

      // Restart the simulation with a low alpha to avoid dramatic changes
      simulationRef.current.alpha(0.3).restart()
      // After layout settles, update store positions once
      simulationRef.current.on("end", () => {
        // Commit final node positions to the store
        d3Nodes.forEach((d) => {
          if (d.hasEvent && d.x !== undefined && d.y !== undefined) {
            setNodePosition(d.id, d.x, d.y)
          }
        })
      })

      // Draw links
      const link = g
        .append("g")
        .attr("stroke-opacity", 0.6)
        .selectAll("path")
        .data(d3Links)
        .join("path")
        .attr("stroke", (d) => (d.type === "reply" ? "#3b82f6" : "#10b981"))
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", (d) => (d.type === "quote" ? "5,5" : ""))
        .attr("marker-end", (d) => `url(#arrow-${d.type})`)
        .attr("fill", "none")

      // Add arrow markers
      svg
        .append("defs")
        .selectAll("marker")
        .data(["reply", "quote"])
        .join("marker")
        .attr("id", (d) => `arrow-${d}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", (d) => (d === "reply" ? "#3b82f6" : "#10b981"))
        .attr("d", "M0,-5L10,0L0,5")

      // Add clip paths for circular avatars
      const defs = svg.select("defs")

      defs
        .selectAll("clipPath")
        .data(allD3Nodes)
        .join("clipPath")
        .attr("id", (d) => `clip-${d.id}`)
        .append("circle")
        .attr("r", 12)

      // Draw nodes with avatars
      const nodeGroup = g
        .append("g")
        .selectAll("g")
        .data(allD3Nodes)
        .join("g")
        .attr("transform", (d) => `translate(${d.x},${d.y})`)
        .attr("id", (d) => `node-${d.id}`)
        .on("click", (event, d) => {
          event.stopPropagation()
          // Only allow selection of nodes with events
          if (d.hasEvent) {
            selectNode(d.id === selectedNodeId ? null : d.id)
            toggleOpenCard(d.id)
          }
        })
        .call(
          d3
            .drag<SVGGElement, D3Node>()
            .on("start", (event, d) => {
              if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0.3).restart()
              d.fx = d.x
              d.fy = d.y
            })
            .on("drag", (event, d) => {
              d.fx = event.x
              d.fy = event.y
            })
            .on("end", (event, d) => {
              if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0)
              d.fx = null
              d.fy = null
            }),
        )

      // Add background circles for all nodes
      nodeGroup
        .append("circle")
        .attr("r", 12)
        .attr("id", (d) => `fallback-${d.id}`)
        .attr("fill", (d) => {
          // If it's a placeholder node, use a distinct style
          if (!d.hasEvent) return "#9ca3af" // Gray for placeholder nodes

          if (d.id === selectedNodeId) return "#3b82f6"
          const isRelated = connections.some(
            (conn) =>
              (conn.source === selectedNodeId && conn.target === d.id) ||
              (conn.target === selectedNodeId && conn.source === d.id),
          )
          return isRelated ? "#10b981" : "#d1d5db"
        })
        .attr("stroke", (d) => (d.hasEvent ? "#fff" : "#9ca3af"))
        .attr("stroke-width", (d) => (d.hasEvent ? 1.5 : 1))
        .attr("stroke-dasharray", (d) => (d.hasEvent ? "" : "2,2")) // Dashed outline for placeholder nodes

      // Add avatar container for nodes with events
      nodeGroup
        .filter((d) => d.hasEvent && d.pubkey)
        .append("g")
        .attr("id", (d) => `avatar-${d.id}`)

      // Add labels for placeholder nodes
      nodeGroup
        .filter((d) => !d.hasEvent)
        .append("text")
        .attr("y", 24) // Position below the node
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#9ca3af")
        .attr("class", "cursor-pointer")
        .text((d) => d.id.substring(0, 8) + "...")
        .on("click", (event, d) => {
          event.stopPropagation()
          window.open(`https://njump.me/${d.id}`, "_blank")
        })

      // Update positions on tick
      simulationRef.current?.on("tick", () => {
        if (!mounted) return

        link.attr("d", (d) => {
          const sourceNode = typeof d.source === "string" ? allD3Nodes.find((n) => n.id === d.source) : d.source
          const targetNode = typeof d.target === "string" ? allD3Nodes.find((n) => n.id === d.target) : d.target

          if (!sourceNode || !targetNode) return ""

          // For curved paths
          const dx = targetNode.x - sourceNode.x
          const dy = targetNode.y - sourceNode.y
          const dr = Math.sqrt(dx * dx + dy * dy)

          // Make quotes curved, replies straight
          if (d.type === "quote") {
            return `M${sourceNode.x},${sourceNode.y}A${dr},${dr} 0 0,1 ${targetNode.x},${targetNode.y}`
          } else {
            return `M${sourceNode.x},${sourceNode.y}L${targetNode.x},${targetNode.y}`
          }
        })

        nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`)

      })
    } catch (error) {
      console.error("Error setting up D3 graph:", error)
    }

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop()
      }
    }
  }, [nodes.length, connections.length, selectedNodeId, width, height, mounted, transform])

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} width={width} height={height} className="bg-white dark:bg-zinc-900">
        {/* SVG content will be added by D3 */}
      </svg>

      {/* Render NodeAvatar components for each node with a pubkey */}
      {mounted &&
        d3Nodes
          .filter((node) => node.pubkey)
          .map((node) => <NodeAvatar key={node.id} pubkey={node.pubkey!} nodeId={node.id} />)}

      {/* Render event cards for open nodes */}
      {mounted &&
        Array.from(openCardIds).map((id) => {
          const node = nodes.find((n) => n.id === id)
          if (!node) return null

          // Calculate position based on transform
          const x = transform.applyX(node.x ?? 0)
          const y = transform.applyY(node.y ?? 0)

          return (
            <EventNodeCard
              key={id}
              event={node.event}
              position={{ x, y }}
              isSelected={id === selectedNodeId}
              isRelated={connections.some(
                (conn) =>
                  (conn.source === selectedNodeId && conn.target === id) ||
                  (conn.target === selectedNodeId && conn.source === id),
              )}
              onClose={() => toggleOpenCard(id)}
            />
          )
        })}

      {/* Zoom controls */}
      <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReset={handleResetZoom} scale={scale} />
    </div>
  )
}
