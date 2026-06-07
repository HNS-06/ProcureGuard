import React from "react";
import { client } from "../api/client";
import { ProcurementRequest, RequestStatus } from "../types";
import { usePolling } from "../hooks/usePolling";
import { RequestTable } from "../components/RequestTable";
import { Filter, Download, RotateCcw, Search, SlidersHorizontal, ArrowDownWideNarrow } from "lucide-react";
import { formatRelativeTime } from "../utils/formatters";

export const AllRequests: React.FC = () => {
  const requestsPoll = usePolling<ProcurementRequest[]>(() => client.getRequests(), 3000);
  const requests = requestsPoll.data ?? [];
  const loading = requestsPoll.loading && !requestsPoll.data;
  const [, setTick] = React.useState<number>(0);
  const [errorToast, setErrorToast] = React.useState<string | null>(null);

  // Tick to refresh the relative time
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Filters State
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedDept, setSelectedDept] = React.useState("All");
  const [selectedStatus, setSelectedStatus] = React.useState("All");
  const [minAmount, setMinAmount] = React.useState<number>(0);
  const [maxAmount, setMaxAmount] = React.useState<number>(1000000); // 1 million default cap
  const [sortBy, setSortBy] = React.useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");
  const [filteredRequests, setFilteredRequests] = React.useState<ProcurementRequest[]>([]);

  // Show error toast on polling failure
  React.useEffect(() => {
    if (requestsPoll.error) {
      setErrorToast("Procurement API data load disruption.");
    } else {
      setErrorToast(null);
    }
  }, [requestsPoll.error]);

  // Compute filters reactively
  React.useEffect(() => {
    let result = [...requests];

    // Search bar (Description or Vendor)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.request.item_description.toLowerCase().includes(term) ||
          r.request.vendor_name.toLowerCase().includes(term) ||
          r.request_id.toLowerCase().includes(term)
      );
    }

    // Department
    if (selectedDept !== "All") {
      result = result.filter((r) => r.request.department === selectedDept);
    }

    // Status
    if (selectedStatus !== "All") {
      result = result.filter((r) => r.status === selectedStatus);
    }

    // Amount range
    result = result.filter(
      (r) => r.request.total_cost >= minAmount && r.request.total_cost <= maxAmount
    );

    // Sort mappings
    result.sort((a, b) => {
      if (sortBy === "date_desc") {
        return new Date(b.request.submitted_date).getTime() - new Date(a.request.submitted_date).getTime();
      }
      if (sortBy === "date_asc") {
        return new Date(a.request.submitted_date).getTime() - new Date(b.request.submitted_date).getTime();
      }
      if (sortBy === "amount_desc") {
        return b.request.total_cost - a.request.total_cost;
      }
      if (sortBy === "amount_asc") {
        return a.request.total_cost - b.request.total_cost;
      }
      return 0;
    });

    setFilteredRequests(result);
  }, [searchTerm, selectedDept, selectedStatus, minAmount, maxAmount, sortBy, requests]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedDept("All");
    setSelectedStatus("All");
    setMinAmount(0);
    setMaxAmount(1000000);
    setSortBy("date_desc");
  };

  // Export filtered requests to CSV
  const handleExportCSV = () => {
    const headers = [
      "Request ID",
      "Item Description",
      "Quantity",
      "Unit Cost (USD)",
      "Total Cost (USD)",
      "Department",
      "Vendor",
      "Urgency",
      "Status",
      "Submitted By",
      "Submitted Date"
    ];

    const rows = filteredRequests.map((r) => [
      r.request_id,
      `"${r.request.item_description.replace(/"/g, '""')}"`,
      r.request.quantity,
      r.request.unit_cost,
      r.request.total_cost,
      r.request.department,
      `"${r.request.vendor_name.replace(/"/g, '""')}"`,
      r.request.urgency,
      r.status,
      `"${r.request.submitted_by.replace(/"/g, '""')}"`,
      r.request.submitted_date
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Procurement_Audit_Ledger_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  };

  const departments = ["All", "Engineering", "HR", "Finance", "Operations", "Marketing", "Legal"];
  const statuses = ["All", "pending", "in_review", "approved", "rejected", "escalated"];

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Toast Helper */}
      {errorToast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-rose-600 border border-rose-500/10 text-white text-xs font-semibold shadow-2xl">
          <span>{errorToast}</span>
          <button onClick={() => setErrorToast(null)} className="ml-3 underline font-bold cursor-pointer">OK</button>
        </div>
      )}

      {/* Header section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Audit Ledger Database
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
            Analyze, filter, and extract compiled history logs of enterprise procurement applications.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredRequests.length === 0}
          className="inline-flex items-center space-x-1.5 text-xs font-bold px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Detailed filter controls panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-5 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-zinc-800 dark:text-zinc-250 pb-3 border-b border-zinc-100 dark:border-zinc-850">
          <SlidersHorizontal className="w-4 h-4 text-zinc-500" />
          <h3 className="text-xs font-black uppercase tracking-wider">Search & Filter Ledger</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Query search */}
          <div>
            <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono mb-1.5">
              Ref ID / Description / Vendor
            </label>
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search database..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2 pl-9 pr-3 focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Department dropdown */}
          <div>
            <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono mb-1.5">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-zinc-800 dark:text-zinc-300 outline-none transition-all cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status dropdown */}
          <div>
            <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono mb-1.5">
              Audit Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-zinc-800 dark:text-zinc-300 outline-none transition-all cursor-pointer"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Statuses" : s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Sorter Dropdown */}
          <div>
            <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono mb-1.5">
              Arrangement
            </label>
            <div className="relative flex items-center">
              <ArrowDownWideNarrow className="absolute left-3 w-4 h-4 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-zinc-800 dark:text-zinc-300 outline-none transition-all cursor-pointer"
              >
                <option value="date_desc">Submitted (Newest)</option>
                <option value="date_asc">Submitted (Oldest)</option>
                <option value="amount_desc">Amount (Highest)</option>
                <option value="amount_asc">Amount (Lowest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sliders and limits inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-850 flex items-center">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono mb-1">
                Min Cost (USD)
              </label>
              <input
                type="number"
                min="0"
                value={minAmount || ""}
                onChange={(e) => setMinAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono mb-1">
                Max Cost (USD)
              </label>
              <input
                type="number"
                min="0"
                value={maxAmount || ""}
                onChange={(e) => setMaxAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end h-full md:pt-4">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center space-x-1 py-2 px-3 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Controls</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid listing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-zinc-500 font-medium">
          <span>Displaying {filteredRequests.length} matching rows</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
            Last updated: {requestsPoll.lastUpdated ? formatRelativeTime(requestsPoll.lastUpdated) : "—"}
          </span>
        </div>

        <RequestTable requests={filteredRequests} loading={loading} />
      </div>
    </div>
  );
};
