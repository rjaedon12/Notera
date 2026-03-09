"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useDBQPrompts, useDBQEssays } from "@/hooks/useDBQ"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Play,
  Clock,
  BookOpen,
  ScrollText,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = "prompts" | "history"

export default function DBQPage() {
  const { status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("prompts")

  const { data: prompts, isLoading: loadingPrompts } = useDBQPrompts()
  const { data: essays, isLoading: loadingEssays } = useDBQEssays()

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const tabs = [
    { id: "prompts" as Tab, label: "DBQ Prompts", icon: BookOpen },
    { id: "history" as Tab, label: "My Essays", icon: Clock },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ScrollText className="h-8 w-8" style={{ color: "var(--primary)" }} />
          Document-Based Questions
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Practice writing DBQ essays with primary source documents.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="inline-flex items-center gap-1 rounded-xl p-1"
        style={{
          background: "var(--glass-fill)",
          border: "1px solid var(--glass-border)",
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
              style={
                isActive
                  ? {
                      background: "var(--glass-bg)",
                      boxShadow:
                        "0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
                    }
                  : {}
              }
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Prompts Tab */}
      {activeTab === "prompts" && (
        <div className="space-y-4">
          {loadingPrompts ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-5 bg-[var(--glass-fill)] rounded w-3/4" />
                      <div className="h-4 bg-[var(--glass-fill)] rounded w-full" />
                      <div className="h-4 bg-[var(--glass-fill)] rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !prompts?.length ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-[var(--muted-foreground)]" />
                <h3 className="text-lg font-semibold mb-2">No DBQ prompts available</h3>
                <p className="text-[var(--muted-foreground)]">
                  Check back later for new document-based questions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {prompts.map((prompt) => (
                <Card
                  key={prompt.id}
                  className="group hover:shadow-lg transition-all duration-200"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            background: "var(--glass-fill)",
                            border: "1px solid var(--glass-border)",
                          }}
                        >
                          {prompt.subject}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            background: "var(--glass-fill)",
                            border: "1px solid var(--glass-border)",
                          }}
                        >
                          {prompt.era}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold">{prompt.title}</h3>
                      <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                        {prompt.question}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {prompt._count?.documents ?? 0} docs
                        </span>
                        {(prompt.userEssayCount ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <ScrollText className="h-3.5 w-3.5" />
                            {prompt.userEssayCount} {prompt.userEssayCount === 1 ? "essay" : "essays"} written
                          </span>
                        )}
                      </div>
                      <Link href={`/dbq/${prompt.id}`}>
                        <Button size="sm" className="gap-1.5">
                          <Play className="h-3.5 w-3.5" />
                          Start
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {loadingEssays ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-[var(--glass-fill)] rounded w-1/3" />
                      <div className="h-3 bg-[var(--glass-fill)] rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !essays?.length ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ScrollText className="h-12 w-12 mx-auto mb-4 text-[var(--muted-foreground)]" />
                <h3 className="text-lg font-semibold mb-2">No essays yet</h3>
                <p className="text-[var(--muted-foreground)]">
                  Start a DBQ prompt to write your first essay.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {essays.map((essay) => (
                <Link key={essay.id} href={`/dbq/${essay.promptId}/essays/${essay.id}`}>
                  <Card className="hover:shadow-md transition-all cursor-pointer group">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="font-medium truncate">
                          {essay.prompt?.title ?? "DBQ Essay"}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                          <span>{essay.wordCount} words</span>
                          <span>•</span>
                          <span>
                            {new Date(essay.submittedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)] line-clamp-1 mt-1">
                          {essay.content.slice(0, 120)}...
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors flex-shrink-0 ml-4" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
