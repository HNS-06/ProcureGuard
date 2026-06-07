import React from "react";
import { RequestStatus } from "../types";

interface StatusBadgeProps {
  id?: string;
  status: RequestStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ id, status }) => {
  const styles: Record<RequestStatus, string> = {
    pending: "bg-blue-50/80 text-blue-700 border-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    in_review: "bg-amber-50/80 text-amber-800 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    approved: "bg-emerald-50/80 text-emerald-800 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
    rejected: "bg-rose-50/80 text-rose-700 border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30",
    escalated: "bg-orange-50/80 text-orange-800 border-orange-200/60 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30"
  };

  const labels: Record<RequestStatus, string> = {
    pending: "Pending",
    in_review: "In Review",
    approved: "Approved",
    rejected: "Rejected",
    escalated: "Escalated"
  };

  return (
    <span
      id={id || `status-badge-${status}`}
      className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold border tracking-wider uppercase ${styles[status] || styles.pending}`}
    >
      <span className="w-1 h-1 rounded-full mr-1 bg-current opacity-90"></span>
      {labels[status] || status}
    </span>
  );
};
