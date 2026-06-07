import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePolling } from "../hooks/usePolling";
import { useToast } from "../hooks/useToast";
import { client } from "../api/client";
import type { DepartmentBudget, ProcurementRequest, StatMetrics } from "../types";
import { StatCard } from "../components/StatCard";
import { RequestTable } from "../components/RequestTable";
import { DeptBudgetChart } from "../components/DeptBudgetChart";
import { ArrowUpRight, Plus, HelpCircle, FileSpreadsheet, RefreshCw, Inbox } from "lucide-react";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const requestsPoll = usePolling<ProcurementRequest[]>(() => client.getRequests(), 3000);
  const budgetsPoll = usePolling<DepartmentBudget[]>(() => client.getDeptBudgets(), 30000);

  const requests = requestsPoll.data ?? [];
  const budgets = budgetsPoll.data ?? [];

  const loading = requestsPoll.loading && !requestsPoll.data;
  const loadingBudgets = budgetsPoll.loading && !budgetsPoll.data;

  const [metrics, setMetrics] = React.useState<StatMetrics>({
    totalRequests: 0,
    pendingApproval: 0,
    autoApprovedToday: 0,
    rejectedToday: 0
  });
  const [prevMetrics, setPrevMetrics] = React.useState<StatMetrics>(metrics);
  const [statusMap, setStatusMap] = React.useState<Record<string, string>>({});
  const [errorToast, setErrorToast] = React.useState<string | null>(null);

  // Tick every second so the "last updated" counter refreshes
  const [, setNow] = React.useState<number>(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Recompute metrics whenever the request list changes
  React.useEffect(() => {
    const totalRequests = requests.length;
    const pendingApproval = requests.filter(r => r.status === "pending" || r.status === "in_review" || r.status === "escalated").length;
    const autoApprovedToday = requests.filter(r => r.status === "approved" && r.agents.manager.status === "pass").length;
    const rejectedToday = requests.filter(r => r.status === "rejected").length;

    const next: StatMetrics = { totalRequests, pendingApproval, autoApprovedToday, rejectedToday };
    setPrevMetrics(metrics);
    setMetrics(next);
  }, [requests]);

  // Watch status changes and emit toasts
  React.useEffect(() => {
    if (requests.length === 0) {
      setStatusMap({});
      return;
    }
    const next: Record<string, string> = {};
    const seenStatus = statusMap;
    for (const r of requests) {
      next[r.request_id] = r.status;
      const prev = seenStatus[r.request_id];
      // Only fire a toast when a known status actually changed (skip initial render)
      if (prev && prev !== r.status) {
        const reasonSnippet = (
          r.agents.manager.reason ||
          r.audit_trail[r.audit_trail.length - 1]?.reason ||
          ""
        ).slice(0, 80);
        if (r.status === "approved") {
          toast({ variant: "success", title: `${r.request_id} auto-approved`, description: reasonSnippet });
        } else if (r.status === "rejected") {
          toast({ variant: "error", title: `${r.request_id} rejected`, description: reasonSnippet });
        } else if (r.status === "escalated") {
          toast({ variant: "warning", title: `${r.request_id} escalated to human review`, description: reasonSnippet });
        }
      }
    }
    setStatusMap(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  // Show the API error toast
  React.useEffect(() => {
    if (requestsPoll.error) {
      setErrorToast("Procurement API data load disruption. Re-triggering network queries.");
    } else {
      setErrorToast(null);
    }
  }, [requestsPoll.error]);

  const handleRefresh = () => {
    requestsPoll.data; // no-op to ensure dependency
    window.location.reload();
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Toast Notification for Error states */}
      {errorToast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-rose-600 border border-rose-500/10 text-white text-xs font-semibold shadow-2xl flex items-center space-x-3 max-w-sm animate-[bounce_0.5s_ease-in-out_1]">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping shrink-0" />
          <span>{errorToast}</span>
          <button
            onClick={() => setErrorToast(null)}
            className="text-[10px] uppercase font-bold bg-white/20 hover:bg-white/30 px-2 py-1 rounded cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Header section with actions */}
      <div className="flex items-center justify-between pb-2 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-slate-900 dark:text-slate-50">
            System Control Node
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Real-time status overview of corporate procurement applications and AI auditor checks.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            title="Refresh Ledger"
            className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/requests"
            className="hidden md:inline-flex items-center space-x-1.5 text-xs font-bold px-3.5 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-md transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Audit Ledger</span>
          </Link>

          <Link
            to="/submit"
            className="inline-flex items-center space-x-1.5 text-xs font-extrabold uppercase px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 text-white dark:text-slate-950 rounded-md shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Request</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="TOTAL REQUESTS"
          value={loading ? "..." : metrics.totalRequests}
          iconName="FileSpreadsheet"
          trend={{ value: "+12.4%", isPositive: true }}
          description="lifetime transaction logs"
          prevValue={prevMetrics.totalRequests}
        />
        <StatCard
          title="PENDING APPROVAL"
          value={loading ? "..." : metrics.pendingApproval}
          iconName="Hourglass"
          trend={{ value: "Active review", isPositive: false }}
          description="currently in routing queue"
          prevValue={prevMetrics.pendingApproval}
        />
        <StatCard
          title="AUTO-APPROVED"
          value={loading ? "..." : metrics.autoApprovedToday}
          iconName="CheckCircle"
          trend={{ value: "98% pass-rate", isPositive: true }}
          description="passed limits checks this cycle"
          prevValue={prevMetrics.autoApprovedToday}
        />
        <StatCard
          title="REJECTED TODAY"
          value={loading ? "..." : metrics.rejectedToday}
          iconName="XCircle"
          trend={{ value: "Compliance bounds", isPositive: false }}
          description="prevented policy breaches"
          prevValue={prevMetrics.rejectedToday}
        />
      </div>

      {/* Spend by Department chart */}
      <DeptBudgetChart budgets={budgets} loading={loadingBudgets} />

      {/* Active Transactions Ledger */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Active Transactions Ledger
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
              Last updated: {requestsPoll.lastUpdated ? `${Math.floor((Date.now() - requestsPoll.lastUpdated) / 1000)}s ago` : "—"}
            </span>
            <Link
              to="/requests"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 flex items-center space-x-1"
            >
              <span>View All Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Empty state */}
        {!loading && requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center text-slate-400 mb-4 border border-slate-200 dark:border-slate-800">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              No procurement requests yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
              Submit your first request to launch the multi-agent AI pipeline. The dashboard will start populating in real time.
            </p>
            <button
              type="button"
              onClick={() => navigate("/submit")}
              className="mt-5 inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-950 dark:bg-slate-50 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <span>Submit your first request</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <RequestTable requests={requests.slice(0, 5)} loading={loading} />
        )}
      </div>

      {/* Quick helpful hackathon context guidelines */}
      <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 flex items-start space-x-3">
        <HelpCircle className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-500">
          <p className="font-bold dark:text-slate-300">Control Panel Sandbox Guidance:</p>
          <p className="mt-1 leading-normal">
            To experience the Agent Pipeline Tracker live-render, use the <strong className="dark:text-slate-300">"New Request"</strong> form on the navigation sidebar. Create any purchase item and watch the agent pipeline nodes actively glow, write compliance reports, and update statuses iteratively in real time over 3-second polling queries.
          </p>
        </div>
      </div>
    </div>
  );
};
