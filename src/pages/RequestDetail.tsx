import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { client } from "../api/client";
import type { ProcurementRequest } from "../types";
import { usePolling } from "../hooks/usePolling";
import { useToast } from "../hooks/useToast";
import { StatusBadge } from "../components/StatusBadge";
import { AgentPipelineTracker } from "../components/AgentPipelineTracker";
import { FinalDecisionBanner } from "../components/FinalDecisionBanner";
import { HumanReviewPanel } from "../components/HumanReviewPanel";
import { BandContextViewer } from "../components/BandContextViewer";
import { AuditTrail } from "../components/AuditTrail";
import { StatCardSkeleton, PipelineStepSkeleton } from "../components/SkeletonRow";
import {
  ArrowLeft,
  Calendar,
  FileDown,
  ShieldCheck,
  Info,
  Loader2,
  Hash,
  Building2,
  User as UserIcon,
  Zap
} from "lucide-react";
import { formatCurrency, formatDate } from "../utils/formatters";

export const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isDecisionSubmitting, setIsDecisionSubmitting] = React.useState<boolean>(false);
  const [downloadingReport, setDownloadingReport] = React.useState<boolean>(false);
  const [errorToast, setErrorToast] = React.useState<string | null>(null);
  const [humanDecision, setHumanDecision] = React.useState<ProcurementRequest["human_decision"]>(null);

  // Poll the request detail every 3s
  const detailPoll = usePolling<ProcurementRequest>(
    () => client.getRequest(id as string),
    3000,
    !!id
  );

  const request = detailPoll.data;
  const loading = detailPoll.loading && !request;

  // Sync local human decision state
  React.useEffect(() => {
    if (request?.human_decision) {
      setHumanDecision(request.human_decision);
    }
  }, [request?.human_decision]);

  // Watch for status changes between polls to show toasts
  const prevStatusRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!request) return;
    if (prevStatusRef.current && prevStatusRef.current !== request.status) {
      const reasonSnippet = (request.agents.manager.reason ||
        request.audit_trail[request.audit_trail.length - 1]?.reason || "").slice(0, 80);
      if (request.status === "approved") {
        toast({ variant: "success", title: `${request.request_id} auto-approved`, description: reasonSnippet });
      } else if (request.status === "rejected") {
        toast({ variant: "error", title: `${request.request_id} rejected`, description: reasonSnippet });
      } else if (request.status === "escalated") {
        toast({ variant: "warning", title: `${request.request_id} escalated to human review`, description: reasonSnippet });
      }
    }
    prevStatusRef.current = request.status;
  }, [request, toast]);

  // Show the network error toast when polling fails
  React.useEffect(() => {
    if (detailPoll.error) {
      setErrorToast("Ledger synchronization interrupted. Retrying live poll...");
    } else {
      setErrorToast(null);
    }
  }, [detailPoll.error]);

  const handleDecisionSubmit = async (decision: "approved" | "rejected", note: string) => {
    if (!id) return;
    try {
      setIsDecisionSubmitting(true);
      setErrorToast(null);
      const updated = await client.submitHumanDecision(id, decision, note);
      setHumanDecision(updated.human_decision || null);
      toast({
        variant: decision === "approved" ? "success" : "error",
        title: `Human decision recorded`,
        description: `${id} ${decision === "approved" ? "approved" : "rejected"} by you.`
      });
    } catch (err) {
      console.error("Human override submittal failed:", err);
      setErrorToast("Manual exception audit override submittal failed. Please retry.");
    } finally {
      setIsDecisionSubmitting(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!id) return;
    try {
      setDownloadingReport(true);
      setErrorToast(null);
      const blob = await client.getReportBlob(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Procurement-Audit-Report-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setErrorToast("Failed to compile audit report PDF. Please try again.");
    } finally {
      setDownloadingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="skeleton-shimmer w-24 h-5 rounded" />
            <div className="skeleton-shimmer w-40 h-3 rounded" />
          </div>
          <div className="skeleton-shimmer w-3/4 h-6 rounded" />
          <div className="grid grid-cols-3 gap-4">
            <div className="skeleton-shimmer h-12 rounded" />
            <div className="skeleton-shimmer h-12 rounded" />
            <div className="skeleton-shimmer h-12 rounded" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <PipelineStepSkeleton />
          <PipelineStepSkeleton />
          <PipelineStepSkeleton />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="py-20 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl">
        <p className="text-slate-500 text-sm">Requested procurement transaction identifier not found.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-950 rounded-lg text-xs font-bold cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isReportCompleted = request.agents.report.status === "done";
  const isPending = request.status === "pending" || request.status === "in_review";
  const isEscalated = request.status === "escalated" && !humanDecision;
  const showHumanReview = isEscalated;
  const escalationReason =
    request.audit_trail.find(e => /escalat/i.test(e.verdict) || /escalat/i.test(e.reason))?.reason ||
    request.agents.manager.reason;

  // Urgency badge color
  const urgencyStyles = {
    high: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
  } as const;

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Error toast */}
      {errorToast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-orange-600 border border-orange-500/10 text-white text-xs font-semibold shadow-2xl flex items-center space-x-3 max-w-sm">
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

      {/* Back link */}
      <div>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>

      {/* Top Request Summary Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50/50 dark:bg-slate-950/45 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            <span className="inline-flex items-center font-mono text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded border border-slate-200/50 dark:border-slate-800">
              <Hash className="w-3 h-3 mr-1" />
              {request.request_id}
            </span>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Submitted {formatDate(request.request.submitted_date)}</span>
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold border tracking-wider uppercase ${urgencyStyles[request.request.urgency]}`}>
              {request.request.urgency} urgency
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {isPending && (
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/10 uppercase tracking-widest font-mono mr-2 animate-pulse">
                <Zap className="w-3 h-3 mr-1 animate-spin" />
                Live Review Active
              </span>
            )}
            <StatusBadge status={request.status} />
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            <div className="md:col-span-3 space-y-4">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                  Purchase Object Scope
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug mt-1 border-b border-slate-100 dark:border-slate-800 pb-3">
                  {request.request.item_description}
                </h3>
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                  Procurement Justification notes
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-normal leading-relaxed whitespace-pre-wrap mt-1">
                  {request.request.justification}
                </p>
              </div>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-5 border border-slate-200/50 dark:border-slate-800/60 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">
                  Consolidated Liability
                </span>
                <p className="text-2xl font-black text-slate-950 dark:text-slate-50 font-mono mt-1">
                  {formatCurrency(request.request.total_cost)}
                </p>
                <div className="text-[10px] text-slate-500 mt-1 font-semibold space-y-1">
                  <p>Unit price: ${request.request.unit_cost.toLocaleString()} each</p>
                  <p>Quantity ordered: {request.request.quantity}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-medium leading-none">
                  <span className="text-slate-400 inline-flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Department
                  </span>
                  <span className="text-slate-800 dark:text-slate-300 font-semibold">
                    {request.request.department}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium leading-none">
                  <span className="text-slate-400">Vendor</span>
                  <span className="text-slate-800 dark:text-slate-300 font-semibold truncate max-w-[110px]" title={request.request.vendor_name}>
                    {request.request.vendor_name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium leading-none">
                  <span className="text-slate-400 inline-flex items-center gap-1">
                    <UserIcon className="w-3 h-3" /> Owner
                  </span>
                  <span className="text-slate-800 dark:text-slate-300 font-semibold truncate max-w-[110px]" title={request.request.submitted_by}>
                    {request.request.submitted_by}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column core: pipeline + side actions */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
        {/* Left column (65%) — Pipeline + Final Decision + Human Review */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-xl shadow-sm">
            <AgentPipelineTracker agents={request.agents} requestId={request.request_id} />
            <FinalDecisionBanner request={request} />
          </div>

          {/* Human Review Panel — conditional */}
          {showHumanReview && (
            <HumanReviewPanel
              isSubmitting={isDecisionSubmitting}
              onSubmit={handleDecisionSubmit}
              reason={escalationReason}
            />
          )}
        </div>

        {/* Right column (35%) — Report download, Band viewer, Audit trail */}
        <div className="lg:col-span-3 space-y-6">
          {/* Download Report */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-sm font-bold tracking-tight">Audit File Compliance</h4>
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              On final contract sign-off of the processing pipeline checkpoints, the cryptographic compliance file package completes compiling.
            </p>
            {isReportCompleted ? (
              <button
                onClick={handleDownloadReport}
                disabled={downloadingReport}
                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {downloadingReport ? <Loader2 className="w-4 h-4 spin-slow" /> : <FileDown className="w-4 h-4" />}
                <span>{downloadingReport ? "Compiling PDF..." : "Download Audit PDF"}</span>
              </button>
            ) : (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span className="text-[11px] text-slate-500 leading-normal font-medium">
                  Compliance transaction audit file compilation will complete automatically once the Report Agent completes sign-off operations.
                </span>
              </div>
            )}
          </div>

          {/* Band Context Viewer — collapsible, default collapsed */}
          <BandContextViewer
            data={request.procurement_context || {
              request_id: request.request_id,
              request: request.request,
              agents: request.agents,
              audit_trail: request.audit_trail,
              final_decision: request.final_decision
            }}
            defaultExpanded={false}
          />

          {/* Audit Trail */}
          <AuditTrail entries={request.audit_trail} />
        </div>
      </div>
    </div>
  );
};
