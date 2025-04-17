"use client"

import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  scale: number
}

export function ZoomControls({ onZoomIn, onZoomOut, onReset, scale }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-lg shadow-md p-2 z-20">
      <Button variant="outline" size="icon" onClick={onZoomOut} disabled={scale <= 0.1} className="h-8 w-8">
        <ZoomOut className="h-4 w-4" />
        <span className="sr-only">Zoom out</span>
      </Button>

      <div className="text-xs font-mono px-2 min-w-[60px] text-center">{Math.round(scale * 100)}%</div>

      <Button variant="outline" size="icon" onClick={onZoomIn} disabled={scale >= 4} className="h-8 w-8">
        <ZoomIn className="h-4 w-4" />
        <span className="sr-only">Zoom in</span>
      </Button>

      <Button variant="outline" size="icon" onClick={onReset} className="h-8 w-8 ml-2">
        <RefreshCw className="h-4 w-4" />
        <span className="sr-only">Reset view</span>
      </Button>
    </div>
  )
}
