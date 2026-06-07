import React from "react";
import { useNavigate } from "react-router-dom";
import { client } from "../api/client";
import { SubmitForm } from "../components/SubmitForm";
import { ArrowLeft, Sparkles } from "lucide-react";

export const SubmitRequest: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (formData: {
    item_description: string;
    quantity: number;
    unit_cost: number;
    department: string;
    vendor_name: string;
    urgency: "low" | "medium" | "high";
    justification: string;
  }) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await client.submitRequest(formData);
      navigate(`/requests/${res.request_id}`);
    } catch (err: any) {
      console.error("Failed to post procurement:", err);
      setErrorMessage("Disruption registering procurement request. Please verify connection credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return</span>
        </button>
      </div>

      {/* Heading banner */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Intake Registration Terminal
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
            Authorize new corporate purchase cycles. Your application is auto-submitted to a 5-phase Multi-Agent deep validation check.
          </p>
        </div>
        <div className="p-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-zinc-650 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 shrink-0 hidden sm:block">
          <Sparkles className="w-5 h-5 animate-pulse text-zinc-600 dark:text-zinc-400" />
        </div>
      </div>

      {errorToast(errorMessage, () => setErrorMessage(null))}

      {/* Submit Form Component */}
      <SubmitForm isSubmitting={isSubmitting} onSubmit={handleSubmit} />
    </div>
  );
};

// Quick functional block to draw toast
function errorToast(msg: string | null, onClear: () => void) {
  if (!msg) return null;
  return (
    <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-550/10 border border-rose-200 dark:border-rose-550/20 text-rose-700 dark:text-rose-400 text-xs font-semibold">
      <div className="flex items-center justify-between">
        <span>{msg}</span>
        <button onClick={onClear} className="font-bold underline uppercase text-[10px] cursor-pointer pl-2">
          Dismiss
        </button>
      </div>
    </div>
  );
}
