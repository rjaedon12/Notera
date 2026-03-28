export { BLOCK_COLORS, PIECE_SHAPES, generatePieceSet, pieceSize } from "./pieces"
export type { BlockColor, PieceShape, GamePiece } from "./pieces"

export {
  createEmptyBoard,
  canPlace,
  placePiece,
  findCompletedLines,
  clearLines,
  hasValidMove,
  BOARD_SIZE,
} from "./board"
export type { Cell, Board } from "./board"

export {
  createScoreState,
  calculatePlacementScore,
} from "./scoring"
export type { ScoreState, ScoreDelta } from "./scoring"

export { buildQuestionPool, QuestionPool } from "./questions"
export type { AnswerMode, PromptSide, BlastQuestion } from "./questions"
