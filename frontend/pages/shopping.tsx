// frontend/pages/shopping.tsx
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { api } from "@/lib/api";

const CATEGORY_EMOJI: Record<string, string> = {
  meat: "🥩", vegetable: "🥬", staple: "🍚", seasoning: "🧂", other: "📦",
};

export default function ShoppingPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/shopping-list")
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  const togglePurchased = async (item: any) => {
    await api.put("/shopping-list", {
      items: [{ id: item.id, purchased: !item.purchased }],
    });
    setItems(items.map((i) => i.id === item.id ? { ...i, purchased: !i.purchased } : i));
  };

  const grouped: Record<string, any[]> = {};
  items.forEach((i) => {
    if (!grouped[i.category]) grouped[i.category] = [];
    grouped[i.category].push(i);
  });
  const sortedCategories = Object.entries(grouped).sort(([a], [b]) => {
    const order = ["meat", "vegetable", "staple", "seasoning", "other"];
    return order.indexOf(a) - order.indexOf(b);
  });

  const copyToClipboard = () => {
    const unpurchased = items.filter((i) => !i.purchased);
    const text = unpurchased.map((i) => `${i.name} ${i.total_grams}g`).join("\n");
    navigator.clipboard.writeText(text).then(() => alert("已复制到剪贴板！"));
  };

  if (loading) return <Layout><div className="text-center py-12 text-gray-400">加载中...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">🛒 购物清单</h1>
          <button onClick={copyToClipboard}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            📋 一键复制
          </button>
        </div>

        {sortedCategories.map(([category, catItems]) => (
          <div key={category} className="mb-6">
            <h2 className="font-bold text-sm text-gray-500 mb-2">
              {CATEGORY_EMOJI[category]} {category === "meat" ? "肉类" : category === "vegetable" ? "蔬菜" : category === "staple" ? "主食" : category === "seasoning" ? "调料" : "其他"}
            </h2>
            <div className="space-y-1">
              {catItems.map((item) => (
                <div key={item.id}
                  onClick={() => togglePurchased(item)}
                  className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    item.purchased ? "bg-gray-50 opacity-50" : "bg-white border border-green-50 hover:bg-green-50/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={item.purchased} onChange={() => {}} className="w-4 h-4 accent-primary" />
                    <span className={`text-sm ${item.purchased ? "line-through text-gray-400" : "text-gray-700"}`}>
                      {item.name}
                    </span>
                    {item.source_recipes?.length > 0 && (
                      <span className="text-xs text-gray-400">来自：{item.source_recipes.join("、")}</span>
                    )}
                  </div>
                  <span className="font-bold text-primary text-sm tabular-nums">{item.total_grams}g</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            购物清单为空。<br/>去"饮食计划"页面生成购物清单！
          </div>
        )}
      </div>
    </Layout>
  );
}
