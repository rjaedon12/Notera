import { notFound } from "next/navigation"

// Tags feature removed — Tag model no longer in schema.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function TagPage(_props: { params: Promise<{ slug: string }> }) {
  notFound()
}
