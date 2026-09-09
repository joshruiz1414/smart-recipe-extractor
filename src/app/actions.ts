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

export async function saveRecipe(data: {
  title: string
  sourceUrl: string
  ingredients: string[]
  instructions: string[]
}) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("You must be signed in to save recipes.")
  }

  const recipe = await prisma.savedRecipe.create({
    data: {
      title: data.title,
      sourceUrl: data.sourceUrl,
      ingredients: data.ingredients,
      instructions: data.instructions,
      userId: session.user.id,
    },
  })

  revalidatePath("/saved-recipes")
  return recipe
}