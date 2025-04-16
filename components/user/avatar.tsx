"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useProfile } from "@nostr-dev-kit/ndk-hooks"

interface UserAvatarProps {
  pubkey: string
  size?: "sm" | "default" | "lg"
}

export default function UserAvatar({ pubkey, size = "default" }: UserAvatarProps) {
  const profile = useProfile(pubkey)

  // Determine size class
  const sizeClass = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-16 w-16",
  }[size]

  // Get initials from profile or use first characters of pubkey
  const initials = profile?.name ? profile.name.substring(0, 2).toUpperCase() : pubkey.substring(0, 2).toUpperCase()

  return (
    <Avatar className={sizeClass}>
      <AvatarImage src={profile?.picture || "/placeholder.svg"} alt={profile?.name || pubkey.substring(0, 8)} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}
