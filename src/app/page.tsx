import { auth } from "@/auth"
import { AuthButton } from "@/components/authButton"
import { RecipeExtractor } from "@/components/RecipeExtractor"

export default async function Home() {
  const session = await auth()

  return (
    <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-6 overflow-x-hidden min-h-dvh">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 sm:pb-0 sm:border-0">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Smart Recipe Extractor
        </h1>
        <div className="self-end sm:self-auto">
          <AuthButton session={session} />
        </div>
      </header>

      {/* extractor UI */}
      <section className="w-full">
        <RecipeExtractor session={session} />
      </section>
    </main>
  )
}