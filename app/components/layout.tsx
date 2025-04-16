import type React from "react"
import { ComponentsSidebar } from "@/components/components-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ComponentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <ComponentsSidebar />
      <main className="flex-1 p-6">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        {children}
      </main>
    </div>
  )
}
