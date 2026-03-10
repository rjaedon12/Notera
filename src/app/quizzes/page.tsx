"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQuestionBanks, useDeleteQuestionBank, useQuizAttempts } from "@/hooks/useQuiz"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Brain,
  Search,
  Trash2,
  Play,
  Edit,
  Clock,
  BarChart3,
  HelpCircle,
  BookOpen,
} from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

type Tab = "my-banks" | "premade" | "history"

export default function QuizzesPage() {
  const { status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("premade")
  const [search, setSearch] = useState("")

  const { data: banksData, isLoading: loadingBanks } = useQuestionBanks()
  const { data: attempts, isLoading: loadingAttempts } = useQuizAttempts()
  const deleteBank = useDeleteQuestionBank()

  if (status === "unauthenticated") {
    router.push("/login")
    return null
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

  const myBanks = banksData?.myBanks ?? []
  const premadeBanks = banksData?.premadeBanks ?? []

  const filteredMyBanks = myBanks.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase()) ||
      b.subject?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredPremade = premadeBanks.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase()) ||
      b.subject?.toLowerCase().includes(search.toLowerCase())
  )

  const tabs = [
    { id: "premade" as Tab, label: "Practice Tests", icon: BookOpen },
    { id: "my-banks" as Tab, label: "My Question Banks", icon: Brain },
    { id: "history" as Tab, label: "Attempt History", icon: Clock },
  ]

  // Reusable bank card — no delete button for premade
  const BankCard = ({ bank, owned }: { bank: (typeof myBanks)[0]; owned: boolean }) => (
    <Link href={`/quizzes/${bank.id}`}>
      <Card className="h-full cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Brain className="h-5 w-5 shrink-0" style={{ color: "var(--primary)" }} />
              <h3 className="font-semibold text-base line-clamp-2 leading-snug font-heading">
                {bank.title}
              </h3>
            </div>
            {owned && (
              <button
                onClick={(e) => handleDelete(bank.id, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded shrink-0 ml-2"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            )}
          </div>

          {bank.subject && (
            <p className="text-xs font-medium mb-1" style={{ color: "var(--primary)" }}>
              {bank.subject}
            </p>
          )}

          {bank.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {bank.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" />
              {bank._count?.questions || 0} questions
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              {bank._count?.attempts || 0} attempts
            </span>
          </div>

          <div className="flex gap-2">
            {owned && (
              <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.preventDefault(); router.push(`/quizzes/${bank.id}`) }}>
                <Edit className="h-3.5 w-3.5 mr-1" />
                Manage
              </Button>
            )}
            <Button
              size="sm"
              className={cn(owned ? "flex-1" : "w-full")}
              disabled={!bank._count?.questions}
              onClick={(e) => {
                e.preventDefault()
                router.push(`/quizzes/${bank.id}/take`)
              }}
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              Take Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-heading tracking-tight">Quizzes</h1>
        <Link href="/quizzes/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Question Bank
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: "var(--glass-border)" }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
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

      {/* Search bar (for banks tabs) */}
      {(activeTab === "premade" || activeTab === "my-banks") && (
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
          <input
            placeholder="Search question banks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-full text-sm transition-all
              backdrop-blur-xl border focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-0
              placeholder:text-[var(--muted-foreground)]"
            style={{
              background: "var(--glass-fill)",
              borderColor: "var(--glass-border)",
              color: "var(--foreground)",
            }}
          />
        </div>
      )}

      {/* Premade / Practice Tests Tab */}
      {activeTab === "premade" && (
        <>
          {loadingBanks ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
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

      {/* My Banks Tab */}
      {activeTab === "my-banks" && (
        <>
          {loadingBanks ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
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
              <Brain className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
              <h2 className="text-xl font-semibold mb-2 font-heading">No question banks yet</h2>
              <p className="mb-6" style={{ color: "var(--muted-foreground)" }}>
                Create your first question bank to start building quizzes
              </p>
              <Link href="/quizzes/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Question Bank
                </Button>
              </Link>
            </div>
          )}
        </>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <>
          {loadingAttempts ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
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
                <Card key={attempt.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">
                        {attempt.bank?.title || "Unknown Bank"}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
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
                          <span className="text-yellow-600 dark:text-yellow-400">
                            In progress
                          </span>
                        )}
                      </div>
                    </div>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Clock className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
              <h2 className="text-xl font-semibold mb-2 font-heading">No attempts yet</h2>
              <p style={{ color: "var(--muted-foreground)" }}>
                Take a quiz to see your results here
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
