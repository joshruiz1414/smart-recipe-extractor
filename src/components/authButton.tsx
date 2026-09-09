"use client"

import Link from "next/link"
import { handleSignIn, handleSignOut } from "@/app/actions"

export function AuthButton({ session }: { session: any }) {
  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        {/* button for logged in users */}
          <Link
            href="/saved-recipes"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Saved Recipes
          </Link>

        <p className="text-sm">Logged in as {session.user.email}</p>
        <button
          onClick={() => handleSignOut()}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => handleSignIn()}
      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
    >
      Sign in with Google
    </button>
  )
}