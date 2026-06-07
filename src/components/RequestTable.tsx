import React from "react";
import { useNavigate } from "react-router-dom";
import type { ProcurementRequest } from "../types";
import { StatusBadge } from "./StatusBadge";
import { ArrowUpRight, FilterX } from "lucide-react";
import { formatRelativeTime, formatCurrency, formatDate } from "../utils/formatters";

interface RequestTableProps {
  id?: string;
  requests: ProcurementRequest[];
  loading?: boolean;
  lastUpdated?: number | null;
}

export const RequestTable: React.FC<RequestTableProps> = ({ id, requests, loading, lastUpdated }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div id={id || "request-table-skeleton"} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 animate-pulse">
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-b border-slate-200 dark:border-slate-800 h-14"></div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex space-x-4 items-center justify-between pb-4 border-b border-slate-100 last:border-0">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              </div>
              <div className="w-24 h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div id={id || "request-table-empty"} className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-center">
        <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center text-slate-400 mb-4 border border-slate-200 dark:border-slate-800">
          <FilterX className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          No procurement requests found
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 leading-normal">
          There are no approvals matching the filter criteria. Submit a new procurement application to launch the automated Multi-Agent system review.
        </p>
        <a
          href="/submit"
          className="mt-4 px-4 py-2 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-950 font-medium rounded-lg text-xs hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors cursor-pointer"
        >
          Submit first request
        </a>
      </div>
    );
  }

  return (
    <div
      id={id || "request-table-wrapper"}
      className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm shadow-slate-100/45 dark:shadow-none"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <th className="py-3 px-6 font-semibold">Request ID</th>
              <th className="py-3 px-6 font-semibold">Item Description</th>
              <th className="py-3 px-6 font-semibold">Department</th>
              <th className="py-3 px-6 font-semibold">Amount</th>
              <th className="py-3 px-6 font-semibold">Vendor</th>
              <th className="py-3 px-6 font-semibold">Status</th>
              <th className="py-3 px-6 font-semibold">Submitted Date</th>
              <th className="py-3 px-6 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {requests.map((req) => (
              <tr
                key={req.request_id}
                onClick={() => navigate(`/requests/${req.request_id}`)}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-6 font-mono text-slate-950 dark:text-slate-50 font-semibold text-xs tracking-tight">
                  {req.request_id}
                </td>
                <td className="py-3 px-6 min-w-[220px]">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                    {req.request.item_description}
                  </p>
                  {req.request.urgency === "high" && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15 uppercase tracking-wider mt-1">
                      Urgent
                    </span>
                  )}
                </td>
                <td className="py-3 px-6 text-slate-600 dark:text-slate-300 font-medium">
                  {req.request.department}
                </td>
                <td className="py-3 px-6 font-semibold text-slate-950 dark:text-slate-100 decimal-aligned font-mono">
                  {formatCurrency(req.request.total_cost)}
                </td>
                <td className="py-3 px-6 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                  {req.request.vendor_name}
                </td>
                <td className="py-3 px-6">
                  <StatusBadge status={req.status} />
                </td>
                <td className="py-3 px-6 text-slate-500 dark:text-slate-500 text-[11px]">
                  {formatDate(req.request.submitted_date)}
                </td>
                <td className="py-3 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => navigate(`/requests/${req.request_id}`)}
                    className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded transition-colors cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Optional wrapper component that renders the table with the "Last updated Xs ago" counter
interface RequestTableWithTimestampProps extends RequestTableProps {
  showLastUpdated?: boolean;
}

export const RequestTableWithTimestamp: React.FC<RequestTableWithTimestampProps> = ({
  showLastUpdated = true,
  lastUpdated,
  ...rest
}) => {
  // Tick every second so the relative time label refreshes
  const [, setTick] = React.useState<number>(0);
  React.useEffect(() => {
    if (!showLastUpdated) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [showLastUpdated]);

  return (
    <div>
      {showLastUpdated && (
        <div className="flex items-center justify-end mb-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
            Last updated: {lastUpdated ? formatRelativeTime(lastUpdated) : "—"}
          </span>
        </div>
      )}
      <RequestTable {...rest} lastUpdated={lastUpdated} />
    </div>
  );
};
