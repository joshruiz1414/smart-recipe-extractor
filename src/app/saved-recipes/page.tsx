import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function SavedRecipesPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/")
  }

  const recipes = await prisma.savedRecipe.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
<main className="max-w-4xl mx-auto p-6 space-y-6">

<div className="flex w-full items-center gap-10">
  <h1 className="text-2xl font-bold">Your Saved Recipes</h1>
  <Link href="/" className="ml-auto text-sm px-3 py-1.5 rounded-md border border-neutral-300 hover:bg-neutral-100 light:border-neutral-700 dark:hover:bg-neutral-800">
    ← Back to Extractor
  </Link>
</div>
      {recipes.length === 0 ? (
        <p className="text-neutral-500">You haven't saved any recipes yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="p-4 border rounded-lg shadow-sm space-y-2">
              <h2 className="font-semibold text-lg">{recipe.title}</h2>
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline block truncate"
              >
                {recipe.sourceUrl}
              </a>
              <p className="text-xs text-neutral-400">
                {recipe.ingredients.length} ingredients · {recipe.instructions.length} steps
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}