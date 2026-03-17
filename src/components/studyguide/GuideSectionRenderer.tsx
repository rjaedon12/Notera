"use client"

import type { GuideSection, GuideProblemProgress, GuideNote } from "@/types/studyguide"
import { TheoremCard } from "./TheoremCard"
import { DefinitionCard } from "./DefinitionCard"
import { WorkedExample } from "./WorkedExample"
import { PracticeProblem } from "./PracticeProblem"
import { NoteCard } from "./NoteCard"
import { DiagramViewer } from "./DiagramViewer"
import { HighlightableText, NoteSidebar } from "./AnnotationTools"
import type { HighlightColor, GuideHighlight } from "@/types/studyguide"
import {
  InscribedAngleDiagram,
  InscribedQuadrilateralDiagram,
  TangentChordDiagram,
  ChordsInsideDiagram,
  SecantsExternalDiagram,
  ChordSegmentsDiagram,
  SecantTangentDiagram,
  CircleCoordinateDiagram,
  ArcLengthSectorDiagram,
  SemicircleAngleDiagram,
  SecantSegmentsDiagram,
} from "./diagrams/CircleDiagrams"
import {
  PositionTimeDiagram,
  VelocityTimeDiagram,
  FreeBodyDiagram,
  ActionReactionDiagram,
  WorkAngleDiagram,
  ImpulseGraphDiagram,
  CollisionTypesDiagram,
  RotationalMotionDiagram,
  TorqueDiagram,
} from "./diagrams/PhysicsDiagrams"
import { LatexRenderer } from "./LatexRenderer"

// Map string names to actual diagram components
const diagramMap: Record<string, React.ReactNode> = {
  // Geometry — Circles
  InscribedAngleDiagram: <InscribedAngleDiagram className="w-full h-auto" />,
  InscribedQuadrilateralDiagram: <InscribedQuadrilateralDiagram className="w-full h-auto" />,
  TangentChordDiagram: <TangentChordDiagram className="w-full h-auto" />,
  ChordsInsideDiagram: <ChordsInsideDiagram className="w-full h-auto" />,
  SecantsExternalDiagram: <SecantsExternalDiagram className="w-full h-auto" />,
  ChordSegmentsDiagram: <ChordSegmentsDiagram className="w-full h-auto" />,
  SecantTangentDiagram: <SecantTangentDiagram className="w-full h-auto" />,
  CircleCoordinateDiagram: <CircleCoordinateDiagram className="w-full h-auto" />,
  ArcLengthSectorDiagram: <ArcLengthSectorDiagram className="w-full h-auto" />,
  SemicircleAngleDiagram: <SemicircleAngleDiagram className="w-full h-auto" />,
  SecantSegmentsDiagram: <SecantSegmentsDiagram className="w-full h-auto" />,
  // Physics — Mechanics
  PositionTimeDiagram: <PositionTimeDiagram className="w-full h-auto" />,
  VelocityTimeDiagram: <VelocityTimeDiagram className="w-full h-auto" />,
  FreeBodyDiagram: <FreeBodyDiagram className="w-full h-auto" />,
  ActionReactionDiagram: <ActionReactionDiagram className="w-full h-auto" />,
  WorkAngleDiagram: <WorkAngleDiagram className="w-full h-auto" />,
  ImpulseGraphDiagram: <ImpulseGraphDiagram className="w-full h-auto" />,
  CollisionTypesDiagram: <CollisionTypesDiagram className="w-full h-auto" />,
  RotationalMotionDiagram: <RotationalMotionDiagram className="w-full h-auto" />,
  TorqueDiagram: <TorqueDiagram className="w-full h-auto" />,
}

interface GuideSectionRendererProps {
  section: GuideSection
  problemProgress: GuideProblemProgress | null
  highlights: GuideHighlight[]
  notes: GuideNote[]
  onSubmitAnswer: (problemId: string, choiceId: string, isCorrect: boolean) => void
  onHighlight: (text: string, color: HighlightColor) => void
  onRemoveHighlight: (id: string) => void
  onAddNote: (sectionId: string, text: string) => void
  onUpdateNote: (noteId: string, text: string) => void
  onDeleteNote: (noteId: string) => void
}

export function GuideSectionRenderer({
  section,
  problemProgress,
  highlights,
  notes,
  onSubmitAnswer,
  onHighlight,
  onRemoveHighlight,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: GuideSectionRendererProps) {
  const sectionNotes = notes.filter((n) => n.sectionId === section.id)

  const wrapWithAnnotations = (children: React.ReactNode) => (
    <div className="space-y-2">
      <HighlightableText
        sectionId={section.id}
        highlights={highlights}
        onHighlight={(text, color) => onHighlight(text, color)}
        onRemoveHighlight={onRemoveHighlight}
      >
        {children}
      </HighlightableText>
      {/* Notes for this section */}
      <NoteSidebar
        sectionId={section.id}
        notes={sectionNotes}
        onAdd={onAddNote}
        onUpdate={onUpdateNote}
        onDelete={onDeleteNote}
      />
    </div>
  )

  switch (section.type) {
    case "theorem":
    case "postulate":
    case "corollary":
      return wrapWithAnnotations(
        <TheoremCard
          title={section.title ?? "Theorem"}
          content={section.content}
          keyTakeaway={section.keyTakeaway}
          type={section.type}
        />
      )

    case "definition":
      return wrapWithAnnotations(
        <DefinitionCard
          title={section.title ?? "Definition"}
          content={section.content}
        />
      )

    case "example":
      return wrapWithAnnotations(
        <WorkedExample
          title={section.title ?? "Example"}
          content={section.content}
          steps={section.steps ?? []}
        />
      )

    case "practice":
      if (!section.problem) return null
      return wrapWithAnnotations(
        <PracticeProblem
          problem={section.problem}
          questionText={section.content}
          existingProgress={problemProgress}
          onSubmit={onSubmitAnswer}
        />
      )

    case "diagram":
      return wrapWithAnnotations(
        <DiagramViewer
          component={
            section.imageComponent && diagramMap[section.imageComponent]
              ? diagramMap[section.imageComponent]
              : null
          }
          caption={section.content}
        />
      )

    case "note":
      return wrapWithAnnotations(
        <NoteCard title={section.title} content={section.content} />
      )

    default:
      return wrapWithAnnotations(
        <div className="text-sm">
          <LatexRenderer content={section.content} />
        </div>
      )
  }
}
