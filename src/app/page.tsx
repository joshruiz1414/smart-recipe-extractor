import { auth } from "@/auth"
import { AuthButton } from "@/components/auth-button"
import { RecipeExtractor } from "@/components/RecipeExtractor"

export default async function Home() {
  const session = await auth()

  return (
    <main className="container mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Smart Recipe Extractor</h1>
        <AuthButton session={session} />
      </header>

      {/* extractor UI */}
      <RecipeExtractor session={session} />
    </main>
  )
}