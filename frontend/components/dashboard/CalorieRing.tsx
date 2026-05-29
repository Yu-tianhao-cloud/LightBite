// frontend/components/dashboard/CalorieRing.tsx
export default function CalorieRing({ consumed, target, protein, carbs, fat }: {
  consumed: number; target: number; protein: number; carbs: number; fat: number;
}) {
  const pct = Math.min(100, Math.round((consumed / target) * 100));
  const radius = 40; const circumference = 2 * Math.PI * radius;
  const filled = (pct / 100) * circumference;

  return (
    <div className="bg-white rounded-xl p-6 border border-green-100 flex items-center gap-6">
      <div className="relative w-28 h-28 shrink-0">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e8f5e0" strokeWidth="10" />
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#4a7c59" strokeWidth="10"
            strokeDasharray={`${filled} ${circumference - filled}`} strokeLinecap="round"
            className="transition-all duration-500" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-primary">{pct}%</span>
          <span className="text-xs text-gray-400">{consumed}/{target}</span>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-gray-700 mb-2">今日摄入</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-3"><span>🥩 蛋白质</span><span className="font-semibold">{protein.toFixed(0)}g</span></div>
          <div className="flex justify-between gap-3"><span>🍚 碳水</span><span className="font-semibold">{carbs.toFixed(0)}g</span></div>
          <div className="flex justify-between gap-3"><span>🧈 脂肪</span><span className="font-semibold">{fat.toFixed(0)}g</span></div>
        </div>
      </div>
    </div>
  );
}
