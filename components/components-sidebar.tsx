"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const componentTypes = [
  {
    name: "User Profile",
    kind: 0,
    href: "/components",
  },
  {
    name: "Text Notes",
    kind: 1,
    href: "/components/text-notes",
  },
  {
    name: "Reactions",
    kind: 7,
    href: "/components/reactions",
  },
  {
    name: "Zaps",
    kind: 9735,
    href: "/components/zaps",
  },
  {
    name: "Highlights",
    kind: 9802,
    href: "/components/highlights",
  },
  {
    name: "Articles",
    kind: 30023,
    href: "/components/articles",
  },
  {
    name: "Session Manager",
    kind: "utility",
    href: "/components/session-manager",
  },
]

export function ComponentsSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 border-r h-screen sticky top-0 overflow-y-auto p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Components</h2>
        <p className="text-sm text-muted-foreground">By NIP kind</p>
      </div>

      <nav className="space-y-1">
        {componentTypes.map((type) => (
          <Link
            key={type.href}
            href={type.href}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
              pathname === type.href ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
            )}
          >
            <span>{type.name}</span>
            <span className="text-xs text-muted-foreground">{type.kind}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
