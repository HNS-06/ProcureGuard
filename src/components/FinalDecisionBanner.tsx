import React from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import type { ProcurementRequest } from "../types";

interface FinalDecisionBannerProps {
  id?: string;
  request: ProcurementRequest;
}

type DecisionKind = "approved" | "rejected" | "escalated";

interface DecisionConfig {
  bg: string;
  border: string;
  text: string;
  subtext: string;
  iconBg: string;
  iconColor: string;
  heading: string;
  icon: React.ComponentType<{ className?: string }>;
  reasonLabel: string;
}

const DECISION_CONFIG: Record<DecisionKind, DecisionConfig> = {
  approved: {
    bg: "bg-[#052e16] dark:bg-[#052e16]",
    border: "border-emerald-500/40",
    text: "text-emerald-50",
    subtext: "text-emerald-200/80",
    iconBg: "bg-emerald-500/20 border-emerald-400/40",
    iconColor: "text-emerald-300",
    heading: "Request Approved",
    icon: Check,
    reasonLabel: "Auto-approval reason"
  },
  rejected: {
    bg: "bg-[#450a0a] dark:bg-[#450a0a]",
    border: "border-rose-500/40",
    text: "text-rose-50",
    subtext: "text-rose-200/80",
    iconBg: "bg-rose-500/20 border-rose-400/40",
    iconColor: "text-rose-300",
    heading: "Request Rejected",
    icon: X,
    reasonLabel: "Rejection reason"
  },
  escalated: {
    bg: "bg-[#431407] dark:bg-[#431407]",
    border: "border-amber-500/40",
    text: "text-amber-50",
    subtext: "text-amber-200/80",
    iconBg: "bg-amber-500/20 border-amber-400/40",
    iconColor: "text-amber-300",
    heading: "Escalated to Human Review",
    icon: AlertTriangle,
    reasonLabel: "Escalation reason"
  }
};

export const FinalDecisionBanner: React.FC<FinalDecisionBannerProps> = ({ id, request }) => {
  const { final_decision, agents, human_decision, status } = request;

  // Determine which decision to render
  let kind: DecisionKind | null = null;
  if (final_decision === "approved" || status === "approved") kind = "approved";
  else if (final_decision === "rejected" || status === "rejected") kind = "rejected";
  else if (final_decision === "escalated_to_human" || status === "escalated") kind = "escalated";

  // Show the "still reviewing" placeholder while no decision exists
  if (!kind) {
    return (
      <div
        id={id || "final-decision-active"}
        className="mt-6 border border-blue-500/20 rounded-xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-500/5 dark:to-transparent p-5 flex flex-col md:flex-row items-center justify-between fade-slide-up"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/15">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-ping"></span>
          </div>
          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              AI Assessment Active
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              The multi-agent system is processing the request and checking security policy compliance constraints in real time...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const cfg = DECISION_CONFIG[kind];
  const Icon = cfg.icon;

  // Reason text: prefer human-decision note, else manager agent's reason
  const reasonText = human_decision?.note || agents.manager.reason || "No reason provided.";

  return (
    <div
      id={id || `final-decision-banner-${kind}`}
      className={`mt-6 border rounded-xl p-5 md:p-6 fade-slide-up ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center ${cfg.iconBg} ${cfg.iconColor}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-xl font-black tracking-tight ${cfg.text} leading-tight`}>
            {cfg.heading}
          </h4>
          {human_decision && (
            <p className={`text-[10px] font-mono uppercase tracking-widest mt-1 ${cfg.subtext}`}>
              Human override · {human_decision.decided_by} · {new Date(human_decision.decided_at).toUTCString().replace("GMT", "UTC")}
            </p>
          )}
          <div className="mt-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${cfg.subtext}`}>
              {cfg.reasonLabel}
            </span>
            <p className={`text-sm mt-1 leading-relaxed ${cfg.subtext}`}>{reasonText}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
