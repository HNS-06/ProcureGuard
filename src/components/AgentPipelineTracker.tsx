import React from "react";
import { Wallet, ShieldCheck, Scale, Award, FileSpreadsheet } from "lucide-react";
import type { AgentPipeline } from "../types";
import { AgentStep, type StepStatus } from "./AgentStep";

interface AgentPipelineTrackerProps {
  id?: string;
  agents?: AgentPipeline;
}

const mapStatus = (s: string): StepStatus => {
  if (s === "done") return "done";
  return s as StepStatus;
};

const AGENT_STEPS: Array<{
  key: keyof AgentPipeline;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  buildData: (agents: AgentPipeline) => { status: StepStatus; verdict: string; reason: string; timestamp: string };
}> = [
  {
    key: "budget",
    name: "Budget Agent",
    description: "Checks department spending limits against annual caps",
    icon: Wallet,
    buildData: (a) => ({
      status: mapStatus(a.budget.status),
      verdict: a.budget.verdict,
      reason: a.budget.reason,
      timestamp: a.budget.timestamp
    })
  },
  {
    key: "vendor_risk",
    name: "Vendor Risk Agent",
    description: "Scores supplier risk across financial, geo, and history factors",
    icon: ShieldCheck,
    buildData: (a) => ({
      status: mapStatus(a.vendor_risk.status),
      verdict: a.vendor_risk.verdict,
      reason: a.vendor_risk.reason,
      timestamp: a.vendor_risk.timestamp
    })
  },
  {
    key: "compliance",
    name: "Compliance Agent",
    description: "Validates against PO rules, spend policies, and dual-approval thresholds",
    icon: Scale,
    buildData: (a) => ({
      status: mapStatus(a.compliance.status),
      verdict: a.compliance.verdict,
      reason: a.compliance.reason,
      timestamp: a.compliance.timestamp
    })
  },
  {
    key: "manager",
    name: "Manager Approval Agent",
    description: "Makes final auto-approval decision or escalates to human review",
    icon: Award,
    buildData: (a) => ({
      status: mapStatus(a.manager.status),
      verdict: a.manager.verdict,
      reason: a.manager.reason,
      timestamp: a.manager.timestamp
    })
  },
  {
    key: "report",
    name: "Report Agent",
    description: "Generates full PDF audit trail and executive summary",
    icon: FileSpreadsheet,
    buildData: (a) => ({
      status: mapStatus(a.report.status),
      verdict: a.report.status === "done" ? "COMPILED" : a.report.status === "running" ? "BUILDING" : "WAITING",
      reason: a.report.status === "done"
        ? "PDF transaction audit log is available for download. Log has been signed and locked."
        : a.report.status === "running"
          ? "Gathering agent outputs to compile full PDF transaction audit logs..."
          : "Waiting for preceding checkpoints to complete.",
      timestamp: a.report.timestamp
    })
  }
];

export const AgentPipelineTracker: React.FC<AgentPipelineTrackerProps> = ({ id, agents }) => {
  if (!agents) {
    return (
      <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-center text-slate-500 text-sm">
        No active pipeline logs recorded for this request.
      </div>
    );
  }

  // Compute per-step data with the running connector rule (from previous step)
  const rendered = AGENT_STEPS.map((step) => ({
    step,
    data: step.buildData(agents)
  }));

  return (
    <div id={id || "agent-pipeline-tracker"} className="relative">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-wider uppercase">
          AI Multi-Agent Pipeline
        </h3>
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
          <span>5 agents</span>
          <span>·</span>
          <span>poll 3s</span>
        </div>
      </div>

      <div className="space-y-3 relative">
        {rendered.map((r, idx) => {
          const prev = idx > 0 ? rendered[idx - 1].data.status : undefined;
          return (
            <AgentStep
              key={r.step.key}
              name={r.step.name}
              description={r.step.description}
              icon={r.step.icon}
              status={r.data.status}
              verdict={r.data.verdict}
              reason={r.data.reason}
              timestamp={r.data.timestamp}
              isLast={idx === rendered.length - 1}
              prevStatus={prev}
            />
          );
        })}
      </div>
    </div>
  );
};
