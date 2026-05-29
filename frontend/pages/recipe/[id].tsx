// frontend/pages/recipe/[id].tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import RecipeDetailView from "@/components/recipe/RecipeDetail";
import { api } from "@/lib/api";

export default function RecipePage() {
  const router = useRouter();
  const { id } = router.query;
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/recipes/${id}`).then(setRecipe).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <Layout><div className="text-center py-12 text-gray-400">加载中...</div></Layout>;
  if (!recipe) return <Layout><div className="text-center py-12 text-gray-400">食谱不存在</div></Layout>;

  return <Layout><RecipeDetailView recipe={recipe} /></Layout>;
}
