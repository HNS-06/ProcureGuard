import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Hourglass, ArrowUpRight, Clock } from "lucide-react";
import type { AuditTrailEntry } from "../types";
import { formatTimeUTC } from "../utils/formatters";

interface AuditTrailProps {
  entries: AuditTrailEntry[];
  title?: string;
  showCount?: boolean;
}

const colorForVerdict = (verdict: string): { dot: string; text: string; bg: string; border: string } => {
  const v = verdict.toUpperCase();
  if (["PASS", "SUCCESS", "DONE", "COMPLIANT", "COMPILED", "BUDGET APPROVED", "PROCESSED"].includes(v)) {
    return {
      dot: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    };
  }
  if (["WARN", "WARNING RAISED", "EXPEDITED EXCEPTION", "ACTION RECOMMENDED", "ESCALATE", "ESCALATED"].includes(v)) {
    return {
      dot: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20"
    };
  }
  if (["BLOCK", "BLOCKED", "NON-COMPLIANT", "AUTO-REJECTED", "FAIL", "FAILED"].includes(v)) {
    return {
      dot: "bg-rose-500",
      text: "text-rose-700 dark:text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20"
    };
  }
  return {
    dot: "bg-slate-400",
    text: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20"
  };
};

const iconForVerdict = (verdict: string): React.ReactNode => {
  const v = verdict.toUpperCase();
  if (["PASS", "SUCCESS", "DONE", "COMPLIANT", "COMPILED", "BUDGET APPROVED", "PROCESSED"].includes(v)) {
    return <CheckCircle2 className="w-3 h-3" />;
  }
  if (["WARN", "WARNING RAISED", "EXPEDITED EXCEPTION", "ACTION RECOMMENDED"].includes(v)) {
    return <AlertTriangle className="w-3 h-3" />;
  }
  if (["ESCALATE", "ESCALATED"].includes(v)) {
    return <ArrowUpRight className="w-3 h-3" />;
  }
  if (["BLOCK", "BLOCKED", "NON-COMPLIANT", "AUTO-REJECTED", "FAIL", "FAILED"].includes(v)) {
    return <XCircle className="w-3 h-3" />;
  }
  return <Hourglass className="w-3 h-3" />;
};

const colorForAgent = (agent: string): string => {
  const a = agent.toLowerCase();
  if (a.includes("budget")) return "bg-indigo-500";
  if (a.includes("vendor")) return "bg-cyan-500";
  if (a.includes("compliance")) return "bg-violet-500";
  if (a.includes("manager")) return "bg-amber-500";
  if (a.includes("report")) return "bg-emerald-500";
  if (a.includes("human")) return "bg-rose-500";
  if (a.includes("system")) return "bg-slate-400";
  return "bg-slate-500";
};

export const AuditTrail: React.FC<AuditTrailProps> = ({
  entries,
  title = "Transaction Audit Logs",
  showCount = true
}) => {
  // Reverse-chronological — newest first
  const sorted = React.useMemo(
    () => [...entries].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()),
    [entries]
  );

  // Track which entries were already rendered before, so we can animate just the new ones
  const seenRef = React.useRef<Set<string>>(new Set());
  const [newKeys, setNewKeys] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const next = new Set<string>();
    sorted.forEach(e => {
      const key = `${e.agent}-${e.timestamp}-${e.action}`;
      if (!seenRef.current.has(key)) {
        next.add(key);
        seenRef.current.add(key);
      }
    });
    if (next.size > 0) {
      setNewKeys(next);
      const id = window.setTimeout(() => setNewKeys(new Set()), 800);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [sorted]);

  return (
    <div
      id="audit-trail-card"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
            {title}
            {showCount && <span className="ml-1.5 text-slate-400">({entries.length})</span>}
          </h4>
        </div>
        <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Newest first</span>
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {sorted.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-400">No audit entries recorded yet.</div>
        )}
        {sorted.map((entry, idx) => {
          const key = `${entry.agent}-${entry.timestamp}-${entry.action}`;
          const verdictStyle = colorForVerdict(entry.verdict);
          const agentColor = colorForAgent(entry.agent);
          const isNew = newKeys.has(key);
          return (
            <div
              key={key}
              className={`p-4 flex items-start gap-3 ${isNew ? "slide-in-top" : ""}`}
            >
              <div className="flex flex-col items-center shrink-0 mt-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${agentColor} ring-2 ring-white dark:ring-slate-900`} />
                {idx < sorted.length - 1 && (
                  <span className="w-px flex-1 bg-slate-200 dark:bg-slate-800 mt-1" style={{ minHeight: 20 }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {entry.agent}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {entry.timestamp ? formatTimeUTC(entry.timestamp) : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-slate-400">Action:</span>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {entry.action}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded font-mono font-bold text-[9px] tracking-wide border ${verdictStyle.bg} ${verdictStyle.text} ${verdictStyle.border}`}
                  >
                    {iconForVerdict(entry.verdict)}
                    {entry.verdict}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal whitespace-pre-wrap">
                  {entry.reason}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
