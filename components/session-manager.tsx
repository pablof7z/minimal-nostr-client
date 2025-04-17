"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  useAvailableSessions,
  useNDKSessionSwitch,
  useNDKSessionLogout,
  useNDKSessionLogin,
  useNDKCurrentUser,
  useNDK,
  useProfile,
} from "@nostr-dev-kit/ndk-hooks"
import {
  NDKPrivateKeySigner,
  NDKNip07Signer,
  NDKNip46Signer,
  NDKEvent,
  type NDKUser,
  type NDKUserProfile,
} from "@nostr-dev-kit/ndk"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { LogIn, Shield, User, X, Check } from "lucide-react"
import UserAvatar from "@/components/user/avatar"
import { cn } from "@/lib/utils"

export function SessionManager() {
  const { availablePubkeys } = useAvailableSessions()
  const switchSession = useNDKSessionSwitch()
  const logout = useNDKSessionLogout()
  const login = useNDKSessionLogin()
  const currentUser = useNDKCurrentUser()
  const { ndk } = useNDK()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Read-only login state
  const [readOnlyIdentifier, setReadOnlyIdentifier] = useState("")

  // New account state
  const [newUsername, setNewUsername] = useState("")
  const [newDisplayName, setNewDisplayName] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState(0)

  // NIP-46 state
  const [bunkerUrl, setBunkerUrl] = useState("")

  // Check if NIP-07 is available
  const [hasNip07, setHasNip07] = useState(false)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasNip07(!!window.nostr)
    }
  }, [])

  // Avatar options
  const avatarOptions = [
    "/placeholder.svg?height=48&width=48",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=5",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=6",
  ]

  // Add a new state for the private key input
  const [privateKey, setPrivateKey] = useState("")
  const [showPrivateKey, setShowPrivateKey] = useState(false)

  // Handle username input - filter out spaces
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove spaces from input
    const value = e.target.value.replace(/\s+/g, "")
    setNewUsername(value)
  }

  // Handle read-only login
  const handleReadOnlyLogin = async () => {
    if (!readOnlyIdentifier.trim() || !ndk) return

    setIsLoggingIn(true)
    try {
      let user: NDKUser | undefined

      if (readOnlyIdentifier.startsWith("npub1")) {
        // Handle npub
        user = ndk.getUser({ npub: readOnlyIdentifier })
      } else {
        // Handle NIP-05
        user = await ndk.getUserFromNip05(readOnlyIdentifier)
      }

      if (!user) {
        throw new Error("Could not find user")
      }

      await login(user)
      toast({
        title: "Read-Only Login Successful",
        description: `Logged in as ${readOnlyIdentifier}`,
      })
      setShowLoginModal(false)
      setReadOnlyIdentifier("")
    } catch (error: any) {
      console.error("Read-only login error:", error)
      toast({
        title: "Login Failed",
        description: error.message || "Could not login with the provided identifier",
        variant: "destructive",
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Handle new account creation
  const handleCreateAccount = async () => {
    if (!newUsername.trim() || !newDisplayName.trim() || !ndk) return

    setIsLoggingIn(true)
    try {
      // Generate new private key
      const newSigner = NDKPrivateKeySigner.generate()
      await newSigner.blockUntilReady()

      // Create profile event
      const event = new NDKEvent(ndk)
      event.kind = 0

      // Create profile object
      const profile: NDKUserProfile = {
        name: newUsername,
        displayName: newDisplayName,
        picture: avatarOptions[selectedAvatar],
      }

      // Serialize profile to JSON
      event.content = JSON.stringify(profile)

      // Sign and publish
      await event.sign(newSigner)
      await event.publish()

      // Login with the new signer
      await login(newSigner)

      toast({
        title: "Account Created",
        description: `New account created as ${newDisplayName}`,
      })
      setShowLoginModal(false)
      setNewUsername("")
      setNewDisplayName("")
      setSelectedAvatar(0)
    } catch (error: any) {
      console.error("Account creation error:", error)
      toast({
        title: "Account Creation Failed",
        description: error.message || "Could not create a new account",
        variant: "destructive",
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Handle NIP-07 login
  const handleNip07Login = async () => {
    if (!hasNip07 || !ndk) return

    setIsLoggingIn(true)
    try {
      const signer = new NDKNip07Signer()
      await signer.blockUntilReady()

      await login(signer)

      toast({
        title: "NIP-07 Login Successful",
        description: "Successfully logged in with browser extension",
      })
      setShowLoginModal(false)
    } catch (error: any) {
      console.error("NIP-07 login error:", error)
      toast({
        title: "Login Failed",
        description: error.message || "Could not login with browser extension",
        variant: "destructive",
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Handle NIP-46 login
  const handleNip46Login = async () => {
    if (!bunkerUrl.trim() || !ndk) return

    setIsLoggingIn(true)
    try {
      // Validate bunker URL
      if (!bunkerUrl.startsWith("bunker://")) {
        throw new Error("Invalid bunker URL. Must start with bunker://")
      }

      const signer = new NDKNip46Signer(ndk, bunkerUrl)
      await signer.blockUntilReady()

      await login(signer)

      toast({
        title: "NIP-46 Login Successful",
        description: "Successfully logged in with bunker",
      })
      setShowLoginModal(false)
      setBunkerUrl("")
    } catch (error: any) {
      console.error("NIP-46 login error:", error)
      toast({
        title: "Login Failed",
        description: error.message || "Could not login with bunker",
        variant: "destructive",
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Add a new handler for private key login
  const handlePrivateKeyLogin = async () => {
    if (!privateKey.trim() || !ndk) return

    setIsLoggingIn(true)
    try {
      // Validate that it's an nsec
      if (!privateKey.startsWith("nsec1")) {
        throw new Error("Invalid private key format. Must start with nsec1")
      }

      const signer = new NDKPrivateKeySigner(privateKey)
      await signer.blockUntilReady()

      await login(signer)

      toast({
        title: "Private Key Login Successful",
        description: "Successfully logged in with private key",
      })
      setShowLoginModal(false)
      setPrivateKey("")
      setShowPrivateKey(false)
    } catch (error: any) {
      console.error("Private key login error:", error)
      toast({
        title: "Login Failed",
        description: error.message || "Could not login with the provided private key",
        variant: "destructive",
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Handle session switch
  const handleSwitchSession = (pubkey: string) => {
    switchSession(pubkey)
    toast({
      title: "Session Switched",
      description: `Switched to ${pubkey.substring(0, 8)}...`,
    })
  }

  // Handle session logout
  const handleLogout = (pubkey: string) => {
    logout(pubkey)
    toast({
      title: "Logged Out",
      description: `Session ${pubkey.substring(0, 8)}... has been logged out`,
    })
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Session Manager</span>
            <Button variant="outline" size="sm" onClick={() => setShowLoginModal(true)}>
              <LogIn className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </CardTitle>
          <CardDescription>Manage your Nostr identities and sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Active Sessions</h3>
            {availablePubkeys.length > 0 ? (
              <div className="space-y-2">
                {availablePubkeys.map((pubkey) => (
                  <SessionItem
                    key={pubkey}
                    pubkey={pubkey}
                    isActive={currentUser?.pubkey === pubkey}
                    onSwitch={handleSwitchSession}
                    onLogout={handleLogout}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No active sessions</p>
                <p className="text-sm">Add an account to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Add Account</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLoginModal(false)}
                  className="h-8 w-8 p-0"
                  disabled={isLoggingIn}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </CardTitle>
              <CardDescription>Choose a method to add a Nostr account</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="read-only">
                <TabsList className="flex w-full mb-4">
                  <TabsTrigger value="read-only">Read-Only</TabsTrigger>
                  <TabsTrigger value="new-account">New Account</TabsTrigger>
                  <TabsTrigger value="private-key">Private Key</TabsTrigger>
                  {hasNip07 && <TabsTrigger value="nip07">Extension</TabsTrigger>}
                  <TabsTrigger value="nip46">Bunker</TabsTrigger>
                </TabsList>

                {/* Read-Only Login */}
                <TabsContent value="read-only">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="identifier">NIP-05 or npub</Label>
                      <Input
                        id="identifier"
                        placeholder="you@example.com or npub1..."
                        value={readOnlyIdentifier}
                        onChange={(e) => setReadOnlyIdentifier(e.target.value)}
                        disabled={isLoggingIn}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter a NIP-05 identifier or npub to add a read-only account
                      </p>
                    </div>
                    <Button
                      onClick={handleReadOnlyLogin}
                      disabled={!readOnlyIdentifier.trim() || isLoggingIn}
                      className="w-full"
                    >
                      {isLoggingIn ? "Loading..." : "Add Read-Only Account"}
                    </Button>
                  </div>
                </TabsContent>

                {/* New Account */}
                <TabsContent value="new-account">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        placeholder="username"
                        value={newUsername}
                        onChange={handleUsernameChange}
                        disabled={isLoggingIn}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        placeholder="Your Name"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        disabled={isLoggingIn}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Select Avatar</Label>
                      <div className="grid grid-cols-7 gap-2">
                        {avatarOptions.map((avatar, index) => (
                          <div
                            key={index}
                            className={cn(
                              "cursor-pointer rounded-lg p-1 border-2",
                              selectedAvatar === index ? "border-primary" : "border-transparent hover:border-muted",
                            )}
                            onClick={() => setSelectedAvatar(index)}
                          >
                            <img
                              src={avatar || "/placeholder.svg"}
                              alt={`Avatar option ${index + 1}`}
                              className="w-12 h-12 rounded-lg"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={handleCreateAccount}
                      disabled={!newUsername.trim() || !newDisplayName.trim() || isLoggingIn}
                      className="w-full"
                    >
                      {isLoggingIn ? "Creating Account..." : "Create New Account"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      This will generate a new private key and create a profile
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="private-key">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="privateKey">Private Key (nsec)</Label>
                      <div className="relative">
                        <Input
                          id="privateKey"
                          type={showPrivateKey ? "text" : "password"}
                          placeholder="nsec1..."
                          value={privateKey}
                          onChange={(e) => setPrivateKey(e.target.value)}
                          disabled={isLoggingIn}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                        >
                          {showPrivateKey ? "Hide" : "Show"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter your nsec private key to login directly with your key
                      </p>
                    </div>
                    <Button
                      onClick={handlePrivateKeyLogin}
                      disabled={!privateKey.trim() || isLoggingIn}
                      className="w-full"
                    >
                      {isLoggingIn ? "Logging in..." : "Login with Private Key"}
                    </Button>
                  </div>
                </TabsContent>

                {/* NIP-07 Login */}
                {hasNip07 && (
                  <TabsContent value="nip07">
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <h3 className="font-medium mb-2 flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          Browser Extension
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Login using your Nostr browser extension (like Alby, nos2x, or Flamingo)
                        </p>
                      </div>
                      <Button onClick={handleNip07Login} disabled={isLoggingIn} className="w-full">
                        {isLoggingIn ? "Connecting..." : "Connect with Extension"}
                      </Button>
                    </div>
                  </TabsContent>
                )}

                {/* NIP-46 Login */}
                <TabsContent value="nip46">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bunkerUrl">Bunker Connection String</Label>
                      <Input
                        id="bunkerUrl"
                        placeholder="bunker://..."
                        value={bunkerUrl}
                        onChange={(e) => setBunkerUrl(e.target.value)}
                        disabled={isLoggingIn}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter a bunker:// connection string from your Nostr Bunker
                      </p>
                    </div>
                    <Button onClick={handleNip46Login} disabled={!bunkerUrl.trim() || isLoggingIn} className="w-full">
                      {isLoggingIn ? "Connecting..." : "Connect with Bunker"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function SessionItem({
  pubkey,
  isActive,
  onSwitch,
  onLogout,
}: {
  pubkey: string
  isActive: boolean
  onSwitch: (pubkey: string) => void
  onLogout: (pubkey: string) => void
}) {
  const profile = useProfile(pubkey)
  const displayName = profile?.displayName || profile?.name || pubkey.substring(0, 8) + "..."

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border",
        isActive ? "bg-primary/10 border-primary" : "bg-background hover:bg-muted/50",
      )}
    >
      <div className="flex items-center gap-3">
        <UserAvatar pubkey={pubkey} size="sm" />
        <div>
          <div className="font-medium">{displayName}</div>
          <div className="text-xs text-muted-foreground">
            {isActive ? "Current session" : pubkey.substring(0, 8) + "..."}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!isActive && (
          <Button variant="ghost" size="sm" onClick={() => onSwitch(pubkey)} className="h-8 w-8 p-0">
            <Check className="h-4 w-4" />
            <span className="sr-only">Switch to this session</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLogout(pubkey)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </div>
  )
}
