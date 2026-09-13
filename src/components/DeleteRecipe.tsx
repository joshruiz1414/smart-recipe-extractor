"use client"

import { useState } from "react"
import { deleteRecipe } from "@/app/actions"

export function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this saved recipe?")) {
      return
    }

    try {
      setIsDeleting(true)
      const res = await deleteRecipe(recipeId)

      if (!res.success) {
        alert("Failed to delete recipe. Please try again.")
        setIsDeleting(false)
      }
    } catch (error) {
      console.error("Delete failed:", error)
      alert("An unexpected error occurred.")
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-xs px-2.5 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/50 disabled:opacity-50 transition"
      title="Delete recipe"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  )
}