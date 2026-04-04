"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuestionBanks, useDeleteQuestionBank, useQuizAttempts, useDeleteAttempt } from "@/hooks/useQuiz"
import { useDBQPrompts, useDBQEssays, useDeleteDBQEssay } from "@/hooks/useDBQ"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  Search,
  Trash2,
  Play,
  Edit,
  Clock,
  BarChart3,
  HelpCircle,
  BookOpen,
  ScrollText,
  FileText,
  ChevronRight,
  Eye,
} from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

type Tab = "my-banks" | "premade" | "dbq" | "history"
type DBQTab = "prompts" | "essays"

const hubTabs = [
  { id: "premade" as Tab, label: "Practice Tests", icon: BookOpen },
  { id: "my-banks" as Tab, label: "My Question Banks", icon: HelpCircle },
  { id: "dbq" as Tab, label: "DBQ Arena", icon: ScrollText },
  { id: "history" as Tab, label: "Attempt History", icon: Clock },
]

function QuizzesPageFallback() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-3">
        <div className="h-10 w-56 glass-shimmer rounded-2xl" />
        <div className="h-5 w-80 max-w-full glass-shimmer rounded-2xl" />
      </div>

      <div className="mb-6 h-10 w-full glass-shimmer rounded-full" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <Card key={item}>
            <CardContent className="p-6">
              <div className="h-5 w-3/4 glass-shimmer rounded-xl mb-3" />
              <div className="h-4 w-1/2 glass-shimmer rounded-xl mb-4" />
              <div className="h-8 w-full glass-shimmer rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function QuizzesPageContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>("premade")
  const [dbqTab, setDbqTab] = useState<DBQTab>("prompts")
  const [search, setSearch] = useState("")

  const { data: banksData, isLoading: loadingBanks } = useQuestionBanks()
  const { data: attempts, isLoading: loadingAttempts } = useQuizAttempts()
  const { data: prompts, isLoading: loadingPrompts } = useDBQPrompts()
  const { data: essays, isLoading: loadingEssays } = useDBQEssays()
  const deleteBank = useDeleteQuestionBank()
  const deleteAttempt = useDeleteAttempt()
  const deleteEssay = useDeleteDBQEssay()

  useEffect(() => {
    const nextTab = searchParams.get("tab")
    if (nextTab === "premade" || nextTab === "my-banks" || nextTab === "dbq" || nextTab === "history") {
      setActiveTab(nextTab)
    }

    const nextDbqTab = searchParams.get("dbqTab")
    if (nextDbqTab === "prompts" || nextDbqTab === "essays") {
      setDbqTab(nextDbqTab)
    }
  }, [searchParams])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [router, status])

  if (status !== "authenticated") {
    return <QuizzesPageFallback />
  }

  const updateHubQuery = (nextTab: Tab, nextDbqTab?: DBQTab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", nextTab)

    if (nextTab === "dbq") {
      params.set("dbqTab", nextDbqTab ?? dbqTab)
    } else {
      params.delete("dbqTab")
    }

    router.replace(`/quizzes?${params.toString()}`)
  }

  const handleDelete = async (bankId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this question bank? All questions and attempts will be lost.")) {
      try {
        await deleteBank.mutateAsync(bankId)
        toast.success("Question bank deleted")
      } catch {
        toast.error("Failed to delete question bank")
      }
    }
  }

  const handleDeleteAttempt = async (attemptId: string) => {
    if (confirm("Are you sure you want to delete this attempt from your history?")) {
      try {
        await deleteAttempt.mutateAsync(attemptId)
        toast.success("Attempt deleted")
      } catch {
        toast.error("Failed to delete attempt")
      }
    }
  }

  const myBanks = banksData?.myBanks ?? []
  const premadeBanks = banksData?.premadeBanks ?? []
  const dbqPrompts = prompts ?? []
  const dbqEssays = essays ?? []

  const filteredMyBanks = myBanks.filter(
    (bank) =>
      bank.title.toLowerCase().includes(search.toLowerCase()) ||
      bank.description?.toLowerCase().includes(search.toLowerCase()) ||
      bank.subject?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredPremade = premadeBanks.filter(
    (bank) =>
      bank.title.toLowerCase().includes(search.toLowerCase()) ||
      bank.description?.toLowerCase().includes(search.toLowerCase()) ||
      bank.subject?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredPrompts = dbqPrompts.filter(
    (prompt) =>
      prompt.title.toLowerCase().includes(search.toLowerCase()) ||
      prompt.question.toLowerCase().includes(search.toLowerCase()) ||
      prompt.subject.toLowerCase().includes(search.toLowerCase()) ||
      prompt.era.toLowerCase().includes(search.toLowerCase())
  )

  const filteredEssays = dbqEssays.filter(
    (essay) =>
      essay.prompt?.title?.toLowerCase().includes(search.toLowerCase()) ||
      essay.content.toLowerCase().includes(search.toLowerCase())
  )

  const searchPlaceholder =
    activeTab === "dbq"
      ? dbqTab === "prompts"
        ? "Search DBQ prompts..."
        : "Search DBQ essays..."
      : activeTab === "my-banks"
      ? "Search your question banks..."
      : "Search practice tests..."

  const BankCard = ({ bank, owned }: { bank: (typeof myBanks)[0]; owned: boolean }) => (
    <Link href={`/quizzes/${bank.id}`}>
      <Card className="h-full cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-2 gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base line-clamp-2 leading-snug font-heading">
                {bank.title}
              </h3>
            </div>
            {owned && (
              <button
                onClick={(event) => handleDelete(bank.id, event)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded shrink-0"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-medium">
            <span style={{ color: "var(--primary)" }}>{bank.subject}</span>
            <span
              className="px-2 py-0.5 rounded-full border"
              style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
            >
              {bank.feedbackMode === "REVEAL_AT_END" ? "Reveal At Finish" : "Immediate Feedback"}
            </span>
          </div>

          {bank.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {bank.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 flex-wrap">
            <span className="flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" />
              {bank._count?.questions || 0} questions
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              {bank._count?.attempts || 0} attempts
            </span>
            {bank.desmosEnabled && <span>Desmos</span>}
          </div>

          <div className="flex gap-2">
            {owned && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={(event) => {
                  event.preventDefault()
                  router.push(`/quizzes/${bank.id}`)
                }}
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Manage
              </Button>
            )}
            <Button
              size="sm"
              className={cn(owned ? "flex-1" : "w-full")}
              disabled={!bank._count?.questions}
              onClick={(event) => {
                event.preventDefault()
                router.push(`/quizzes/${bank.id}/take`)
              }}
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              Take Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight">Quiz Arena</h1>
          <p className="text-sm mt-2 text-muted-foreground">
            Practice tests and document-based questions, together in one hub.
          </p>
        </div>

        <Link href="/quizzes/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Practice Test
          </Button>
        </Link>
      </div>

      <div className="flex gap-1 mb-6 border-b overflow-x-auto" style={{ borderColor: "var(--glass-border)" }}>
        {hubTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setActiveTab(id)
              updateHubQuery(id)
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap",
              activeTab === id
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {(activeTab === "premade" || activeTab === "my-banks" || activeTab === "dbq") && (
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
          <input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-full text-sm transition-all backdrop-blur-xl border focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-0 placeholder:text-[var(--muted-foreground)]"
            style={{
              background: "var(--glass-fill)",
              borderColor: "var(--glass-border)",
              color: "var(--foreground)",
            }}
          />
        </div>
      )}

      {activeTab === "premade" && (
        <>
          {loadingBanks ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <Card key={item}>
                  <CardContent className="p-6">
                    <div className="h-5 glass-shimmer rounded-xl w-3/4 mb-3" />
                    <div className="h-4 glass-shimmer rounded-xl w-1/2 mb-4" />
                    <div className="h-8 glass-shimmer rounded-xl w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPremade.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPremade.map((bank) => (
                <BankCard key={bank.id} bank={bank} owned={false} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
              <h2 className="text-xl font-semibold mb-2 font-heading">No practice tests yet</h2>
              <p style={{ color: "var(--muted-foreground)" }}>Check back later for premade tests.</p>
            </div>
          )}
        </>
      )}

      {activeTab === "my-banks" && (
        <>
          {loadingBanks ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <Card key={item}>
                  <CardContent className="p-6">
                    <div className="h-5 glass-shimmer rounded-xl w-3/4 mb-3" />
                    <div className="h-4 glass-shimmer rounded-xl w-1/2 mb-4" />
                    <div className="h-8 glass-shimmer rounded-xl w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMyBanks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMyBanks.map((bank) => (
                <BankCard key={bank.id} bank={bank} owned={true} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <HelpCircle className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
              <h2 className="text-xl font-semibold mb-2 font-heading">No question banks yet</h2>
              <p className="mb-6" style={{ color: "var(--muted-foreground)" }}>
                Create your first practice test to get started.
              </p>
              <Link href="/quizzes/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Practice Test
                </Button>
              </Link>
            </div>
          )}
        </>
      )}

      {activeTab === "dbq" && (
        <div className="space-y-6">

          <div
            className="inline-flex items-center gap-1 rounded-xl p-1"
            style={{ background: "var(--glass-fill)", border: "1px solid var(--glass-border)" }}
          >
            {([
              { id: "prompts", label: "DBQ Prompts", icon: BookOpen },
              { id: "essays", label: "My Essays", icon: ScrollText },
            ] as const).map(({ id, label, icon: Icon }) => {
              const isActive = dbqTab === id
              return (
                <button
                  key={id}
                  onClick={() => {
                    setDbqTab(id)
                    updateHubQuery("dbq", id)
                  }}
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
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
                        }
                      : undefined
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              )
            })}
          </div>

          {dbqTab === "prompts" && (
            <>
              {loadingPrompts ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2].map((item) => (
                    <Card key={item}>
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
              ) : filteredPrompts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredPrompts.map((prompt) => (
                    <Card key={prompt.id} className="group hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider flex-wrap">
                            <span className="px-2 py-0.5 rounded-full border" style={{ background: "var(--glass-fill)", borderColor: "var(--glass-border)" }}>
                              {prompt.subject}
                            </span>
                            <span className="px-2 py-0.5 rounded-full border" style={{ background: "var(--glass-fill)", borderColor: "var(--glass-border)" }}>
                              {prompt.era}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold">{prompt.title}</h3>
                          <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                            {prompt.question}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 gap-3">
                          <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] flex-wrap">
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
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-[var(--muted-foreground)]" />
                    <h3 className="text-lg font-semibold mb-2">No DBQ prompts available</h3>
                    <p className="text-[var(--muted-foreground)]">
                      Check back later for new document-based questions.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {dbqTab === "essays" && (
            <>
              {loadingEssays ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <Card key={item}>
                      <CardContent className="p-5">
                        <div className="animate-pulse space-y-2">
                          <div className="h-4 bg-[var(--glass-fill)] rounded w-1/3" />
                          <div className="h-3 bg-[var(--glass-fill)] rounded w-2/3" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredEssays.length > 0 ? (
                <div className="space-y-3">
                  {filteredEssays.map((essay) => (
                    <Card key={essay.id} className="hover:shadow-md transition-all group">
                      <CardContent className="p-5 flex items-center justify-between">
                        <Link href={`/dbq/${essay.promptId}/essays/${essay.id}`} className="min-w-0 flex-1 cursor-pointer">
                          <div className="space-y-1">
                            <h4 className="font-medium truncate">
                              {essay.prompt?.title ?? "DBQ Essay"}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] flex-wrap">
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
                        </Link>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm("Delete this essay? This cannot be undone.")) {
                                deleteEssay.mutate(essay.id, {
                                  onSuccess: () => toast.success("Essay deleted"),
                                  onError: () => toast.error("Failed to delete essay"),
                                })
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete essay"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <ChevronRight className="h-5 w-5 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <ScrollText className="h-12 w-12 mx-auto mb-4 text-[var(--muted-foreground)]" />
                    <h3 className="text-lg font-semibold mb-2">No essays yet</h3>
                    <p className="text-[var(--muted-foreground)]">
                      Start a DBQ prompt to write your first essay.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <>
          {loadingAttempts ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <Card key={item}>
                  <CardContent className="p-4">
                    <div className="h-5 glass-shimmer rounded-xl w-1/3 mb-2" />
                    <div className="h-4 glass-shimmer rounded-xl w-1/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : attempts && attempts.length > 0 ? (
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <Card key={attempt.id} className="group">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium">{attempt.bank?.title || "Unknown Bank"}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                        <span>
                          {new Date(attempt.createdAt).toLocaleDateString()} at{" "}
                          {new Date(attempt.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {attempt.completedAt ? (
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3.5 w-3.5" />
                            {Math.round(attempt.score || 0)}%
                          </span>
                        ) : (
                          <span className="text-yellow-600 dark:text-yellow-400">In progress</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {attempt.completedAt && (
                        <div
                          className={cn(
                            "text-2xl font-bold",
                            (attempt.score || 0) >= 70
                              ? "text-green-600 dark:text-green-400"
                              : (attempt.score || 0) >= 50
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {Math.round(attempt.score || 0)}%
                        </div>
                      )}
                      {attempt.completedAt && (
                        <Link
                          href={`/quizzes/review/${attempt.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-primary/10 rounded"
                          title="Review answers"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                        </Link>
                      )}
                      <button
                        onClick={() => handleDeleteAttempt(attempt.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded"
                        title="Delete attempt"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Clock className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
              <h2 className="text-xl font-semibold mb-2 font-heading">No attempts yet</h2>
              <p style={{ color: "var(--muted-foreground)" }}>
                Take a practice test to see your results here.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function QuizzesPage() {
  return (
    <Suspense fallback={<QuizzesPageFallback />}>
      <QuizzesPageContent />
    </Suspense>
  )
}
