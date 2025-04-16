import { Badge } from "@/components/ui/badge"
import UserAvatar from "@/components/user/avatar"
import { CodeBlock } from "@/components/code-block"

export default function ComponentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Nostr Components</h1>
        <p className="text-muted-foreground mb-8">A collection of components for building Nostr applications</p>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold">User Profile</h2>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              kind 0
            </Badge>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">UserAvatar</h3>
            <div className="flex flex-col items-center gap-6">
              <UserAvatar pubkey="fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52" size="lg" />
              <p className="text-sm text-muted-foreground">Displays a user's avatar based on their pubkey</p>
            </div>

            <div className="mt-8 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Usage</h4>
              <CodeBlock
                code={`<UserAvatar 
  pubkey="fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52" 
  size="lg" 
/>`}
                language="tsx"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                The UserAvatar component uses the useProfile hook to fetch profile data for the given pubkey. It
                displays the user's avatar if available, or falls back to initials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
