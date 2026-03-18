"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import { useWhiteboardCanvas } from "@/hooks/useWhiteboardCanvas"
import { Canvas } from "@/components/whiteboard/Canvas"
import { Toolbar } from "@/components/whiteboard/Toolbar"
import { TopBar } from "@/components/whiteboard/TopBar"
import { Cursors } from "@/components/whiteboard/Cursors"
import { ShareDialog } from "@/components/whiteboard/ShareDialog"
import { getBoard, updateBoard, createShareLink } from "@/lib/whiteboard/actions"
import { exportAsPng, exportAsPdf, generateThumbnail } from "@/lib/whiteboard/export-utils"
import { RoomProvider, useOthers, useUpdateMyPresence, useBroadcastEvent, useEventListener } from "@/lib/whiteboard/liveblocks.config"
import type { WhiteboardElement, BackgroundType, Presence } from "@/lib/whiteboard/types"
import { USER_COLORS } from "@/lib/whiteboard/types"
import { useDebouncedCallback } from "use-debounce"

function BoardCanvas() {
  const params = useParams()
  const boardId = params.boardId as string
  const { data: session } = useSession()
  const userId = session?.user?.id || "anonymous"
  const userName = session?.user?.name || "Anonymous"
  const userColor = USER_COLORS[userName.charCodeAt(0) % USER_COLORS.length]

  const [boardTitle, setBoardTitle] = useState("Untitled Board")
  const [showShare, setShowShare] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)

  const {
    canvasRef,
    elements,
    setElements,
    tool,
    setTool,
    camera,
    style,
    setStyle,
    background,
    setBackground,
    bgColor,
    setBgColor,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    undo,
    redo,
    clearAll,
    zoomIn,
    zoomOut,
    resetZoom,
    canUndo,
    canRedo,
    editingTextId,
    setEditingTextId,
    updateTextContent,
    addImage,
  } = useWhiteboardCanvas({
    userId,
    onElementsChange: (newElements) => {
      debouncedSave(newElements)
      broadcastElementsRef.current?.(newElements)
    },
  })

  // Liveblocks hooks
  const others = useOthers()
  const updateMyPresence = useUpdateMyPresence()
  const broadcastEvent = useBroadcastEvent()

  // Store broadcast function in a ref so the canvas hook callback can access it
  const broadcastElementsRef = useRef<((elements: WhiteboardElement[]) => void) | null>(null)
  const lastBroadcastTime = useRef(0)

  // Track if we are currently drawing to avoid overwriting our own strokes
  const isLocallyDrawing = useRef(false)

  broadcastElementsRef.current = useCallback(
    (newElements: WhiteboardElement[]) => {
      const now = Date.now()
      // Throttle broadcasts to prevent glitches but keep it responsive
      if (now - lastBroadcastTime.current < 100) return
      lastBroadcastTime.current = now
      isLocallyDrawing.current = true
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        broadcastEvent({ type: "elements-update", elements: newElements, senderId: userId } as any)
      } catch {
        // Silent broadcast failure
      }
      // Reset flag after a brief delay
      setTimeout(() => { isLocallyDrawing.current = false }, 150)
    },
    [broadcastEvent, userId]
  )

  // Listen for element updates from collaborators
  useEventListener(({ event }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = event as any
    if (e.type === "elements-update" && e.elements) {
      // Don't apply our own broadcasts back, and don't overwrite while actively drawing
      if (e.senderId === userId) return
      if (isLocallyDrawing.current) return
      setElements(e.elements)
    }
  })

  // Update presence (cursor + tool)
  const handleCursorMove = useCallback(
    (x: number, y: number) => {
      updateMyPresence({
        cursor: isNaN(x) ? null : { x, y },
        selectedTool: tool,
        userName,
        userColor,
        userId,
      } as Presence)
    },
    [updateMyPresence, tool, userName, userColor, userId]
  )

  // Save to DB (debounced 2s)
  const debouncedSave = useDebouncedCallback(async (newElements: WhiteboardElement[]) => {
    try {
      const thumbnail = await generateThumbnail(newElements, bgColor)
      await updateBoard(boardId, {
        elements: newElements,
        thumbnail,
        background,
        bgColor,
      })
    } catch {
      // Silent save failure — don't disrupt the user
    }
  }, 2000)

  // Load board on mount
  useEffect(() => {
    async function load() {
      try {
        const board = await getBoard(boardId)
        setBoardTitle(board.title)
        setElements(board.elements || [])
        setBackground(board.background)
        setBgColor(board.bgColor)
        setInitialLoaded(true)
      } catch (err) {
        toast.error("Failed to load board")
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId])

  // Save title changes
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setBoardTitle(newTitle)
      updateBoard(boardId, { title: newTitle }).catch(() => {})
    },
    [boardId]
  )

  // Background change
  const handleBackgroundChange = useCallback(
    (bg: BackgroundType) => {
      setBackground(bg)
      updateBoard(boardId, { background: bg }).catch(() => {})
    },
    [boardId, setBackground]
  )

  // Export handlers
  const handleExportPng = useCallback(async () => {
    try {
      const dataUrl = await exportAsPng(elements, camera, bgColor)
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `${boardTitle}.png`
      link.click()
      toast.success("PNG exported!")
    } catch {
      toast.error("Export failed")
    }
  }, [elements, camera, bgColor, boardTitle])

  const handleExportPdf = useCallback(async () => {
    try {
      await exportAsPdf(elements, camera, bgColor, boardTitle)
      toast.success("PDF exported!")
    } catch {
      toast.error("Export failed")
    }
  }, [elements, camera, bgColor, boardTitle])

  // Share link
  const handleCreateShareLink = useCallback(
    async (permission: "EDITOR" | "VIEWER") => {
      return await createShareLink(boardId, permission)
    },
    [boardId]
  )

  // Image upload from top bar
  const handleImageUpload = useCallback(
    (dataUrl: string, width: number, height: number) => {
      // Place in center of current viewport
      const viewCenterX = -camera.x / camera.zoom + (window.innerWidth / 2) / camera.zoom
      const viewCenterY = -camera.y / camera.zoom + (window.innerHeight / 2) / camera.zoom
      addImage(dataUrl, viewCenterX - width / 2, viewCenterY - height / 2, width, height)
    },
    [camera, addImage]
  )

  // Build collaborators for cursors
  const collaborators = others.map((other) => ({
    connectionId: other.connectionId,
    presence: other.presence as Presence | null,
    info: other.info as { name?: string; image?: string; color?: string } | undefined,
  }))

  if (!initialLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <div className="animate-pulse text-zinc-400">Loading board...</div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950">
      <TopBar
        title={boardTitle}
        onTitleChange={handleTitleChange}
        onShare={() => setShowShare(true)}
        camera={camera}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        background={background}
        onBackgroundChange={handleBackgroundChange}
        onExportPng={handleExportPng}
        onExportPdf={handleExportPdf}
        onClear={clearAll}
        onImageUpload={handleImageUpload}
        collaborators={collaborators as Parameters<typeof TopBar>[0]["collaborators"]}
      />

      <Canvas
        canvasRef={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        tool={tool}
        camera={camera}
        onCursorMove={handleCursorMove}
        elements={elements}
        editingTextId={editingTextId}
        onTextChange={updateTextContent}
        onTextBlur={() => setEditingTextId(null)}
      />

      <Cursors collaborators={collaborators as Parameters<typeof Cursors>[0]["collaborators"]} camera={camera} />

      <Toolbar
        tool={tool}
        setTool={setTool}
        style={style}
        setStyle={setStyle}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <ShareDialog
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        onCreateLink={handleCreateShareLink}
        boardTitle={boardTitle}
      />
    </div>
  )
}

// Wrap with Liveblocks RoomProvider
export default function WhiteboardBoardPage() {
  const params = useParams()
  const boardId = params.boardId as string

  return (
    <RoomProvider
      id={`board:${boardId}`}
      initialPresence={{
        cursor: null,
        selectedTool: "pen",
        userName: "",
        userColor: "#1971c2",
        userId: "",
      }}
      initialStorage={{}}
    >
      <BoardCanvas />
    </RoomProvider>
  )
}
