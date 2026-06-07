import React from "react";
import * as Lucide from "lucide-react";

interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  iconName: keyof typeof Lucide;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description?: string;
  prevValue?: string | number;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  iconName,
  trend,
  description,
  prevValue
}) => {
  const IconComponent = Lucide[iconName] as React.ComponentType<{ className?: string }>;

  // Detect value change for the pulse animation
  const isIncreased = prevValue !== undefined && Number(value) > Number(prevValue);
  const flashKey = `${value}`;

  return (
    <div
      id={id || `stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
          {title}
        </span>
        <div className="p-1 px-1.5 bg-slate-50 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400">
          {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
        </div>
      </div>

      <div className="mt-2">
        <h3
          key={flashKey}
          className={`text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none rounded px-1 -mx-1 ${
            isIncreased ? "blip-green" : ""
          }`}
        >
          {value}
        </h3>

        {(trend || description) && (
          <div className="flex items-center mt-1.5 space-x-1.5 flex-wrap gap-y-1">
            {trend && (
              <span
                className={`text-xs font-semibold ${
                  trend.isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {trend.isPositive ? "↑ " : "→ "}
                {trend.value}
              </span>
            )}
            {description && (
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                • {description}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
