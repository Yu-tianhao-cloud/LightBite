// frontend/components/dashboard/TrendChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export function CalorieTrendChart({ data }: { data: { date: string; calories: number }[] }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-green-100">
      <h3 className="font-bold text-gray-700 mb-3">📈 本周热量趋势</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="calories" fill="#4a7c59" radius={[4, 4, 0, 0]} name="热量 kcal" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeightTrendChart({ data }: { data: { date: string; weight_kg: number }[] }) {
  if (data.length === 0) return null;
  return (
    <div className="bg-white rounded-xl p-4 border border-green-100">
      <h3 className="font-bold text-gray-700 mb-3">⚖️ 体重变化</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={["dataMin - 2", "dataMax + 2"]} />
          <Tooltip />
          <Line type="monotone" dataKey="weight_kg" stroke="#e94560" strokeWidth={2} dot={{ r: 4 }} name="体重 kg" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
