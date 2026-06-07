import React from "react";

interface SkeletonRowProps {
  className?: string;
  variant?: "light" | "dark";
  rounded?: string;
  height?: string;
  width?: string;
}

export const SkeletonRow: React.FC<SkeletonRowProps> = ({
  className = "",
  variant = "dark",
  rounded = "rounded-md",
  height = "h-4",
  width = "w-full"
}) => {
  return (
    <div
      className={`${variant === "dark" ? "skeleton-shimmer" : "skeleton-shimmer-light"} ${rounded} ${height} ${width} ${className}`}
      aria-hidden="true"
    />
  );
};

export const SkeletonCircle: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = "" }) => {
  return (
    <div
      className={`skeleton-shimmer rounded-full ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between">
        <SkeletonRow width="w-24" height="h-2.5" />
        <SkeletonRow width="w-8" height="h-5" rounded="rounded" />
      </div>
      <div className="mt-3 space-y-2">
        <SkeletonRow width="w-16" height="h-6" />
        <SkeletonRow width="w-32" height="h-2.5" />
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 6 }) => {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-6">
          <SkeletonRow width={i === 1 ? "w-44" : "w-20"} height="h-3.5" />
        </td>
      ))}
    </tr>
  );
};

export const PipelineStepSkeleton: React.FC = () => {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/50 p-4 flex items-start space-x-3.5">
      <SkeletonCircle size={40} />
      <div className="flex-1 space-y-2">
        <SkeletonRow width="w-40" height="h-3.5" />
        <SkeletonRow width="w-64" height="h-2.5" />
        <div className="mt-3 space-y-2">
          <SkeletonRow width="w-full" height="h-2.5" />
          <SkeletonRow width="w-5/6" height="h-2.5" />
        </div>
      </div>
    </div>
  );
};
