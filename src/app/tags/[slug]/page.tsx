import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Users, Tag as TagIcon, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TagPageProps {
  params: Promise<{ slug: string }>
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params

  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      sets: {
        where: {
          studySet: { isPublic: true }
        },
        include: {
          studySet: {
            include: {
              owner: { select: { id: true, name: true } },
              _count: { select: { cards: true } }
            }
          }
        }
      },
      resources: {
        include: {
          resource: {
            include: {
              owner: { select: { id: true, name: true } }
            }
          }
        }
      }
    }
  })

  if (!tag) {
    notFound()
  }

  const sets = tag.sets.map((s: { studySet: unknown }) => s.studySet) as Array<{
    id: string
    title: string
    description: string | null
    isPremade: boolean
    owner: { id: string; name: string | null }
    _count: { cards: number }
  }>
  const resources = tag.resources.map((r: { resource: unknown }) => r.resource) as Array<{
    id: string
    title: string
    type: string
    owner: { id: string; name: string | null }
  }>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link 
          href="/discover" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discover
        </Link>

        {/* Tag header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <TagIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{tag.name}</h1>
            <p className="text-muted-foreground">
              {sets.length} study sets • {resources.length} resources
            </p>
          </div>
        </div>

        {/* Study Sets */}
        {sets.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Study Sets
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {sets.map((set) => (
                <Link key={set.id} href={`/sets/${set.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2 text-card-foreground">
                        {set.title}
                      </h3>
                      {set.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {set.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{set._count.cards} cards</span>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {set.owner.name || "Anonymous"}
                        </div>
                      </div>
                      {set.isPremade && (
                        <span className="mt-2 inline-block px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                          Featured
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Resources */}
        {resources.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Resources
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {resources.map((resource) => (
                <Link key={resource.id} href={`/resources/${resource.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold line-clamp-1 text-card-foreground">
                            {resource.title}
                          </h3>
                          <p className="text-xs text-muted-foreground capitalize">
                            {resource.type.toLowerCase().replace("_", " ")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {sets.length === 0 && resources.length === 0 && (
          <div className="text-center py-12">
            <TagIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No content yet
            </h3>
            <p className="text-muted-foreground mb-4">
              There&apos;s nothing tagged with &quot;{tag.name}&quot; yet.
            </p>
            <Link href="/discover">
              <Button>Browse all content</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
