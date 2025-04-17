"use client"

import { Badge } from "@/components/ui/badge"
import { EventCard } from "@/components/nostr/event-card"
import { ZapButton } from "@/components/nostr/zap-button"
import { useSubscribe } from "@nostr-dev-kit/ndk-hooks"
import { CodeBlock } from "@/components/code-block"

export default function ZapsPage() {
  // Fetch a specific event by ID to demonstrate zaps
  const { events } = useSubscribe({
    ids: ["e3ae0dda313b8d02576fe54461b605965aa3640ff2ede6734acdf96806c32815"],
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Zaps</h1>
        <p className="text-muted-foreground mb-8">Components for displaying and sending kind 9735 zaps</p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold">Zap Button</h2>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
              kind 9735
            </Badge>
          </div>

          <div className="p-6 border rounded-lg max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Enhanced Zap Button</h3>
            {events.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Click the Zap button to open the zapping modal with comment support and QR code payment:
                </p>
                <div className="p-4 border rounded-lg flex items-center justify-between">
                  <span>Zap this event</span>
                  <ZapButton event={events[0]} />
                </div>

                <p className="text-sm text-muted-foreground mb-2 mt-6">ZapButton integrated in an EventCard:</p>
                <EventCard event={events[0]} />
              </div>
            ) : (
              <p className="text-muted-foreground">Loading event...</p>
            )}

            <div className="mt-8 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Features</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Shows total zapped amount</li>
                <li>Opens a modal with recipient information</li>
                <li>Allows custom zap amounts with presets (21, 210, 2100, 21k, 210k sats)</li>
                <li>Supports adding comments to zaps</li>
                <li>Generates QR codes for Lightning payment</li>
                <li>Handles multiple recipients via zap tags</li>
              </ul>

              <h4 className="text-sm font-semibold mb-2 mt-6">Usage</h4>
              <CodeBlock code={`<ZapButton event={event} />`} language="tsx" />
              <p className="mt-2 text-sm text-muted-foreground">
                Basic usage with default settings. Shows the total amount of sats zapped to the event.
              </p>

              <CodeBlock code={`<ZapButton event={event} showAmount={false} />`} language="tsx" className="mt-4" />
              <p className="mt-2 text-sm text-muted-foreground">Hide the zap amount and only show the zap icon.</p>

              <h4 className="text-sm font-semibold mb-2 mt-6">How it works</h4>
              <p className="text-sm text-muted-foreground">
                The ZapButton component fetches both traditional zaps (kind 9735) and nutzaps (kind 9774) for an event.
                It parses the zap invoices to calculate the total amount zapped in sats.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                When a user clicks the button, a modal opens allowing them to select an amount, add a comment, and see
                the recipients. The component uses NDKZapper to generate a Lightning invoice and displays a QR code for
                payment.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                The component also identifies recipients by parsing zap tags, falling back to the event author if no zap
                tags are present.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
