import React from "react";
import { Check, X, AlertTriangle, ArrowUp, Loader2, Circle, Calendar, FileDown } from "lucide-react";
import { formatTimeUTC } from "../utils/formatters";

export type StepStatus = "waiting" | "running" | "pass" | "warn" | "block" | "escalated" | "done";

interface AgentStepProps {
  id?: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: StepStatus;
  verdict?: string;
  reason?: string;
  timestamp?: string;
  isLast?: boolean;
  prevStatus?: StepStatus;
  isReport?: boolean;
  pdfUrl?: string;
  requestId?: string;
}

const STATUS_COLORS: Record<StepStatus, {
  circle: string;
  border: string;
  text: string;
  bg: string;
  badge: string;
  label: string;
}> = {
  waiting: {
    circle: "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-900 dark:text-slate-600 dark:border-slate-800",
    border: "border-slate-200 dark:border-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    bg: "bg-white dark:bg-slate-900/50",
    badge: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    label: "Waiting"
  },
  running: {
    circle: "bg-blue-500 text-white border-blue-500 pulse-ring",
    border: "border-blue-500/50 dark:border-blue-500/40",
    text: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-500/5 dark:bg-blue-500/5",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 dark:border-blue-500/30",
    label: "Analyzing"
  },
  pass: {
    circle: "bg-emerald-500 text-white border-emerald-500",
    border: "border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-white dark:bg-slate-900/50",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    label: "Pass"
  },
  warn: {
    circle: "bg-amber-500 text-white border-amber-500",
    border: "border-amber-500/30",
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-white dark:bg-slate-900/50",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    label: "Warning"
  },
  block: {
    circle: "bg-rose-500 text-white border-rose-500",
    border: "border-rose-500/30",
    text: "text-rose-700 dark:text-rose-400",
    bg: "bg-white dark:bg-slate-900/50",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
    label: "Blocked"
  },
  escalated: {
    circle: "bg-orange-500 text-white border-orange-500",
    border: "border-orange-500/30",
    text: "text-orange-700 dark:text-orange-400",
    bg: "bg-white dark:bg-slate-900/50",
    badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30",
    label: "Escalated"
  },
  done: {
    circle: "bg-emerald-500 text-white border-emerald-500",
    border: "border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-white dark:bg-slate-900/50",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    label: "Compiled"
  }
};

const StatusIcon: React.FC<{ status: StepStatus; className?: string }> = ({ status, className = "w-4 h-4" }) => {
  if (status === "waiting") return <Circle className={className} />;
  if (status === "running") return <Loader2 className={`${className} spin-slow`} />;
  if (status === "pass" || status === "done") return <Check className={className} />;
  if (status === "warn") return <AlertTriangle className={className} />;
  if (status === "block") return <X className={className} />;
  if (status === "escalated") return <ArrowUp className={className} />;
  return <Circle className={className} />;
};

const Connector: React.FC<{ fromStatus: StepStatus; toStatus: StepStatus }> = ({ fromStatus, toStatus }) => {
  // Determine the line style based on the previous (from) step's state
  if (fromStatus === "running") {
    // Animated dashed line flowing downward (blue)
    return (
      <div
        className="absolute left-[19px] top-12 bottom-0 w-[2px] -z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: "linear-gradient(to bottom, #3b82f6 50%, transparent 50%)",
          backgroundSize: "2px 12px",
          backgroundRepeat: "repeat-y",
          animation: "flowDown 1s linear infinite"
        }}
      />
    );
  }
  if (
    fromStatus === "pass" ||
    fromStatus === "done" ||
    fromStatus === "warn" ||
    fromStatus === "block" ||
    fromStatus === "escalated"
  ) {
    const color =
      fromStatus === "pass" || fromStatus === "done" ? "#10b981" :
      fromStatus === "warn" ? "#f59e0b" :
      fromStatus === "block" ? "#f43f5e" :
      "#f97316";
    return (
      <div
        className="absolute left-[19px] top-12 bottom-0 w-[2px] -z-0 pointer-events-none"
        style={{ background: color }}
        aria-hidden="true"
      />
    );
  }
  // waiting → gray
  return (
    <div
      className="absolute left-[19px] top-12 bottom-0 w-[2px] bg-slate-200 dark:bg-slate-800 -z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
};

export const AgentStep: React.FC<AgentStepProps> = ({
  id,
  name,
  description,
  icon: Icon,
  status,
  verdict,
  reason,
  timestamp,
  isLast = false,
  prevStatus,
  isReport = false,
  pdfUrl,
  requestId
}) => {
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.waiting;
  const isRunning = status === "running";
  const isWaiting = status === "waiting";
  const showDetails = !isWaiting;

  return (
    <div className="relative">
      {!isLast && prevStatus && <Connector fromStatus={prevStatus} toStatus={status} />}

      <div
        id={id || `agent-step-${name.toLowerCase().replace(/\s+/g, "-")}`}
        className={`relative border rounded-xl p-4 transition-all duration-300 overflow-hidden ${cfg.border} ${cfg.bg} ${
          isRunning ? "border-l-2 border-l-[#3b82f6] shadow-sm shadow-blue-500/5" : ""
        }`}
      >
        <div className="flex items-start gap-3.5">
          {/* Status circle (32px) */}
          <div className="relative shrink-0">
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${cfg.circle}`}
            >
              <StatusIcon status={status} className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${isRunning ? "text-blue-500" : "text-slate-500"}`} />
                  <h4 className="text-[14px] font-medium text-slate-900 dark:text-slate-50 leading-none">
                    {name}
                  </h4>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
                  {description}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border font-mono ${cfg.badge}`}
              >
                {status === "running" && <Loader2 className="w-2.5 h-2.5 spin-slow" />}
                {cfg.label}
              </span>
            </div>

            {/* Verdict + reason — animated height expand */}
            {showDetails && (
              <div className="expand-height overflow-hidden mt-3">
                {verdict && (
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">VERDICT</span>
                    <span className={`text-[13px] font-bold ${cfg.text}`}>{verdict}</span>
                  </div>
                )}
                {reason && (
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal whitespace-pre-wrap">
                    {reason}
                  </p>
                )}
                {timestamp && (
                  <div className="flex items-center mt-2.5 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                    <Calendar className="w-3 h-3 mr-1.5 opacity-75" />
                    <span>Completed at {formatTimeUTC(timestamp)} UTC</span>
                  </div>
                )}
                {isReport && status === "done" && requestId && (
                  <button
                    type="button"
                    onClick={() => window.open(`/api/requests/${requestId}/report`, "_blank")}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download Audit PDF</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
