"use server"

import { auth, signIn, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function handleSignIn() {
    await signIn("google")
}

export async function handleSignOut() {
    await signOut()
}

export async function deleteRecipe(recipeId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "UNAUTHORIZED" }
  }

  try {
    await prisma.savedRecipe.deleteMany({
      where: {
        id: recipeId,
        userId: session.user.id,
      },
    })

    revalidatePath("/saved-recipes")
    return { success: true }
  } catch (error) {
    console.error("Error deleting recipe:", error)
    return { success: false, error: "FAILED_TO_DELETE" }
  }
}

export async function getSavedRecipeById(recipeId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "UNAUTHORIZED" }
  }

  try {
    const recipe = await prisma.savedRecipe.findFirst({
      where: {
        id: recipeId,
        userId: session.user.id,
      },
    })

    if (!recipe) {
      return { success: false, error: "NOT_FOUND" }
    }

    return { success: true, recipe }
  } catch (error) {
    console.error("Error fetching saved recipe:", error)
    return { success: false, error: "SERVER_ERROR" }
  }
}

export async function saveRecipe(data: {
    title: string
    sourceUrl?: string
    ingredients: string[]
    instructions: string[]
}) {
        const session = await auth()

        if (!session?.user?.id) {
            return { success: false, error: "UNAUTHORIZED" }
        }

        // check if the user already saved this recipe
        const existingRecipe = await prisma.savedRecipe.findFirst({
            where: {
                userId: session.user.id,
                OR: [
                    // match by exact source URL if available
                    ...(data.sourceUrl ? [{ sourceUrl: data.sourceUrl }] : []),
                    // fall back to matching by exact title
                    { title: data.title },
                ],
            },
        })

        // if it already exists return already saved
        if (existingRecipe) {
            return { success: false, error: "ALREADY_SAVED" }
        }

        const recipe = await prisma.savedRecipe.create({
            data: {
                title: data.title,
                sourceUrl: data.sourceUrl || "",
                ingredients: data.ingredients,
                instructions: data.instructions,
                userId: session.user.id,
            },
        })

        revalidatePath("/saved-recipes")
        return { success: true, recipe }

    }