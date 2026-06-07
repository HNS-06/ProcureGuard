import React from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, CartesianGrid } from "recharts";
import { AlertTriangle, TrendingUp } from "lucide-react";
import type { DepartmentBudget } from "../types";
import { formatCurrency, formatPercent } from "../utils/formatters";

interface DeptBudgetChartProps {
  budgets: DepartmentBudget[];
  loading?: boolean;
}

const colorForStatus = (status: DepartmentBudget["status"]): string => {
  if (status === "critical") return "#f43f5e";
  if (status === "warning") return "#f59e0b";
  return "#10b981";
};

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload as DepartmentBudget;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-extrabold text-slate-900 dark:text-slate-100 mb-1">{d.department}</p>
      <p className="text-slate-600 dark:text-slate-300">
        Used: <span className="font-mono font-bold">{formatCurrency(d.spent)}</span> of {formatCurrency(d.annual_limit)}
      </p>
      <p className="text-slate-600 dark:text-slate-300">
        Remaining: <span className="font-mono font-bold">{formatCurrency(d.remaining)}</span>
      </p>
      <p className="text-slate-500 dark:text-slate-400 mt-1">
        {formatPercent(d.percent_used, 0)} utilized
      </p>
    </div>
  );
};

export const DeptBudgetChart: React.FC<DeptBudgetChartProps> = ({ budgets, loading = false }) => {
  const data = React.useMemo(() => {
    return [...budgets].sort((a, b) => b.percent_used - a.percent_used);
  }, [budgets]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="skeleton-shimmer w-4 h-4 rounded" />
          <div className="skeleton-shimmer w-40 h-3 rounded" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton-shimmer w-24 h-3 rounded" />
              <div className="skeleton-shimmer flex-1 h-3 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!budgets.length) {
    return null;
  }

  return (
    <div
      id="dept-budget-chart"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 px-1.5 bg-slate-50 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Spend by Department
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-slate-400">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Healthy
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Warning
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Critical
          </span>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
            barCategoryGap={6}
          >
            <CartesianGrid stroke="rgba(148,163,184,0.12)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "#94a3b8" }}
              tickFormatter={(v) => `${v}%`}
              stroke="rgba(148,163,184,0.3)"
            />
            <YAxis
              type="category"
              dataKey="department"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              width={92}
              stroke="rgba(148,163,184,0.3)"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148,163,184,0.06)" }} />
            <Bar dataKey="percent_used" radius={[0, 4, 4, 0]} background={{ fill: "rgba(148,163,184,0.08)", radius: 4 }}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorForStatus(entry.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {data.slice(0, 3).map(d => (
          <div
            key={d.department}
            className={`flex items-center gap-1.5 text-[10px] font-mono ${
              d.status === "critical" ? "text-rose-600 dark:text-rose-400" :
              d.status === "warning" ? "text-amber-600 dark:text-amber-400" :
              "text-slate-600 dark:text-slate-300"
            }`}
          >
            {d.status === "critical" && <AlertTriangle className="w-3 h-3" />}
            <span className="font-bold">{d.department}</span>
            <span className="text-slate-400">·</span>
            <span>{formatPercent(d.percent_used, 0)} used</span>
          </div>
        ))}
      </div>
    </div>
  );
};
