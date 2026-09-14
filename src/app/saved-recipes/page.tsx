import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { DeleteRecipeButton } from "@/components/DeleteRecipe"

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
  <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 min-h-dvh overflow-x-hidden">
    {/* header */}
    <div className="flex flex-col sm:flex-row w-full sm:items-center justify-between gap-3 border-b pb-4 sm:pb-0 sm:border-0">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
        Your Saved Recipes
      </h1>
      <Link
        href="/"
        className="self-start sm:self-auto text-xs sm:text-sm px-3 py-2 rounded-md border border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800 transition-colors"
      >
        ← Back to Extractor
      </Link>
    </div>

    {recipes.length === 0 ? (
      <p className="text-neutral-500 text-sm sm:text-base">
        You haven't saved any recipes yet.
      </p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="p-4 border rounded-xl shadow-sm space-y-3 bg-white dark:bg-slate-950 border-neutral-200 dark:border-neutral-800 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <h2 className="font-bold text-lg text-neutral-900 dark:text-slate-100 leading-snug break-words">
                {recipe.title}
              </h2>

              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline block truncate max-w-full"
              >
                {recipe.sourceUrl}
              </a>

              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {recipe.ingredients.length} ingredients · {recipe.instructions.length} steps
              </p>
            </div>

            {/* actions footer*/}
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-900">
              <Link
                href={`/?savedId=${recipe.id}`}
                className="inline-flex items-center justify-center text-xs px-3 py-2 font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 dark:bg-indigo-950/60 dark:border-indigo-900/60 dark:text-indigo-300 transition-colors"
              >
                Use Recipe
              </Link>
              <DeleteRecipeButton recipeId={recipe.id} />
            </div>
          </div>
        ))}
      </div>
    )}
  </main>
)
}