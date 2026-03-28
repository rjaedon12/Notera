/**
 * useBlastGame — core state machine hook for Block Blast mode.
 *
 * States: CONFIG → QUESTION → PLACING → CLEARING → … → GAME_OVER
 *
 * All game state lives here and is driven by a `useReducer`.
 */

"use client"

import { useReducer, useCallback, useRef, useEffect } from "react"
import type { Card as FlashCard } from "@/types"
import {
  type Board,
  type GamePiece,
  type ScoreState,
  type BlastQuestion,
  type AnswerMode,
  type PromptSide,
  createEmptyBoard,
  canPlace,
  placePiece,
  findCompletedLines,
  clearLines,
  hasValidMove,
  generatePieceSet,
  pieceSize,
  createScoreState,
  calculatePlacementScore,
  QuestionPool,
} from "@/lib/blast"
import { matchAnswer } from "@/lib/levenshtein"

// ── Public types ───────────────────────────────────────────────

export type GamePhase =
  | "CONFIG"
  | "QUESTION"
  | "PLACING"
  | "CLEARING"
  | "GAME_OVER"

export interface BlastGameState {
  phase: GamePhase
  board: Board
  tray: (GamePiece | null)[] // length 3; null = already placed
  selectedPieceIndex: number | null
  score: ScoreState
  round: number // how many piece-sets issued so far
  currentQuestion: BlastQuestion | null
  questionFirstTry: boolean // was current question answered first-try?
  wasFirstTry: boolean // latest question result (carried into PLACING)
  showingCorrectAnswer: boolean // true when wrong answer review is shown
  /** Lines being cleared right now (for animation). */
  clearingRows: number[]
  clearingCols: number[]
  answerMode: AnswerMode
  promptSide: PromptSide
}

// ── Actions ────────────────────────────────────────────────────

export type BlastAction =
  | { type: "START_GAME"; answerMode: AnswerMode; promptSide: PromptSide }
  | { type: "ANSWER_CORRECT" }
  | { type: "ANSWER_WRONG" }
  | { type: "ACKNOWLEDGE_WRONG" }
  | { type: "SET_QUESTION"; question: BlastQuestion }
  | { type: "SELECT_PIECE"; index: number }
  | { type: "PLACE_PIECE"; row: number; col: number }
  | { type: "PLACE_PIECE_DIRECT"; pieceIndex: number; row: number; col: number }
  | { type: "CLEAR_COMPLETE" }
  | { type: "CHECK_GAME_OVER" }
  | { type: "RESTART" }

// ── Reducer ────────────────────────────────────────────────────

function createInitialState(): BlastGameState {
  return {
    phase: "CONFIG",
    board: createEmptyBoard(),
    tray: [null, null, null],
    selectedPieceIndex: null,
    score: createScoreState(),
    round: 0,
    currentQuestion: null,
    questionFirstTry: true,
    wasFirstTry: false,
    showingCorrectAnswer: false,
    clearingRows: [],
    clearingCols: [],
    answerMode: "mc",
    promptSide: "mixed",
  }
}

function reducer(
  state: BlastGameState,
  action: BlastAction
): BlastGameState {
  switch (action.type) {
    case "START_GAME":
      return {
        ...createInitialState(),
        phase: "QUESTION",
        answerMode: action.answerMode,
        promptSide: action.promptSide,
      }

    case "SET_QUESTION":
      return {
        ...state,
        currentQuestion: action.question,
        questionFirstTry: true,
      }

    case "ANSWER_CORRECT": {
      const round = state.round + 1
      const tray = generatePieceSet(round)
      return {
        ...state,
        phase: "PLACING",
        tray,
        selectedPieceIndex: null,
        round,
        wasFirstTry: state.questionFirstTry,
        currentQuestion: null,
        score: {
          ...state.score,
          questionsAnswered: state.score.questionsAnswered + 1,
          firstTryCount: state.questionFirstTry
            ? state.score.firstTryCount + 1
            : state.score.firstTryCount,
        },
      }
    }

    case "ANSWER_WRONG":
      return {
        ...state,
        questionFirstTry: false,
        showingCorrectAnswer: true, // keep question visible for review
      }

    case "ACKNOWLEDGE_WRONG":
      return {
        ...state,
        showingCorrectAnswer: false,
        currentQuestion: null, // triggers useEffect to serve a new question
      }

    case "SELECT_PIECE":
      return {
        ...state,
        selectedPieceIndex:
          state.selectedPieceIndex === action.index ? null : action.index,
      }

    case "PLACE_PIECE_DIRECT": {
      const directPiece = state.tray[action.pieceIndex]
      if (!directPiece) return state
      if (!canPlace(state.board, directPiece.shape, action.row, action.col))
        return state
      // Delegate to shared placement logic below via a synthetic PLACE_PIECE
      return reducer(state, {
        type: "PLACE_PIECE",
        row: action.row,
        col: action.col,
        _pieceIdx: action.pieceIndex,
      } as BlastAction & { _pieceIdx: number })
    }

    case "PLACE_PIECE": {
      const pieceIdx = (action as unknown as { _pieceIdx?: number })._pieceIdx ?? state.selectedPieceIndex!
      const piece = state.tray[pieceIdx]
      if (!piece) return state
      if (!canPlace(state.board, piece.shape, action.row, action.col))
        return state

      const boardAfterPlace = placePiece(
        state.board,
        piece.shape,
        action.row,
        action.col,
        piece.color
      )

      const { rows, cols } = findCompletedLines(boardAfterPlace)
      const linesClearedNow = rows.length + cols.length

      const { delta, newComboCount } = calculatePlacementScore(
        pieceSize(piece.shape),
        linesClearedNow,
        state.score.comboCount,
        state.wasFirstTry
      )

      // Remove the placed piece from the tray
      const newTray = [...state.tray] as (GamePiece | null)[]
      newTray[pieceIdx] = null

      // Only give first-try bonus on the first placement of the set
      const isFirstPlacement = state.tray.filter(Boolean).length === 3

      const newScore: ScoreState = {
        ...state.score,
        score:
          state.score.score +
          delta.totalAdded -
          (isFirstPlacement ? 0 : delta.firstTryBonus),
        comboCount: newComboCount,
        linesCleared: state.score.linesCleared + linesClearedNow,
        bestCombo: Math.max(state.score.bestCombo, newComboCount),
      }

      // Fix: only add first-try bonus on first placement of the set
      if (!isFirstPlacement) {
        // Recalculate without the firstTry bonus
        newScore.score =
          state.score.score +
          delta.blockPoints +
          delta.linePoints
      }

      if (linesClearedNow > 0) {
        // Go to CLEARING phase for animation
        return {
          ...state,
          board: boardAfterPlace, // show filled board during animation
          tray: newTray,
          selectedPieceIndex: null,
          score: newScore,
          phase: "CLEARING",
          clearingRows: rows,
          clearingCols: cols,
        }
      }

      // No clears — stay in PLACING, check if more pieces or need questions
      const remainingPieces = newTray.filter(Boolean) as GamePiece[]
      if (remainingPieces.length === 0) {
        // Tray empty → next question
        return {
          ...state,
          board: boardAfterPlace,
          tray: newTray,
          selectedPieceIndex: null,
          score: newScore,
          phase: "QUESTION",
          wasFirstTry: false,
        }
      }

      // Check if remaining pieces can fit
      if (!hasValidMove(boardAfterPlace, remainingPieces)) {
        return {
          ...state,
          board: boardAfterPlace,
          tray: newTray,
          selectedPieceIndex: null,
          score: newScore,
          phase: "GAME_OVER",
        }
      }

      return {
        ...state,
        board: boardAfterPlace,
        tray: newTray,
        selectedPieceIndex: null,
        score: newScore,
      }
    }

    case "CLEAR_COMPLETE": {
      // Actually remove the cleared lines
      const boardAfterClear = clearLines(
        state.board,
        state.clearingRows,
        state.clearingCols
      )

      const remainingPieces = state.tray.filter(Boolean) as GamePiece[]

      if (remainingPieces.length === 0) {
        return {
          ...state,
          board: boardAfterClear,
          clearingRows: [],
          clearingCols: [],
          phase: "QUESTION",
          wasFirstTry: false,
        }
      }

      // Check if remaining pieces can fit after clear
      if (!hasValidMove(boardAfterClear, remainingPieces)) {
        return {
          ...state,
          board: boardAfterClear,
          clearingRows: [],
          clearingCols: [],
          phase: "GAME_OVER",
        }
      }

      return {
        ...state,
        board: boardAfterClear,
        clearingRows: [],
        clearingCols: [],
        phase: "PLACING",
      }
    }

    case "RESTART":
      return createInitialState()

    default:
      return state
  }
}

// ── Hook ───────────────────────────────────────────────────────

export interface UseBlastGameReturn {
  state: BlastGameState
  startGame: (answerMode: AnswerMode, promptSide: PromptSide) => void
  submitAnswer: (answer: string) => "correct" | "close" | "wrong"
  acknowledgeWrong: () => void
  selectPiece: (index: number) => void
  placePieceAt: (row: number, col: number) => boolean
  /** Directly place a specific piece (used by drag-and-drop). */
  placePieceDirect: (pieceIndex: number, row: number, col: number) => boolean
  finishClearing: () => void
  restart: () => void
  /** Whether the selected piece can be placed at (row, col). */
  canPlaceAt: (row: number, col: number) => boolean
}

export function useBlastGame(cards: FlashCard[]): UseBlastGameReturn {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)
  const poolRef = useRef<QuestionPool | null>(null)

  // Serve the next question from the pool
  const serveQuestion = useCallback(() => {
    if (!poolRef.current) return
    const q = poolRef.current.next()
    dispatch({ type: "SET_QUESTION", question: q })
  }, [])

  // When phase transitions to QUESTION, auto-serve a question
  useEffect(() => {
    if (state.phase === "QUESTION" && !state.currentQuestion) {
      serveQuestion()
    }
  }, [state.phase, state.currentQuestion, serveQuestion])

  const startGame = useCallback(
    (answerMode: AnswerMode, promptSide: PromptSide) => {
      poolRef.current = new QuestionPool(cards, answerMode, promptSide)
      dispatch({ type: "START_GAME", answerMode, promptSide })
    },
    [cards]
  )

  const submitAnswer = useCallback(
    (answer: string): "correct" | "close" | "wrong" => {
      if (!state.currentQuestion) return "wrong"

      if (state.answerMode === "mc") {
        // MC: exact match on selected option
        if (answer === state.currentQuestion.correctAnswer) {
          dispatch({ type: "ANSWER_CORRECT" })
          return "correct"
        }
        dispatch({ type: "ANSWER_WRONG" })
        return "wrong"
      }

      // Typed: use Levenshtein
      const result = matchAnswer(answer, state.currentQuestion.correctAnswer)
      if (result === "exact" || result === "close") {
        dispatch({ type: "ANSWER_CORRECT" })
        return result === "exact" ? "correct" : "close"
      }
      dispatch({ type: "ANSWER_WRONG" })
      return "wrong"
    },
    [state.currentQuestion, state.answerMode]
  )

  const selectPiece = useCallback(
    (index: number) => {
      if (state.phase !== "PLACING") return
      if (state.tray[index] === null) return
      dispatch({ type: "SELECT_PIECE", index })
    },
    [state.phase, state.tray]
  )

  const canPlaceAt = useCallback(
    (row: number, col: number): boolean => {
      if (state.phase !== "PLACING" || state.selectedPieceIndex === null)
        return false
      const piece = state.tray[state.selectedPieceIndex]
      if (!piece) return false
      return canPlace(state.board, piece.shape, row, col)
    },
    [state.phase, state.selectedPieceIndex, state.tray, state.board]
  )

  const placePieceAt = useCallback(
    (row: number, col: number): boolean => {
      if (!canPlaceAt(row, col)) return false
      dispatch({ type: "PLACE_PIECE", row, col })
      return true
    },
    [canPlaceAt]
  )

  const acknowledgeWrong = useCallback(() => {
    dispatch({ type: "ACKNOWLEDGE_WRONG" })
  }, [])

  const finishClearing = useCallback(() => {
    dispatch({ type: "CLEAR_COMPLETE" })
  }, [])

  const restart = useCallback(() => {
    dispatch({ type: "RESTART" })
  }, [])

  const placePieceDirect = useCallback(
    (pieceIndex: number, row: number, col: number): boolean => {
      if (state.phase !== "PLACING") return false
      const piece = state.tray[pieceIndex]
      if (!piece) return false
      if (!canPlace(state.board, piece.shape, row, col)) return false
      dispatch({ type: "PLACE_PIECE_DIRECT", pieceIndex, row, col })
      return true
    },
    [state.phase, state.tray, state.board]
  )

  return {
    state,
    startGame,
    submitAnswer,
    acknowledgeWrong,
    selectPiece,
    placePieceAt,
    placePieceDirect,
    finishClearing,
    restart,
    canPlaceAt,
  }
}
