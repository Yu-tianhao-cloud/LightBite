import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";

type MealSource = "system" | "custom";

interface RouletteMeal {
  id: string;
  name: string;
  emoji: string;
  calories: number;
  category: string;
  source: MealSource;
  tip: string;
}

const CUSTOM_MEALS_STORAGE_KEY = "lightbite.cheatMealRoulette.customMeals.v1";
const SPIN_DURATION_MS = 2200;

const SYSTEM_MEALS: RouletteMeal[] = [
  {
    id: "system-hotpot",
    name: "火锅局",
    emoji: "🍲",
    calories: 900,
    category: "聚餐系",
    source: "system",
    tip: "优先清汤锅、瘦肉和蔬菜，少蘸油碟，第二天轻一点就好。",
  },
  {
    id: "system-fried-chicken",
    name: "炸鸡",
    emoji: "🍗",
    calories: 720,
    category: "酥脆系",
    source: "system",
    tip: "可以选少酱版本，搭配一份沙拉或无糖饮料，快乐值依然在线。",
  },
  {
    id: "system-burger",
    name: "汉堡套餐",
    emoji: "🍔",
    calories: 800,
    category: "快乐快餐",
    source: "system",
    tip: "薯条可以小份或分享，饮料换无糖，满足感依然很足。",
  },
  {
    id: "system-pizza",
    name: "披萨两角",
    emoji: "🍕",
    calories: 650,
    category: "快乐快餐",
    source: "system",
    tip: "搭配无糖饮料和一份蔬菜，快乐值不减，负担少一点。",
  },
  {
    id: "system-bbq",
    name: "烧烤拼盘",
    emoji: "🍢",
    calories: 850,
    category: "夜宵系",
    source: "system",
    tip: "肉串和蔬菜串一起点，少刷甜辣酱，吃完早点休息。",
  },
  {
    id: "system-boba",
    name: "珍珠奶茶",
    emoji: "🧋",
    calories: 450,
    category: "甜饮系",
    source: "system",
    tip: "建议半糖或三分糖，今天其他甜食就先暂停。",
  },
  {
    id: "system-cake",
    name: "奶油蛋糕",
    emoji: "🍰",
    calories: 420,
    category: "甜品系",
    source: "system",
    tip: "慢慢吃一小块就很幸福，下一餐补点蛋白质和蔬菜。",
  },
  {
    id: "system-ramen",
    name: "拉面加蛋",
    emoji: "🍜",
    calories: 680,
    category: "碳水快乐",
    source: "system",
    tip: "汤底可以少喝一点，多加蛋白质和青菜，满足又更稳。",
  },
  {
    id: "system-steak",
    name: "牛排晚餐",
    emoji: "🥩",
    calories: 760,
    category: "奖励系",
    source: "system",
    tip: "配菜选烤蔬菜或土豆泥都可以，慢慢吃更有仪式感。",
  },
  {
    id: "system-ice-cream",
    name: "冰淇淋",
    emoji: "🍦",
    calories: 320,
    category: "甜品系",
    source: "system",
    tip: "一球刚刚好，认真享受它，不需要过度补偿。",
  },
];

const WHEEL_COLORS = ["#fef3c7", "#fee2e2", "#dcfce7", "#e0f2fe", "#fce7f3", "#ede9fe"];

function getCustomMealTip(calories: number): string {
  if (calories >= 900) {
    return "这顿快乐值很高，建议慢慢吃、吃到七八分饱，下一餐安排清淡蛋白和蔬菜。";
  }
  if (calories >= 500) {
    return "很适合当作一顿小放松，搭配无糖饮料或蔬菜会更平衡。";
  }
  return "轻量快乐餐，可以安心享受，注意别因为太开心又追加第二份。";
}

function getBalanceHint(calories: number): string {
  if (calories >= 900) return "明天可以多走 20 分钟，早餐清爽一点。";
  if (calories >= 600) return "下一餐多一点蔬菜和蛋白质，少一点油炸。";
  return "保持节奏就好，不需要过度补偿。";
}

function isRouletteMeal(value: unknown): value is RouletteMeal {
  if (!value || typeof value !== "object") return false;
  const meal = value as Partial<RouletteMeal>;
  return (
    typeof meal.id === "string" &&
    typeof meal.name === "string" &&
    typeof meal.emoji === "string" &&
    typeof meal.calories === "number" &&
    typeof meal.category === "string" &&
    meal.source === "custom" &&
    typeof meal.tip === "string"
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(radians),
    y: cy + r * Math.sin(radians),
  };
}

function describeSlice(startAngle: number, endAngle: number) {
  const start = polarToCartesian(50, 50, 49, endAngle);
  const end = polarToCartesian(50, 50, 49, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return ["M", 50, 50, "L", start.x, start.y, "A", 49, 49, 0, largeArcFlag, 0, end.x, end.y, "Z"].join(" ");
}

function getWheelLabel(name: string) {
  return name.length > 5 ? `${name.slice(0, 5)}…` : name;
}

export default function RoulettePage() {
  const [activeSource, setActiveSource] = useState<MealSource>("system");
  const [customMeals, setCustomMeals] = useState<RouletteMeal[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<RouletteMeal | null>(null);
  const [customName, setCustomName] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [batchText, setBatchText] = useState("");
  const [formError, setFormError] = useState("");
  const [showCustomMealModal, setShowCustomMealModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadCustomMeals = () => {
      try {
        const raw = window.localStorage.getItem(CUSTOM_MEALS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setCustomMeals(parsed.filter(isRouletteMeal));
          }
        }
      } catch {
        setCustomMeals([]);
      } finally {
        setStorageReady(true);
      }
    };

    window.setTimeout(loadCustomMeals, 0);
  }, []);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") return;

    window.localStorage.setItem(CUSTOM_MEALS_STORAGE_KEY, JSON.stringify(customMeals));
  }, [customMeals, storageReady]);

  const activeMeals = activeSource === "system" ? SYSTEM_MEALS : customMeals;

  const wheelSlices = useMemo(() => {
    if (activeMeals.length === 0) return [];

    const segmentSize = 360 / activeMeals.length;
    return activeMeals.map((meal, index) => {
      const startAngle = index * segmentSize;
      const endAngle = startAngle + segmentSize;
      const labelAngle = startAngle + segmentSize / 2;
      const labelPoint = polarToCartesian(50, 50, 31, labelAngle);

      return {
        meal,
        path: describeSlice(startAngle, endAngle),
        color: WHEEL_COLORS[index % WHEEL_COLORS.length],
        labelAngle,
        labelPoint,
      };
    });
  }, [activeMeals]);

  const switchSource = (source: MealSource) => {
    if (spinning) return;
    setActiveSource(source);
    setSelectedMeal(null);
    setRotation(0);
  };

  const spin = () => {
    if (spinning || activeMeals.length === 0) return;

    const index = Math.floor(Math.random() * activeMeals.length);
    const segmentSize = 360 / activeMeals.length;
    const targetCenter = index * segmentSize + segmentSize / 2;
    const currentRotation = ((rotation % 360) + 360) % 360;
    const deltaToPointer = (360 - targetCenter - currentRotation + 360) % 360;
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const finalRotation = rotation + extraSpins * 360 + deltaToPointer;

    setSpinning(true);
    setSelectedMeal(null);
    setRotation(finalRotation);

    window.setTimeout(() => {
      setSelectedMeal(activeMeals[index]);
      setSpinning(false);
    }, SPIN_DURATION_MS);
  };

  const createCustomMeal = (name: string, calories: number, index = 0): RouletteMeal => {
    const roundedCalories = Math.round(calories);
    return {
      id: `custom-${Date.now()}-${index}`,
      name,
      emoji: "⭐",
      calories: roundedCalories,
      category: "我的收藏",
      source: "custom",
      tip: getCustomMealTip(roundedCalories),
    };
  };

  const activateCustomWheel = () => {
    setActiveSource("custom");
    setSelectedMeal(null);
    setRotation(0);
    setFormError("");
  };

  const addCustomMeal = (event: FormEvent) => {
    event.preventDefault();

    const name = customName.trim();
    const calories = Number(customCalories);

    if (!name) {
      setFormError("先给这顿快乐餐起个名字吧。");
      return;
    }
    if (!Number.isFinite(calories) || calories <= 0) {
      setFormError("热量请输入一个大于 0 的数字。");
      return;
    }
    if (calories > 3000) {
      setFormError("这个热量有点离谱，先控制在 3000 kcal 以内吧。");
      return;
    }

    const customMeal = createCustomMeal(name, calories);

    setCustomMeals((prev) => [...prev, customMeal]);
    activateCustomWheel();
    setCustomName("");
    setCustomCalories("");
  };

  const addBatchCustomMeals = () => {
    const lines = batchText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setFormError("先粘贴一些放纵餐，每行一个。");
      return;
    }

    const meals: RouletteMeal[] = [];
    const invalidLines: string[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(/[，,\s]+/).filter(Boolean);
      const lastPart = parts.at(-1);
      const parsedCalories = lastPart ? Number(lastPart.replace(/kcal/i, "")) : Number.NaN;
      const hasCalories = Number.isFinite(parsedCalories) && parsedCalories > 0 && parsedCalories <= 3000;
      const name = hasCalories ? parts.slice(0, -1).join(" ").trim() : line;
      const calories = hasCalories ? parsedCalories : 600;

      if (!name) {
        invalidLines.push(line);
        return;
      }

      meals.push(createCustomMeal(name, calories, index));
    });

    if (meals.length === 0) {
      setFormError("没有识别到可添加的放纵餐。");
      return;
    }

    setCustomMeals((prev) => [...prev, ...meals]);
    activateCustomWheel();
    setBatchText("");
  };

  const removeCustomMeal = (id: string) => {
    setCustomMeals((prev) => prev.filter((meal) => meal.id !== id));
    if (selectedMeal?.id === id) setSelectedMeal(null);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        <section className="bg-gradient-to-br from-amber-50 via-white to-green-50 rounded-2xl border border-amber-100 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-600 mb-2">Cheat Meal Roulette</p>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">🎲 放纵餐转盘</h1>
              <p className="text-gray-600 max-w-2xl">
                偶尔放松一下，也要吃得开心又有数。可以转系统推荐，也可以切到你的专属自定义转盘。
              </p>
            </div>
            <Link href="/plan" className="self-start md:self-center px-4 py-2 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary-light transition-colors">
              ← 回到饮食计划
            </Link>
          </div>
        </section>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
          <section className="bg-white rounded-2xl border border-green-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">命运之轮</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {activeSource === "system" ? "系统推荐转盘" : "我的自定义转盘"} · 当前候选 {activeMeals.length} 个
                </p>
              </div>
              <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => switchSource("system")}
                  className={`px-4 py-2 rounded-lg transition-colors ${activeSource === "system" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  系统推荐
                </button>
                <button
                  type="button"
                  onClick={() => switchSource("custom")}
                  className={`px-4 py-2 rounded-lg transition-colors ${activeSource === "custom" ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  自定义
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="relative w-96 max-w-full aspect-square flex items-center justify-center">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 text-4xl drop-shadow">🔻</div>
                <div
                  className="relative w-full h-full rounded-full border-[10px] border-white shadow-2xl transition-transform duration-[2200ms] ease-out overflow-hidden bg-gray-50"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                    {wheelSlices.map((slice) => (
                      <g key={slice.meal.id}>
                        <path d={slice.path} fill={slice.color} stroke="rgba(255,255,255,0.85)" strokeWidth="0.7" />
                        {activeSource === "system" && (
                          <g transform={`translate(${slice.labelPoint.x} ${slice.labelPoint.y})`}>
                            <g transform={`rotate(${-rotation})`}>
                              <text x="0" y="-1.5" textAnchor="middle" dominantBaseline="middle" fontSize="6.3">
                                {slice.meal.emoji}
                              </text>
                              <text x="0" y="4.2" textAnchor="middle" dominantBaseline="middle" fontSize="3.2" fontWeight="700" fill="#374151">
                                {getWheelLabel(slice.meal.name)}
                              </text>
                            </g>
                          </g>
                        )}
                      </g>
                    ))}
                  </svg>
                  <div className="absolute inset-6 rounded-full border border-white/70" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-white/95 shadow-lg border border-amber-100 flex flex-col items-center justify-center text-center px-3">
                      <span className="text-3xl">🎡</span>
                      <span className="text-xs font-bold text-gray-700 mt-1">{activeSource === "system" ? "系统" : "自定义"}</span>
                      <span className="text-[10px] text-gray-400">快乐一下</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={spin}
                disabled={spinning || activeMeals.length === 0}
                className="bg-warm text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-500 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {spinning ? "命运转动中..." : activeMeals.length === 0 ? "先添加自定义餐" : "🎲 开始转盘"}
              </button>

              {activeSource === "custom" && (
                customMeals.length > 0 ? (
                  <div className="w-full max-w-2xl rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="text-sm font-semibold text-gray-700">已加入自定义转盘</p>
                      <button
                        type="button"
                        onClick={() => setShowCustomMealModal(true)}
                        className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        查看全部 {customMeals.length} 个
                      </button>
                    </div>
                    <div className="max-h-[7.5rem] overflow-hidden grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {customMeals.slice(0, 9).map((meal) => (
                        <div key={meal.id} className="rounded-xl bg-white/90 border border-amber-100 px-3 py-2 text-sm font-semibold text-gray-700 truncate">
                          {meal.emoji} {meal.name}
                        </div>
                      ))}
                    </div>
                    {customMeals.length > 9 && (
                      <p className="mt-2 text-xs text-amber-600">还有 {customMeals.length - 9} 个没有显示，点“查看全部”管理。</p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 px-5 py-4 text-center">
                    <p className="font-semibold text-gray-700">自定义转盘还是空的</p>
                    <p className="text-sm text-gray-500 mt-1">在右侧添加你的专属放纵餐，它们会只出现在自定义转盘里。</p>
                  </div>
                )
              )}
            </div>
          </section>

          <div className="space-y-6">
            <section className="bg-white rounded-2xl border border-green-100 p-6 shadow-sm min-h-64">
              <h2 className="text-xl font-bold text-gray-800 mb-4">🎉 今日快乐签</h2>
              {selectedMeal ? (
                <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-100 p-5 animate-pop-in">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-4xl">
                      {selectedMeal.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-amber-600 font-semibold mb-1">
                        {selectedMeal.source === "system" ? "系统推荐" : "我的自定义"}
                      </p>
                      <h3 className="text-2xl font-bold text-gray-800">{selectedMeal.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-2.5 py-1 rounded-full bg-white text-gray-700 text-xs font-semibold border border-amber-100">
                          🔥 约 {selectedMeal.calories} kcal
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-white text-gray-700 text-xs font-semibold border border-amber-100">
                          {selectedMeal.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-700 leading-6">{selectedMeal.tip}</p>
                  <p className="mt-3 text-xs text-primary bg-white/70 border border-white rounded-xl px-3 py-2">
                    🌿 平衡建议：{getBalanceHint(selectedMeal.calories)}
                  </p>
                </div>
              ) : (
                <div className="h-44 rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 flex flex-col items-center justify-center text-center px-6">
                  <span className="text-4xl mb-3">🍽️</span>
                  <p className="font-semibold text-gray-700">还没有抽签结果</p>
                  <p className="text-sm text-gray-500 mt-1">选择一个转盘，点击开始，让命运帮你选一顿快乐餐。</p>
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-green-100 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">⭐ 我的自定义</h2>
                  <p className="text-sm text-gray-500">这些只属于“自定义转盘”，不会混进系统推荐。</p>
                </div>
                <button
                  type="button"
                  onClick={() => switchSource("custom")}
                  className="px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 text-xs font-semibold hover:bg-amber-50 transition-colors"
                >
                  切到自定义
                </button>
              </div>

              <form onSubmit={addCustomMeal} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">放纵餐名称</label>
                  <input
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                    maxLength={30}
                    placeholder="例如：楼下鸡公煲"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">估算热量 kcal</label>
                  <input
                    value={customCalories}
                    onChange={(event) => setCustomCalories(event.target.value)}
                    type="number"
                    min="1"
                    max="3000"
                    placeholder="例如：750"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <button type="submit" className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary-dark transition-colors">
                  加入自定义转盘
                </button>
              </form>

              <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">批量添加</label>
                  <textarea
                    value={batchText}
                    onChange={(event) => setBatchText(event.target.value)}
                    rows={5}
                    placeholder={"每行一个，例如：\n海底捞 1000\n麦当劳 850\n楼下鸡公煲"}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">可写“名称 热量”，没写热量会默认按 600 kcal。</p>
                </div>
                <button
                  type="button"
                  onClick={addBatchCustomMeals}
                  className="w-full border border-amber-300 text-amber-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-amber-50 transition-colors"
                >
                  批量加入自定义转盘
                </button>
              </div>

              {formError && <p className="mt-3 text-xs text-accent bg-accent-light rounded-lg px-3 py-2">{formError}</p>}

              <div className="mt-5">
                {customMeals.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl">还没有自定义放纵餐，先加一个吧。</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustomMealModal(true)}
                    className="w-full rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 text-left hover:bg-amber-50 transition-colors"
                  >
                    <span className="block text-sm font-semibold text-gray-700">已添加 {customMeals.length} 个自定义放纵餐</span>
                    <span className="block text-xs text-amber-600 mt-1">点击查看、管理全部列表</span>
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>

        {showCustomMealModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-amber-100 max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">⭐ 全部自定义放纵餐</h3>
                  <p className="text-xs text-gray-400 mt-0.5">共 {customMeals.length} 个，只用于自定义转盘</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomMealModal(false)}
                  className="h-9 w-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  aria-label="关闭"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-5 space-y-2">
                {customMeals.map((meal) => (
                  <div key={meal.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">{meal.emoji} {meal.name}</p>
                      <p className="text-xs text-gray-400">约 {meal.calories} kcal · {meal.category}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomMeal(meal.id)}
                      className="text-xs text-gray-400 hover:text-accent transition-colors shrink-0"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
