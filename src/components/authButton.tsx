"use client"

import { handleSignIn, handleSignOut } from "@/app/actions"

export function AuthButton({ session }: { session: any }) {
  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
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