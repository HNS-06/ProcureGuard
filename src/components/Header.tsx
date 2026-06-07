import React from "react";
import { useCommandPalette } from "./CommandPalette";
import { Search, Command, Cpu, Clock, ChevronRight } from "lucide-react";
import { client } from "../api/client";
import type { HealthResponse } from "../types";

export const Header: React.FC = () => {
  const { open: openPalette } = useCommandPalette();
  const [timeStr, setTimeStr] = React.useState<string>("");
  const [statusIndex, setStatusIndex] = React.useState<number>(0);
  const [health, setHealth] = React.useState<HealthResponse | null>(null);

  const systemStatuses = [
    "ALL AUDIT MECHANISMS WORK AT OPTIMAL NOMINAL RATES",
    "BUDGET LEVEL-3 VP THRESHOLD CONFIGURED AT: $100,000.00 USD",
    "COMPLIANCE DIRECTIVE SOC-2 ENCRYPTIONS ACTIVELY CHECKED",
    "VENDOR RISK REGISTRY CHECKPOINT: PREFERRED PORTAL CODES SYNCED",
    "AI ORCHESTRATION NODE DETECTED: 5 PIPELINE CORES RUNNING"
  ];

  // Update clock every second
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "UTC"
        }) + " UTC"
      );
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Rotate system status text every 6s
  React.useEffect(() => {
    const statusInterval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % systemStatuses.length);
    }, 6000);
    return () => clearInterval(statusInterval);
  }, [systemStatuses.length]);

  // Health poll for the AI node count
  React.useEffect(() => {
    let cancelled = false;
    const loadHealth = async () => {
      try {
        const h = await client.getHealth();
        if (!cancelled) setHealth(h);
      } catch {
        if (!cancelled) setHealth(null);
      }
    };
    loadHealth();
    const id = setInterval(loadHealth, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const aiNodeLabel = health
    ? `AI ORCHESTRATION NODE DETECTED: ${health.active_agents} PIPELINE CORES RUNNING`
    : systemStatuses[4];

  return (
    <header
      id="global-portal-header"
      className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md flex items-center justify-between px-6 md:px-8 shrink-0 z-30 sticky top-0 transition-colors duration-300"
    >
      {/* Search Input block — opens the command palette */}
      <div className="relative w-full max-w-md">
        <button
          type="button"
          onClick={openPalette}
          className="w-full text-left flex items-center text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg py-2.5 pl-9 pr-12 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <span className="text-slate-400 dark:text-slate-500">Search request ID, vendor, or item...</span>
        </button>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center space-x-0.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-200/50 dark:bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-300/30 dark:border-slate-700/60 pointer-events-none uppercase tracking-wider font-mono">
          <Command className="w-2.5 h-2.5 mr-0.5" />
          <span>K</span>
        </div>
      </div>

      {/* Ticker & Status Panel section */}
      <div className="flex items-center space-x-6">
        {/* Dynamic sliding audit status updates tickers */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 pl-3 pr-4 py-1.5 rounded-lg shadow-inner max-w-sm overflow-hidden select-none">
          <Cpu className="w-3.5 h-3.5 text-indigo-500 shrink-0 animate-pulse" />
          <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
          <div className="overflow-hidden relative w-56 h-4">
            <span
              key={statusIndex}
              className="absolute left-0 top-0 text-[9.5px] font-bold text-slate-500 dark:text-slate-400 tracking-wider font-mono uppercase truncate w-full block animate-[fadeIn_0.3s_ease-out]"
            >
              {statusIndex === 4 ? aiNodeLabel : systemStatuses[statusIndex]}
            </span>
          </div>
        </div>

        {/* Live system state clock with glowing status ring */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 px-2.5 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5 text-indigo-500/80" />
            <span>{timeStr || "00:00:00 UTC"}</span>
          </div>

          {/* Blinking green active indicator dot */}
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
        </div>
      </div>
    </header>
  );
};
