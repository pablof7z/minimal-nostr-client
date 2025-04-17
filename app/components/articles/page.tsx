"use client"

import { Badge } from "@/components/ui/badge"
import { ArticleListItem } from "@/components/nostr/article-list-item"
import { ArticleCard } from "@/components/nostr/article-card"
import { ArticleView } from "@/components/nostr/article-view"
import { ArticleMention } from "@/components/nostr/article-mention"
import { useSubscribe } from "@nostr-dev-kit/ndk-hooks"
import type { NDKArticle } from "@nostr-dev-kit/ndk"
import { CodeBlock } from "@/components/code-block"
import { useMemo, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function ArticlesPage() {
  const [showHighlights, setShowHighlights] = useState(true)
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)

  // Fetch articles from the specified pubkey
  const { events: allArticles } = useSubscribe<NDKArticle>(
    {
      kinds: [30023],
      authors: ["fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52"],
    },
    { wrap: true },
  )

  // Add null checks and default values to prevent accessing properties of undefined objects

  // Update the useMemo for featuredArticle to handle undefined allArticles
  const featuredArticles = useMemo(() => {
    if (!allArticles || allArticles.length === 0) return null

    return allArticles.filter((article) => {
      const wordCount = article.content.split(/\s+/).length
      return wordCount > 100 && article.summary
    })
  }, [allArticles])

  // Update the useMemo for selectedArticle to handle undefined allArticles
  const selectedArticle = useMemo(() => {
    if (!allArticles || allArticles.length === 0) return null

    if (selectedArticleId) {
      const found = allArticles.find((article) => article.id === selectedArticleId)
      if (found) return found
    }
    return featuredArticles?.[0]
  }, [featuredArticles, selectedArticleId])

  // Handle article selection
  const handleSelectArticle = (articleId: string) => {
    setSelectedArticleId(articleId)
    // Scroll to the article card section
    document.getElementById("article-card-section")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Articles</h1>
        <p className="text-muted-foreground mb-8">Components for displaying kind 30023 articles</p>
      </div>

      <div className="space-y-10">
        {/* Article List Item */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold">Article List Item</h2>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
              kind 30023
            </Badge>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Article Preview for Lists</h3>
            {featuredArticles && featuredArticles.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Click on an article to view it in the components below
                </p>
                {featuredArticles.slice(0, 3).map((article) => (
                  <div
                    key={article.id}
                    onClick={() => handleSelectArticle(article.id)}
                    className={`cursor-pointer transition-all ${
                      selectedArticleId === article.id
                        ? "ring-2 ring-primary ring-offset-2"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <ArticleListItem article={article} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Loading articles...</p>
            )}

            <div className="mt-8 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Usage</h4>
              <CodeBlock
                code={`<ArticleListItem 
  article={articleObj} 
  href="/articles/example-id" // Optional - if not provided, no link is created
/>`}
                language="tsx"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Displays a compact preview of an article, suitable for article listings. Shows the title, summary,
                author information, publication date, and estimated reading time. Optionally links to a detail page if
                the href prop is provided.
              </p>
            </div>
          </div>
        </div>

        {/* Article Card */}
        <div id="article-card-section">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold">Article Card</h2>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
              kind 30023
            </Badge>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Visual Article Card</h3>
            {selectedArticle ? (
              <div className="w-80">
                <ArticleCard article={selectedArticle} />
                <p className="text-sm text-muted-foreground mt-4">
                  {selectedArticle.title || "Untitled"} - Selected from the list above
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Loading articles...</p>
            )}

            <div className="mt-8 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Usage</h4>
              <CodeBlock
                code={`<ArticleCard 
  article={articleObj} 
  href="/articles/example-id" // Optional - if not provided, no link is created
/>`}
                language="tsx"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Displays a visual card for an article with the image as background. Shows the title, summary, author
                information, and estimated reading time. Designed for featured articles or grid layouts.
              </p>
            </div>
          </div>
        </div>

        {/* Article Mention */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold">Article Mention</h2>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
              utility
            </Badge>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Article Reference Component</h3>
            {selectedArticle ? (
              <div>
                <ArticleMention article={selectedArticle} />
                <p className="text-sm text-muted-foreground mt-4">
                  {selectedArticle.title || "Untitled"} - Selected from the list above
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Loading articles...</p>
            )}

            <div className="mt-8 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Usage</h4>
              <CodeBlock
                code={`<ArticleMention 
  article={articleObj} 
  href="/articles/example-id" // Optional - if not provided, no link is created
/>`}
                language="tsx"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Displays a compact reference to an article, showing the title and author. It links to the article page
                when clicked. This component is used within the HighlightCard to display a reference to the source
                article.
              </p>
            </div>
          </div>
        </div>

        {/* Article View */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-semibold">Article View</h2>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
              kind 30023
            </Badge>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Full Article View</h3>
              <div className="flex items-center space-x-2">
                <Switch id="highlights-mode" checked={showHighlights} onCheckedChange={setShowHighlights} />
                <Label htmlFor="highlights-mode">Show Highlights</Label>
              </div>
            </div>

            {selectedArticle ? (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Viewing: <strong>{selectedArticle.title || "Untitled"}</strong> - Selected from the list above
                </p>
                <ArticleView article={selectedArticle} withHighlights={showHighlights} />
              </div>
            ) : (
              <p className="text-muted-foreground">Loading articles...</p>
            )}

            <div className="mt-8 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Usage</h4>
              <CodeBlock
                code={`<ArticleView 
  article={articleObj} 
  withHighlights={true} 
  HighlightComponent={CustomHighlightComponent} 
/>`}
                language="tsx"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Renders the full article with proper markdown support, including footnotes, tables, and code
                highlighting. Displays the article header with title, author information, publication date, and
                estimated reading time.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                When <code>withHighlights</code> is enabled (default: true), the component fetches highlights for the
                article and displays them inline. Hover over highlighted text to see who created the highlight. You can
                provide a custom <code>HighlightComponent</code> to customize how highlights are rendered.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
