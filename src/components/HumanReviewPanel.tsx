import React from "react";
import { UserCheck, Check, X, Loader2 } from "lucide-react";

interface HumanReviewPanelProps {
  id?: string;
  isSubmitting: boolean;
  onSubmit: (decision: "approved" | "rejected", note: string) => void;
  reason?: string;
  decision?: "approved" | "rejected" | null;
}

export const HumanReviewPanel: React.FC<HumanReviewPanelProps> = ({
  id,
  isSubmitting,
  onSubmit,
  reason,
  decision
}) => {
  const [note, setNote] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const [pendingDecision, setPendingDecision] = React.useState<"approved" | "rejected" | null>(null);

  const handleAction = (dec: "approved" | "rejected") => {
    if (!note.trim()) {
      setError("Reviewer note is required to justify a human override.");
      return;
    }
    setError("");
    setPendingDecision(dec);
    onSubmit(dec, note);
  };

  // If the human has made a decision, show a confirmation block
  if (decision) {
    const cfg = decision === "approved"
      ? {
          border: "border-l-emerald-500",
          bg: "bg-emerald-50/40 dark:bg-emerald-500/5",
          text: "text-emerald-700 dark:text-emerald-300",
          label: "Human override approved"
        }
      : {
          border: "border-l-rose-500",
          bg: "bg-rose-50/40 dark:bg-rose-500/5",
          text: "text-rose-700 dark:text-rose-300",
          label: "Human override rejected"
        };
    return (
      <div
        id={id || "human-review-decided"}
        className={`border ${cfg.border} border-l-4 border-y border-r border-slate-200 dark:border-slate-800 ${cfg.bg} rounded-xl p-5 shadow-sm`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-md ${decision === "approved" ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>
            {decision === "approved" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </div>
          <h4 className={`text-sm font-extrabold uppercase tracking-wider ${cfg.text}`}>
            {cfg.label}
          </h4>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          The report agent is now compiling the final PDF audit trail. Refresh the audit log below in a few seconds.
        </p>
      </div>
    );
  }

  return (
    <div
      id={id || "human-review-panel"}
      className="border-l-4 border-amber-500 border-y border-r border-slate-200 dark:border-slate-800 rounded-xl bg-amber-50/30 dark:bg-amber-500/5 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 leading-none flex items-center gap-2">
              Awaiting Human Review
              <span className="relative inline-flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
            </h4>
            <span className="text-[9px] text-amber-700/70 dark:text-amber-400/80 font-mono tracking-wider uppercase">
              Level-3 Executive Sign-Off
            </span>
          </div>
        </div>
      </div>

      {reason && (
        <div className="mb-3 p-3 rounded-lg bg-white/70 dark:bg-slate-900/40 border border-amber-200/50 dark:border-amber-500/15 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono">
            Escalation Summary
          </span>
          <p className="mt-1">{reason}</p>
        </div>
      )}

      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3.5 leading-relaxed">
        Standard AI automation halted due to exceptional limit warnings. Choose manual override below.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
            Add review note (optional)
          </label>
          <textarea
            value={note}
            onChange={e => {
              setNote(e.target.value);
              if (error && e.target.value.trim()) setError("");
            }}
            placeholder="Document compliance justification, special manager exemptions, or manual purchase ledger override references..."
            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 h-20 focus:ring-1.5 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400 resize-none"
            disabled={isSubmitting}
          />
          {error && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5 flex items-center">
              <X className="w-3 h-3 mr-1" />
              {error}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => handleAction("rejected")}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting && pendingDecision === "rejected" ? (
              <Loader2 className="w-3.5 h-3.5 spin-slow" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            <span>Reject Request</span>
          </button>

          <button
            onClick={() => handleAction("approved")}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting && pendingDecision === "approved" ? (
              <Loader2 className="w-3.5 h-3.5 spin-slow" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Approve Request</span>
          </button>
        </div>
      </div>
    </div>
  );
};
