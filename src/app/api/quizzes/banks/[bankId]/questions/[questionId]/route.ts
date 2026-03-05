const gone = () => Response.json({ error: "This feature is no longer available" }, { status: 410 })
export const PATCH = gone
export const DELETE = gone
