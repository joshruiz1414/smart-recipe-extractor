"use client";

import { useState, useEffect } from "react"
import { IngredientList } from "@/components/IngredientList";
import { Instructions } from "@/components/Instructions";
import { UrlForm } from "@/components/UrlForm";
import { CookingMode } from "@/components/CookingMode";
import { saveRecipe } from "@/app/actions"
import { getSavedRecipeById } from "@/app/actions"
import { useSearchParams } from "next/navigation"

import { Session } from "next-auth"

interface RecipeExtractorProps {
  session: Session | null
}

interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  sourceUrl: string;
}



export function RecipeExtractor({ session }: RecipeExtractorProps) {
  const [submittedUrl, setSubmittedUrl] = useState("");
  const isAuthenticated = !!session?.user
  const userEmail = session?.user?.email
  // now recipe can be null or Recipe object
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  // false because we aren't fetching anything initially
  const [loading, setLoading] = useState(false);

  // null because there are no errors when the page loads
  const [error, setError] = useState("");

  const searchParams = useSearchParams()
  const savedId = searchParams.get("savedId")



    // track whether user confirmed the extracted recipe
    const [isConfirmed, setIsConfirmed] = useState<boolean | null>(null);

    const [isCookingMode, setIsCookingMode] = useState(false);

    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<string | null>(null)

    const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});

    const [showWarning, setShowWarning] = useState(false);
    const [uncheckedCount, setUncheckedCount] = useState(0);



  // clear function to reset everything
  const handleClear = () => {
    setSubmittedUrl("");
    setRecipe(null);
    setError('');
    setIsConfirmed(null);
    setCheckedIngredients({})
    setShowWarning(false)
    setSaveStatus(null)
  };
  // confirm recipe function
  const handleConfirmRecipe = (confirmed: boolean) => {
    setIsConfirmed(confirmed);
    if (!confirmed) {
      // if user says "No", clear the recipe and prompt them to try another link
      setError("Please check the URL and try extracting again.");
      setRecipe(null);
      setSaveStatus(null)
    }
  };


  const handleToggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleBeginCooking = () => {
    if (!recipe){
      setError("no recipe given");
      return
    }
    const totalIngredients = recipe.ingredients.length;
    const checkedCount = Object.values(checkedIngredients).filter(Boolean).length;
    const missing = totalIngredients - checkedCount;


    if (missing > 0) {
      setUncheckedCount(missing);
      setShowWarning(true);
    } else {
      startCookingMode();
    }
  };

  const startCookingMode = () => {
    setShowWarning(false);
    setIsCookingMode(true);
    setSaveStatus(null)
  };

  const handleCopyIngredients = () => {
    if (!recipe) return;

    const textToCopy = recipe.ingredients.join("\n");
    navigator.clipboard.writeText(textToCopy);

  };

  useEffect(() => {
    if (!savedId) return

    async function loadFromDb() {
      setLoading(true)
      const result = await getSavedRecipeById(savedId!)

      if (result.success && result.recipe) {
        // populate recipe state directly from Supabase
        setRecipe({
          title: result.recipe.title,
          ingredients: result.recipe.ingredients,
          instructions: result.recipe.instructions,
          sourceUrl: result.recipe.sourceUrl,
        })
        setSubmittedUrl(result.recipe.sourceUrl || "")
      } else {
        alert("Could not load the saved recipe.")
      }
      setLoading(false)
    }

    loadFromDb()
  }, [savedId])

    const handleSave = async () => {
    if (!session?.user) {
      alert("Please sign in to save recipes.")
      return
    }

    if (!recipe) return

    try {
      setIsSaving(true)
      setSaveStatus(null)

      const result = await saveRecipe({
        title: recipe.title,
        sourceUrl: recipe.sourceUrl || "",
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
      })

if (result.success) {
      setSaveStatus("Saved!")
    } else if (result.error === "ALREADY_SAVED") {
      setSaveStatus("Already Saved")
    } else {
      setSaveStatus("Failed to save")
    }
  } catch (error) {
    console.error("Network or unexpected error:", error)
    setSaveStatus("Failed to save")
  } finally {
    setIsSaving(false)
  }

  }

  const handleSubmit = async (submittedUrl: string) => {
    setSubmittedUrl(submittedUrl);

    setLoading(true);
    setError("");
    setRecipe(null);
    setIsConfirmed(null);
    setCheckedIngredients({})
    setShowWarning(false)

    try {
    // send POST request to API endpoint
    const response = await fetch("/api/parse-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: submittedUrl }), // sends { url: "https://..." }
    });

    const data = await response.json();

    if (!response.ok) {
      // if server returned an error (like 400 or 500)
      setError(data.error || "Failed to parse recipe.");
    } else {
      // success! Store the recipe data in state
      setRecipe(data.recipe);
      console.log('success')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    setError(message);
  } finally {
    // always stop loading, whether it succeeded or failed
    setLoading(false);
  }

};

return (
  <div className="w-full space-y-6">
    {/* auth Banner */}
    {isAuthenticated ? (
      <p className="text-sm text-emerald-600 bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/50">
        Logged in as <span className="font-semibold">{userEmail}</span>. Saved recipes will sync to your account.
      </p>
    ) : (
      <p className="text-sm text-amber-500 bg-amber-950/20 p-3 rounded-lg border border-amber-900/50">
        You are using guest mode. Sign in to save extracted recipes.
      </p>
    )}

    {/* main container*/}
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-6 py-4 font-sans space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-500 tracking-tight">
          Smart Recipe Extractor
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Paste any recipe link below to pull out clean ingredients and instructions.
        </p>
      </div>

      {/* link input form */}
      <UrlForm
        sourceUrl={submittedUrl}
        setUrl={setSubmittedUrl}
        onSubmit={handleSubmit}
        loading={loading}
      />

      {/* error message display */}
      {error && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-200 text-sm rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* cooking mode */}
      {isCookingMode && recipe && (
        <CookingMode
          recipeTitle={recipe.title || "Recipe"}
          instructions={recipe.instructions}
          ingredients={recipe.ingredients}
          onClose={() => setIsCookingMode(false)}
        />
      )}

      {/* recipe output card */}
      {recipe && (
        <div className="border border-indigo-900/80 rounded-xl p-4 sm:p-6 bg-slate-950 text-slate-100 shadow-xl space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 break-words">
              {recipe.title}
            </h2>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs px-3 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-md border border-rose-800 transition-colors cursor-pointer"
              >
                Clear Recipe
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || saveStatus === "Saved!"}
                className={`px-3 py-2 text-xs font-semibold rounded-md text-white transition cursor-pointer ${
                  saveStatus === "Saved!"
                    ? "bg-emerald-600 cursor-default"
                    : "bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                }`}
              >
                {isSaving ? "Saving..." : saveStatus || "Save Recipe"}
              </button>
            </div>
          </div>

          {/* ask if "Is this correct recipe" */}
          {isConfirmed === null && (
            <div className="p-4 bg-indigo-950/70 border border-indigo-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
              <span className="text-indigo-200">Is this the correct recipe you were looking for?</span>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleConfirmRecipe(true)}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded transition-colors cursor-pointer text-xs"
                >
                  Yes, looks good!
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmRecipe(false)}
                  className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer text-xs"
                >
                  No, try again
                </button>
              </div>
            </div>
          )}

          {/* verified Badge & Cooking Start */}
          {isConfirmed === true && (
            <div className="flex flex-col items-center justify-center gap-3 border-b border-slate-800 pb-4 text-center">
              <button
                type="button"
                onClick={handleBeginCooking}
                className="w-full sm:w-auto text-lg sm:text-xl px-6 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 font-bold rounded-lg border border-emerald-800 transition-colors cursor-pointer"
              >
                Begin Cooking!
              </button>
              <h2 className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                ✓ Recipe Verified
              </h2>

              {/* warning for unchecked ingredients */}
              {showWarning && (
                <div className="w-full p-4 bg-amber-950/90 border border-amber-800 rounded-lg space-y-3 text-amber-200 text-sm animate-fade-in text-left">
                  <p className="font-medium">
                    ⚠️ You have <span className="font-bold underline">{uncheckedCount} missing ingredient{uncheckedCount > 1 ? "s" : ""}</span> that haven't been checked off! Do you still want to continue?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={startCookingMode}
                      className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold rounded text-xs transition-colors cursor-pointer"
                    >
                      Yes, Continue Anyway
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWarning(false)}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs transition-colors cursor-pointer"
                    >
                      Go Back & Check List
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* side by side grid on desktop, single column stack on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-6">
            <IngredientList
              ingredients={recipe.ingredients}
              checkedIngredients={checkedIngredients}
              onToggleIngredient={handleToggleIngredient}
            />
            <Instructions instructions={recipe.instructions} />
          </div>
        </div>
      )}
    </div>
  </div>
);
}