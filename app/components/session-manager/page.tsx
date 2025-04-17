"use client"

import { Badge } from "@/components/ui/badge"
import { SessionManager } from "@/components/session-manager"
import { CodeBlock } from "@/components/code-block"

export default function SessionManagerPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Session Manager</h1>
        <p className="text-muted-foreground mb-8">Manage multiple Nostr identities and sessions</p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold">Session Manager</h2>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              utility
            </Badge>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Session Management</h3>
            <SessionManager />

            <div className="mt-8 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Usage</h4>
              <CodeBlock code={`<SessionManager />`} language="tsx" />
              <p className="mt-2 text-sm text-muted-foreground">
                The SessionManager component provides a complete interface for managing Nostr identities and sessions.
                It allows users to:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>View and switch between active sessions</li>
                <li>Log out individual sessions</li>
                <li>
                  Add new accounts through multiple methods:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Read-only (via NIP-05 or npub)</li>
                    <li>Create new accounts with generated private keys</li>
                    <li>Connect with browser extensions (NIP-07)</li>
                    <li>Connect with Nostr Bunkers (NIP-46)</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
