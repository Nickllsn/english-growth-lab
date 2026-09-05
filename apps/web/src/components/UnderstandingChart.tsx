import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ProgressStats } from "../api/client";

interface UnderstandingChartProps {
  data: ProgressStats["weeklyUnderstanding"];
}

export function UnderstandingChart({ data }: UnderstandingChartProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">UNDERSTANDING</p>
          <h2>每周理解度</h2>
        </div>
        <span>满分 5</span>
      </div>
      {data.length ? (
        <>
          <div className="chart" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="4 4" opacity={0.35} />
                <XAxis dataKey="week" tickLine={false} />
                <YAxis domain={[1, 5]} tickCount={5} tickLine={false} />
                <Tooltip />
                <Line
                  dataKey="average"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ul className="chart-fallback">
            {data.map((point) => (
              <li key={point.week}>
                <span>{point.week}</span>
                <strong>{point.average.toFixed(1)} / 5</strong>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="empty-state">完成第一天后，这里会出现理解度趋势。</p>
      )}
    </section>
  );
}
