// frontend/components/recipe/RecipeCard.tsx
import Link from "next/link";

const EMOJIS = ["🍗", "🥗", "🍲", "🥑", "🐟", "🥩", "🍝", "🥘"];

interface RecipeCardProps {
  id: number;
  name: string;
  image_url: string | null;
  cooking_time_minutes: number | null;
  default_servings: number;
  total_calories: number | null;
  total_protein_grams: number | null;
  total_carbs_grams: number | null;
}

export default function RecipeCard({ id, name, cooking_time_minutes, default_servings, total_calories, total_protein_grams, total_carbs_grams }: RecipeCardProps) {
  const emoji = EMOJIS[id % EMOJIS.length];

  return (
    <Link href={`/recipe/${id}`} className="block bg-white rounded-xl overflow-hidden border border-green-50 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="h-28 bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center text-5xl">
        {emoji}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold text-gray-800 mb-1 truncate">{name}</h3>
        <div className="flex gap-2 text-xs text-gray-400 mb-2">
          {cooking_time_minutes && <span>⏱️ {cooking_time_minutes}分钟</span>}
          <span>🍽️ {default_servings}人份</span>
        </div>
        <div className="flex gap-2 text-xs">
          {total_calories && <span className="text-accent font-bold">🔥 {total_calories} kcal</span>}
          {total_protein_grams && <span className="text-primary">🥩 {total_protein_grams}g</span>}
          {total_carbs_grams && <span className="text-warm">🍚 {total_carbs_grams}g</span>}
        </div>
      </div>
    </Link>
  );
}
