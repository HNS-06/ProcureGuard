import React from "react";
import { AlertTriangle, Sparkles, Laptop, Globe, Flame, Loader2, AlertCircle } from "lucide-react";
import { client } from "../api/client";
import type { DepartmentBudget, UrgencyType } from "../types";
import { formatCurrency } from "../utils/formatters";

interface SubmitFormProps {
  id?: string;
  isSubmitting: boolean;
  onSubmit: (formData: {
    item_description: string;
    quantity: number;
    unit_cost: number;
    department: string;
    vendor_name: string;
    urgency: UrgencyType;
    justification: string;
  }) => void;
}

const DEPARTMENTS = ["Engineering", "HR", "Finance", "Operations", "Marketing", "Legal"];

const URGENCY_OPTIONS: Array<{
  value: UrgencyType;
  label: string;
  selectedBg: string;
}> = [
  { value: "low", label: "Low", selectedBg: "bg-emerald-600 text-white border-emerald-600" },
  { value: "medium", label: "Medium", selectedBg: "bg-amber-500 text-white border-amber-500" },
  { value: "high", label: "High", selectedBg: "bg-rose-600 text-white border-rose-600" }
];

const totalColor = (total: number): string => {
  if (total < 10000) return "text-emerald-600 dark:text-emerald-400";
  if (total < 50000) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

export const SubmitForm: React.FC<SubmitFormProps> = ({ id, isSubmitting, onSubmit }) => {
  const [desc, setDesc] = React.useState<string>("");
  const [qty, setQty] = React.useState<number>(1);
  const [unitCost, setUnitCost] = React.useState<number>(0);
  const [dept, setDept] = React.useState<string>("Engineering");
  const [vendor, setVendor] = React.useState<string>("");
  const [urgency, setUrgency] = React.useState<UrgencyType>("medium");
  const [justification, setJustification] = React.useState<string>("");

  const [validationError, setValidationError] = React.useState<string>("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const [budgets, setBudgets] = React.useState<DepartmentBudget[]>([]);

  // Load department budgets once on mount
  React.useEffect(() => {
    let cancelled = false;
    client
      .getDeptBudgets()
      .then(list => {
        if (!cancelled) setBudgets(list);
      })
      .catch(() => {
        if (!cancelled) setBudgets([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalCost = qty * unitCost;

  const formatTotal = (val: number): string => formatCurrency(val, { fractionDigits: 2 });

  const deptBudget = React.useMemo(
    () => budgets.find(b => b.department === dept),
    [budgets, dept]
  );

  // Real-time validation
  React.useEffect(() => {
    const errs: Record<string, string> = {};
    if (desc && desc.trim().length < 10) errs.item_description = "Item description must be at least 10 characters.";
    if (qty && (!Number.isInteger(qty) || qty <= 0)) errs.quantity = "Quantity must be a positive integer.";
    if (unitCost && unitCost <= 0) errs.unit_cost = "Unit cost must be greater than 0.";
    if (unitCost && unitCost > 999999) errs.unit_cost = "Unit cost cannot exceed $999,999.";
    if (vendor && vendor.trim().length < 2) errs.vendor_name = "Vendor name must be at least 2 characters.";
    if (totalCost > 10000 && justification && justification.trim().length > 0 && justification.trim().length < 15) {
      errs.justification = "Justification must be at least 15 characters.";
    }
    setFieldErrors(errs);
  }, [desc, qty, unitCost, vendor, justification, totalCost]);

  const fillPreset = (type: "nominal" | "escalated" | "rejected") => {
    if (type === "nominal") {
      setDesc("50 Dell XPS Enterprise Laptops for Engineering");
      setQty(50);
      setUnitCost(1500);
      setDept("Engineering");
      setVendor("Dell Technologies");
      setUrgency("high");
      setJustification("Critical onboarding batch for Q3 software engineering interns and new hires. Standard developer configuration.");
    } else if (type === "escalated") {
      setDesc("Enterprise Cloudflare CDN and WAF Security License");
      setQty(1);
      setUnitCost(18500);
      setDept("Finance");
      setVendor("Cloudflare Inc.");
      setUrgency("high");
      setJustification("To mitigate DDOS vulnerabilities flagged on our payment routing infrastructure by external security audits.");
    } else if (type === "rejected") {
      setDesc("12 Custom Premium Ergonomic VR Developer Chairs");
      setQty(12);
      setUnitCost(6500);
      setDept("Marketing");
      setVendor("Aether Luxe Living");
      setUrgency("low");
      setJustification("To furnish the creative content lounge and boost physical morale for the promotional branding team.");
    }
    setValidationError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!desc.trim() || desc.trim().length < 10) errs.item_description = "Item description is required (min 10 chars).";
    if (!Number.isInteger(qty) || qty <= 0) errs.quantity = "Quantity must be a positive integer.";
    if (unitCost <= 0) errs.unit_cost = "Unit cost must be greater than 0.";
    if (unitCost > 999999) errs.unit_cost = "Unit cost cannot exceed $999,999.";
    if (!vendor.trim() || vendor.trim().length < 2) errs.vendor_name = "Vendor name is required (min 2 chars).";
    if (totalCost > 10000 && (!justification.trim() || justification.trim().length < 15)) {
      errs.justification = "Justification is required for amounts over $10,000 (min 15 chars).";
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setValidationError("Please correct the highlighted fields.");
      return;
    }
    setFieldErrors({});
    setValidationError("");
    onSubmit({
      item_description: desc,
      quantity: qty,
      unit_cost: unitCost,
      department: dept,
      vendor_name: vendor,
      urgency,
      justification
    });
  };

  return (
    <form
      id={id || "submit-procurement-form"}
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-sm"
    >
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-wider uppercase">
          New Procurement Details
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Complete the ledger fields below to request AI orchestration review and automatic audits.
        </p>
      </div>

      {/* Interactive Test Sandbox Fills */}
      <div className="mb-5 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 mb-2.5">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
            Interactive Test Sandbox Fills
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-tight">
          Select a template profile below to instantly pre-fill key ledger compliance limits. This triggers distinct automated pipeline results.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => fillPreset("nominal")}
            className="flex items-center space-x-2 p-2.5 bg-white hover:bg-emerald-50/30 dark:bg-slate-900 dark:hover:bg-emerald-900/10 border border-slate-200 dark:border-slate-800 rounded-lg text-left transition-all group hover:border-emerald-500/20 cursor-pointer"
          >
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/15">
              <Laptop className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Nominal Flow
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                XPS Laptops (~$75k)
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fillPreset("escalated")}
            className="flex items-center space-x-2 p-2.5 bg-white hover:bg-amber-50/30 dark:bg-slate-900 dark:hover:bg-amber-900/10 border border-slate-200 dark:border-slate-800 rounded-lg text-left transition-all group hover:border-amber-500/20 cursor-pointer"
          >
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/15">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-none group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Manual Override
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                CDN Licenses (~$18k)
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fillPreset("rejected")}
            className="flex items-center space-x-2 p-2.5 bg-white hover:bg-rose-50/30 dark:bg-slate-900 dark:hover:bg-rose-900/10 border border-slate-200 dark:border-slate-800 rounded-lg text-left transition-all group hover:border-rose-500/20 cursor-pointer"
          >
            <div className="p-1.5 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/15">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-none group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Policy Blocked
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                Luxe Chairs (~$78k)
              </p>
            </div>
          </button>
        </div>
      </div>

      {validationError && (
        <div className="mb-5 p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Item Description */}
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-1.5">
            Item Description / Scope <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="e.g. 50 Laptops from Dell, Engineering dept, SOC-2 Intern Batch"
            className={`w-full text-xs bg-slate-50 dark:bg-slate-950 border rounded-lg p-2.5 focus:bg-white dark:focus:bg-slate-900 focus:ring-1.5 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 ${
              fieldErrors.item_description
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
                : "border-slate-200 dark:border-slate-800 focus:border-indigo-500"
            }`}
            disabled={isSubmitting}
          />
          {fieldErrors.item_description && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors.item_description}
            </p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-1.5">
            Quantity <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={qty || ""}
            onChange={e => setQty(Math.max(0, parseInt(e.target.value) || 0))}
            className={`w-full text-xs bg-slate-50 dark:bg-slate-950 border rounded-lg p-2.5 focus:bg-white dark:focus:bg-slate-900 focus:ring-1.5 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-slate-100 ${
              fieldErrors.quantity
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
                : "border-slate-200 dark:border-slate-800 focus:border-indigo-500"
            }`}
            disabled={isSubmitting}
          />
          {fieldErrors.quantity && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors.quantity}
            </p>
          )}
        </div>

        {/* Unit Cost */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-1.5">
            Unit Cost (USD) <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400 font-mono text-xs">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={unitCost || ""}
              onChange={e => setUnitCost(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0.00"
              className={`w-full text-xs bg-slate-50 dark:bg-slate-950 border rounded-lg p-2.5 pl-7 focus:bg-white dark:focus:bg-slate-900 focus:ring-1.5 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-100 ${
                fieldErrors.unit_cost
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-200 dark:border-slate-800 focus:border-indigo-500"
              }`}
              disabled={isSubmitting}
            />
          </div>
          {fieldErrors.unit_cost && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors.unit_cost}
            </p>
          )}
        </div>

        {/* Department with budget remaining */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-1.5">
            Department Allocation <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={dept}
              onChange={e => setDept(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:bg-white dark:focus:bg-slate-900 focus:ring-1.5 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-200 cursor-pointer"
              disabled={isSubmitting}
            >
              {DEPARTMENTS.map(d => {
                const b = budgets.find(x => x.department === d);
                const remaining = b ? b.remaining : null;
                const warn = b && b.status !== "healthy";
                return (
                  <option key={d} value={d}>
                    {d}{remaining !== null ? ` ($${remaining.toLocaleString()} remaining)` : ""}
                  </option>
                );
              })}
            </select>
          </div>
          {deptBudget && deptBudget.status !== "healthy" && (
            <p className={`text-[11px] mt-1 flex items-center gap-1 ${
              deptBudget.status === "critical" ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"
            }`}>
              <AlertCircle className="w-3 h-3" />
              {deptBudget.status === "critical"
                ? `Department ${dept} is at ${deptBudget.percent_used}% of budget — submission may be blocked.`
                : `Department ${dept} is at ${deptBudget.percent_used}% of budget — careful planning recommended.`}
            </p>
          )}
        </div>

        {/* Vendor Name */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-1.5">
            Vendor / Supplier <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={vendor}
            onChange={e => setVendor(e.target.value)}
            placeholder="e.g. Dell Technologies Inc."
            className={`w-full text-xs bg-slate-50 dark:bg-slate-950 border rounded-lg p-2.5 focus:bg-white dark:focus:bg-slate-900 focus:ring-1.5 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-100 ${
              fieldErrors.vendor_name
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
                : "border-slate-200 dark:border-slate-800 focus:border-indigo-500"
            }`}
            disabled={isSubmitting}
          />
          {fieldErrors.vendor_name && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors.vendor_name}
            </p>
          )}
        </div>

        {/* Urgency — segmented control with colors */}
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-1.5">
            Procurement Priority / Urgency <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {URGENCY_OPTIONS.map(opt => {
              const selected = urgency === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUrgency(opt.value)}
                  className={`px-3 py-2.5 border rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    selected
                      ? `${opt.selectedBg} shadow-sm`
                      : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950"
                  }`}
                  disabled={isSubmitting}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Justification */}
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-1.5">
            Purchase Justification / Audit Logs notes{" "}
            {totalCost > 10000 ? <span className="text-rose-500">*</span> : <span className="text-slate-400">(required over $10k)</span>}
          </label>
          <textarea
            value={justification}
            onChange={e => setJustification(e.target.value)}
            placeholder="Please detail why this expense is required, who standard approvals are aligned with, and details of materials use (Min 15 chars)..."
            className={`w-full text-xs bg-slate-50 dark:bg-slate-950 border rounded-lg p-2.5 h-24 focus:bg-white dark:focus:bg-slate-900 focus:ring-1.5 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 resize-none ${
              fieldErrors.justification
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
                : "border-slate-200 dark:border-slate-800 focus:border-indigo-500"
            }`}
            disabled={isSubmitting}
          />
          {fieldErrors.justification && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors.justification}
            </p>
          )}
        </div>
      </div>

      {/* Live Total Cost */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Total Cost
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Quantity ({qty}) × Unit Cost (${unitCost.toLocaleString()})
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
              Auto-approve threshold: $10,000
            </p>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-extrabold font-mono tabular-nums ${totalColor(totalCost)}`}>
              {formatTotal(totalCost)}
            </span>
            <p className={`text-[10px] mt-0.5 font-bold uppercase tracking-wider ${
              totalCost < 10000 ? "text-emerald-600 dark:text-emerald-400" :
              totalCost < 50000 ? "text-amber-600 dark:text-amber-400" :
              "text-rose-600 dark:text-rose-400"
            }`}>
              {totalCost < 10000 ? "Auto-approve zone" : totalCost < 50000 ? "Manager review" : "VP escalation"}
            </p>
          </div>
        </div>
      </div>

      {/* Submit Controls */}
      <div className="mt-6 flex items-center justify-end">
        <button
          type="submit"
          className="w-full md:w-auto px-5 py-2.5 bg-slate-950 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg shadow transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="w-3.5 h-3.5 spin-slow" />}
          {isSubmitting ? "Submitting to AI pipeline..." : "Submit for system approval"}
        </button>
      </div>
    </form>
  );
};
