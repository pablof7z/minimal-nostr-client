import NDK from "@nostr-dev-kit/ndk"
import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie"

// Define explicit relays or use defaults
const explicitRelayUrls = ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nos.lol", "wss://purplepag.es"]

// Setup Dexie cache adapter (Client-side only)
let cacheAdapter: NDKCacheAdapterDexie | undefined
if (typeof window !== "undefined") {
  cacheAdapter = new NDKCacheAdapterDexie({ dbName: "tenex" })
}

// Create the singleton NDK instance
const ndk = new NDK({
  explicitRelayUrls,
  cacheAdapter,
  // You can add other NDK options here if needed
})

// Connect to relays on initialization
if (typeof window !== "undefined") {
  // This is a client-side check to ensure the code runs only in the browser
  ndk.connect()
}

// Export the singleton instance
export default ndk
