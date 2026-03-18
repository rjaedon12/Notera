"use client"

interface Collaborator {
  connectionId: number
  presence: {
    userName: string
    userColor: string
    cursor: { x: number; y: number } | null
  } | null
  info?: {
    name?: string
    image?: string
    color?: string
  }
}

interface PresenceAvatarsProps {
  collaborators: Collaborator[]
}

export function PresenceAvatars({ collaborators }: PresenceAvatarsProps) {
  const activeCollabs = collaborators.filter((c) => c.presence)
  if (activeCollabs.length === 0) return null

  const maxShow = 4
  const shown = activeCollabs.slice(0, maxShow)
  const overflow = activeCollabs.length - maxShow

  return (
    <div className="flex items-center -space-x-2 mr-2">
      {shown.map((c) => {
        const name = c.presence?.userName || c.info?.name || "?"
        const color = c.presence?.userColor || c.info?.color || "#868e96"
        const image = c.info?.image
        const initials = name.charAt(0).toUpperCase()

        return (
          <div
            key={c.connectionId}
            className="relative group"
            title={name}
          >
            {image ? (
              <img
                src={image}
                alt={name}
                className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 object-cover"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[11px] font-semibold text-white"
                style={{ backgroundColor: color }}
              >
                {initials}
              </div>
            )}

            {/* Online indicator */}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 bg-green-400"
            />

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-zinc-800 dark:bg-zinc-700 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {name}
            </div>
          </div>
        )
      })}

      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-300 dark:bg-zinc-600 flex items-center justify-center text-[10px] font-semibold text-zinc-700 dark:text-zinc-200">
          +{overflow}
        </div>
      )}
    </div>
  )
}
