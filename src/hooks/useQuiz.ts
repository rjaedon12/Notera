import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { QuestionBank, QuizAttempt } from "@/types"

// ============================================
// Question Banks
// ============================================

export function useQuestionBanks() {
  return useQuery<{ myBanks: QuestionBank[]; premadeBanks: QuestionBank[] }>({
    queryKey: ["questionBanks"],
    queryFn: async () => {
      const res = await fetch("/api/quizzes/banks")
      if (!res.ok) throw new Error("Failed to fetch question banks")
      const data = await res.json()
      // Handle legacy array response gracefully
      if (Array.isArray(data)) return { myBanks: data, premadeBanks: [] }
      return data
    },
  })
}

export function useQuestionBank(id: string) {
  return useQuery<QuestionBank>({
    queryKey: ["questionBank", id],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/banks/${id}`)
      if (!res.ok) throw new Error("Failed to fetch question bank")
      return res.json()
    },
    enabled: !!id,
  })
}

export function useCreateQuestionBank() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      title: string
      subject: string
      description?: string
      imageUrl?: string
      isPublic?: boolean
      timerMinutes?: number | null
      desmosEnabled?: boolean
      questions?: {
        prompt: string
        imageUrl?: string
        passage?: string
        explanation: string
        type?: string
        pointValue?: number
        exampleAnswer?: string
        correctChoiceIndex?: number
        choices?: { text: string }[]
      }[]
    }) => {
      const res = await fetch("/api/quizzes/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }))
        throw new Error(err.error || "Failed to create question set")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionBanks"] })
    },
  })
}

export function useUpdateQuestionBank() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string
      title: string
      subject: string
      description?: string
      imageUrl?: string
      isPublic?: boolean
      timerMinutes?: number | null
      desmosEnabled?: boolean
    }) => {
      const res = await fetch(`/api/quizzes/banks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update question bank")
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["questionBanks"] })
      queryClient.invalidateQueries({
        queryKey: ["questionBank", variables.id],
      })
    },
  })
}

export function useDeleteQuestionBank() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/quizzes/banks/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete question bank")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionBanks"] })
    },
  })
}

// ============================================
// Questions
// ============================================

export function useAddQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bankId,
      ...data
    }: {
      bankId: string
      prompt: string
      imageUrl?: string
      passage?: string
      explanation: string
      type?: string
      pointValue?: number
      exampleAnswer?: string
      correctChoiceIndex?: number
      orderIndex: number
      choices?: { text: string; orderIndex: number }[]
    }) => {
      const res = await fetch(`/api/quizzes/banks/${bankId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to add question")
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["questionBank", variables.bankId],
      })
    },
  })
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bankId,
      questionId,
      ...data
    }: {
      bankId: string
      questionId: string
      prompt: string
      imageUrl?: string
      passage?: string
      explanation: string
      type?: string
      pointValue?: number
      exampleAnswer?: string
      orderIndex: number
      choices?: { text: string; isCorrect: boolean; orderIndex: number }[]
    }) => {
      const res = await fetch(
        `/api/quizzes/banks/${bankId}/questions/${questionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      )
      if (!res.ok) throw new Error("Failed to update question")
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["questionBank", variables.bankId],
      })
    },
  })
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bankId,
      questionId,
    }: {
      bankId: string
      questionId: string
    }) => {
      const res = await fetch(
        `/api/quizzes/banks/${bankId}/questions/${questionId}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error("Failed to delete question")
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["questionBank", variables.bankId],
      })
    },
  })
}

// ============================================
// Quiz Attempts
// ============================================

export function useQuizAttempts(bankId?: string) {
  return useQuery<QuizAttempt[]>({
    queryKey: ["quizAttempts", bankId],
    queryFn: async () => {
      const params = bankId ? `?bankId=${bankId}` : ""
      const res = await fetch(`/api/quizzes/attempts${params}`)
      if (!res.ok) throw new Error("Failed to fetch quiz attempts")
      return res.json()
    },
  })
}

export function useCreateAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bankId: string) => {
      const res = await fetch("/api/quizzes/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankId }),
      })
      if (!res.ok) throw new Error("Failed to create quiz attempt")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizAttempts"] })
    },
  })
}

export function useSubmitAnswer() {
  return useMutation({
    mutationFn: async ({
      attemptId,
      questionId,
      choiceId,
      openResponseText,
    }: {
      attemptId: string
      questionId: string
      choiceId?: string
      openResponseText?: string
    }) => {
      const res = await fetch(
        `/api/quizzes/attempts/${attemptId}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, choiceId, openResponseText }),
        }
      )
      if (!res.ok) throw new Error("Failed to submit answer")
      return res.json()
    },
  })
}

export function useUpdateAnswerPoints() {
  return useMutation({
    mutationFn: async ({
      attemptId,
      questionId,
      pointsEarned,
    }: {
      attemptId: string
      questionId: string
      pointsEarned: number
    }) => {
      const res = await fetch(
        `/api/quizzes/attempts/${attemptId}/answer`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, pointsEarned }),
        }
      )
      if (!res.ok) throw new Error("Failed to update answer points")
      return res.json()
    },
  })
}

export function useCompleteAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (attemptId: string) => {
      const res = await fetch(
        `/api/quizzes/attempts/${attemptId}/complete`,
        { method: "POST" }
      )
      if (!res.ok) throw new Error("Failed to complete quiz")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizAttempts"] })
      queryClient.invalidateQueries({ queryKey: ["questionBanks"] })
    },
  })
}

export function useDeleteAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (attemptId: string) => {
      const res = await fetch(`/api/quizzes/attempts/${attemptId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete attempt")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizAttempts"] })
      queryClient.invalidateQueries({ queryKey: ["questionBanks"] })
    },
  })
}
