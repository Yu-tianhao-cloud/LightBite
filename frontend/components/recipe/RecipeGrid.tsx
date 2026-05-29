// frontend/components/recipe/RecipeGrid.tsx
import { useState, useEffect } from "react";
import RecipeCard from "./RecipeCard";
import { api } from "@/lib/api";

export default function RecipeGrid() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tag, setTag] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("search") || "");
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (tag) params.set("tag", tag);
    if (sort) params.set("sort", sort);
    api.get(`/recipes?${params.toString()}`)
      .then((data) => setRecipes(data.items))
      .finally(() => setLoading(false));
  }, [search, tag, sort]);

  const tags = [
    { key: "低卡", label: "🔥 低卡 <400kcal" },
    { key: "高蛋白", label: "💪 增肌高蛋白" },
    { key: "素食", label: "🥬 素食" },
    { key: "快手", label: "⏱️ 快手15分钟" },
  ];

  return (
    <div>
      <div className="bg-gradient-to-br from-primary-light to-green-100 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-extrabold text-primary-dark mb-1">精准到克的健康饮食 🎯</h1>
          <p className="text-sm text-primary-dark/70 mb-4">每一份食谱都标注精确克数和营养数据，减脂也能吃得明明白白</p>
          <div className="flex gap-2 flex-wrap">
            {tags.map((t) => (
              <button key={t.key} onClick={() => setTag(tag === t.key ? "" : t.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  tag === t.key ? "bg-primary text-white" : "bg-white/70 text-primary hover:bg-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h2 className="text-base font-bold text-gray-700">🍽️ {tag || "全部"}食谱</h2>
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5"
        >
          <option value="newest">最新</option>
          <option value="calories_asc">热量从低到高</option>
          <option value="calories_desc">热量从高到低</option>
          <option value="protein_desc">蛋白质最多</option>
        </select>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-8">
        {loading ? (
          <div className="text-center text-gray-400 py-12">加载中...</div>
        ) : recipes.length === 0 ? (
          <div className="text-center text-gray-400 py-12">暂无食谱</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recipes.map((r) => <RecipeCard key={r.id} {...r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
