"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSubscribe, useNDKCurrentUser, useProfile, useNDK } from "@nostr-dev-kit/ndk-hooks"
import { type NDKEvent, NDKKind, zapInvoiceFromEvent, NDKZapper, type NDKNutzap } from "@nostr-dev-kit/ndk"
import { cn } from "@/lib/utils"
import { Zap, Copy, Check } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import UserAvatar from "@/components/user/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface ZapButtonProps {
  event: NDKEvent
  className?: string
  showAmount?: boolean
}

export function ZapButton({ event, className, showAmount = true }: ZapButtonProps) {
  const [totalAmount, setTotalAmount] = useState(0)
  const [isZapping, setIsZapping] = useState(false)
  const [zapAmount, setZapAmount] = useState(210) // Default 210 sats
  const [customAmount, setCustomAmount] = useState("")
  const [zapComment, setZapComment] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [paymentRequest, setPaymentRequest] = useState("")
  const [copied, setCopied] = useState(false)
  const [recipients, setRecipients] = useState<string[]>([])
  const currentUser = useNDKCurrentUser()
  const ndk = useNDK()

  // Get zap events (kind 9735)
  const { events: zaps } = useSubscribe({
    kinds: [NDKKind.Zap],
    ...event.filter(),
  })

  // Get nutzap events using the proper NDKKind.Nutzap enum
  const { events: nutzaps } = useSubscribe<NDKNutzap>(
    {
      kinds: [NDKKind.Nutzap],
      ...event.filter(),
    },
    { wrap: true },
  )

  // Calculate total zap amount
  useEffect(() => {
    let total = 0

    // Process regular zaps
    zaps.forEach((zapEvent) => {
      try {
        const zapInvoice = zapInvoiceFromEvent(zapEvent)
        if (zapInvoice && zapInvoice.amount) {
          // Convert msats to sats
          total += Math.floor(zapInvoice.amount / 1000)
        }
      } catch (error) {
        console.error("Error parsing zap invoice:", error)
      }
    })

    // Process nutzaps
    nutzaps.forEach((nutzap) => {
      if (nutzap.amount) {
        total += nutzap.amount
      }
    })

    setTotalAmount(total)
  }, [zaps, nutzaps])

  // Determine recipients from zap tags
  useEffect(() => {
    const zapTags = event.getMatchingTags("zap")
    const recipientPubkeys: string[] = []

    if (zapTags.length > 0) {
      // Extract recipient pubkeys from zap tags
      zapTags.forEach((tag) => {
        if (tag.length >= 2) {
          recipientPubkeys.push(tag[1])
        }
      })
    } else {
      // If no zap tags, the recipient is the event author
      recipientPubkeys.push(event.pubkey)
    }

    setRecipients(recipientPubkeys)
  }, [event])

  // Handle custom amount input
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "")
    setCustomAmount(value)
    if (value) {
      setZapAmount(Number.parseInt(value, 10))
    }
  }

  // Handle preset amount selection
  const handlePresetAmount = (amount: number) => {
    setZapAmount(amount)
    setCustomAmount(amount.toString())
  }

  // Copy payment request to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentRequest)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Handle zap
  const handleZap = async () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "You need to login to zap events",
        variant: "destructive",
      })
      return
    }

    if (!ndk) {
      toast({
        title: "NDK Not Available",
        description: "NDK instance is not available",
        variant: "destructive",
      })
      return
    }

    setIsZapping(true)

    try {
      // Make sure the event has an NDK instance
      if (!event.ndk) {
        event.ndk = ndk
      }

      // Convert sats to msats for NDKZapper
      const amountMsats = zapAmount * 1000

      // Set up the payment handler
      const lnPay = ({ pr }: { pr: string }) => {
        console.log("pr", pr)
        setPaymentRequest(pr)
        return new Promise<void>((resolve) => {
          // This promise doesn't resolve automatically
          // It will be handled by the user paying the invoice
          // or closing the modal
        })
      }

      // Create a zapper instance
      const zapper = new NDKZapper(event, amountMsats, "msat", {
        content: zapComment,
        ndk,
        lnPay,
      })

      // Initiate the zap
      zapper.zap()
      console.log("zap")

      // Note: We don't set isZapping to false here because
      // the user needs to complete the payment
    } catch (error: any) {
      console.error("Zap error:", error)
      toast({
        title: "Zap Failed",
        description: error.message || "An error occurred while trying to zap",
        variant: "destructive",
      })
      setIsZapping(false)
    }
  }

  // Close modal and reset state
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setPaymentRequest("")
    setZapComment("")
    setIsZapping(false)
  }

  // Predefined zap amounts
  const zapAmounts = [21, 210, 2100, 21000, 210000]

  // Generate QR code URL
  const qrCodeUrl = paymentRequest
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=lightning:${encodeURIComponent(paymentRequest)}`
    : ""

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "flex items-center gap-2 text-sm transition-colors",
          "text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300",
          className,
        )}
      >
        <Zap className="h-4 w-4" />
        {showAmount && totalAmount > 0 && <span className="font-medium">{totalAmount.toLocaleString()}</span>}
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Zap this note</DialogTitle>
            <DialogDescription>Send sats to the author as appreciation for their content.</DialogDescription>
          </DialogHeader>

          {!paymentRequest ? (
            <div className="space-y-4">
              {/* Recipients */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipients</label>
                <div className="flex flex-wrap gap-2">
                  {recipients.map((pubkey) => (
                    <RecipientAvatar key={pubkey} pubkey={pubkey} />
                  ))}
                </div>
              </div>

              {/* Amount selection */}
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">
                  Amount (sats)
                </label>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {zapAmounts.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant={amount === zapAmount ? "default" : "outline"}
                      onClick={() => handlePresetAmount(amount)}
                      className={amount === zapAmount ? "bg-amber-500 hover:bg-amber-600" : ""}
                    >
                      {amount >= 1000 ? `${amount / 1000}k` : amount}
                    </Button>
                  ))}
                </div>
                <Input
                  id="amount"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className="w-full"
                />
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label htmlFor="comment" className="text-sm font-medium">
                  Comment (optional)
                </label>
                <Textarea
                  id="comment"
                  placeholder="Add a comment to your zap..."
                  value={zapComment}
                  onChange={(e) => setZapComment(e.target.value)}
                  className="w-full"
                />
              </div>

              <DialogFooter className="sm:justify-end">
                <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isZapping}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleZap}
                  disabled={isZapping || zapAmount <= 0}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  {isZapping ? "Generating invoice..." : `Zap ${zapAmount} sats`}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={qrCodeUrl || "/placeholder.svg"} alt="Lightning Invoice QR Code" className="w-48 h-48" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Lightning Invoice</label>
                  <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-8 px-2 text-xs">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <p className="text-xs break-all">{paymentRequest}</p>
                </div>
              </div>

              <p className="text-sm text-center text-muted-foreground">
                Scan this QR code with your Lightning wallet to complete the payment
              </p>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal} className="w-full">
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// Helper component to display recipient avatars
function RecipientAvatar({ pubkey }: { pubkey: string }) {
  const profile = useProfile(pubkey)
  const displayName = profile?.displayName || profile?.name || pubkey.substring(0, 8) + "..."

  return (
    <div className="flex flex-col items-center">
      <UserAvatar pubkey={pubkey} size="sm" />
      <span className="text-xs mt-1 max-w-[60px] truncate">{displayName}</span>
    </div>
  )
}
