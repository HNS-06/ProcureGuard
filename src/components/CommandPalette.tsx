import React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft, ArrowUp, ArrowDown, FileSpreadsheet, Terminal } from "lucide-react";
import { client } from "../api/client";
import { StatusBadge } from "./StatusBadge";
import type { ProcurementRequest } from "../types";
import { formatCurrency } from "../utils/formatters";

interface CommandPaletteContextValue {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export const useCommandPalette = () => {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    return {
      open: () => {},
      close: () => {},
      toggle: () => {},
      isOpen: false
    };
  }
  return ctx;
};

const highlightMatch = (text: string, query: string) => {
  if (!query.trim()) return text;
  const escaped = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        className="bg-indigo-500/30 text-indigo-200 px-0.5 rounded font-bold"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
};

export const CommandPaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<ProcurementRequest[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const allRequestsRef = useRef<ProcurementRequest[]>([]);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  // Load all requests when the palette opens so the result set is full
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    client
      .getRequests()
      .then(list => {
        if (cancelled) return;
        allRequestsRef.current = list;
        setResults(list.slice(0, 8));
      })
      .catch(() => {
        if (cancelled) return;
        allRequestsRef.current = [];
        setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  // Filter results as user types
  useEffect(() => {
    const list = allRequestsRef.current;
    if (!query.trim()) {
      setResults(list.slice(0, 8));
      setActiveIndex(0);
      return;
    }
    const lower = query.toLowerCase();
    const filtered = list.filter(r => {
      return (
        r.request_id.toLowerCase().includes(lower) ||
        r.request.item_description.toLowerCase().includes(lower) ||
        r.request.vendor_name.toLowerCase().includes(lower) ||
        r.request.department.toLowerCase().includes(lower)
      );
    });
    setResults(filtered.slice(0, 8));
    setActiveIndex(0);
  }, [query]);

  // Global keyboard shortcut: ⌘K / Ctrl+K
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggle]);

  // Handle keyboard navigation inside the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (results.length === 0 ? 0 : (prev + 1) % results.length));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (results.length === 0 ? 0 : (prev - 1 + results.length) % results.length));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) {
        navigate(`/requests/${target.request_id}`);
        close();
      }
    }
  };

  const ctxValue = useMemo<CommandPaletteContextValue>(
    () => ({ open, close, toggle, isOpen }),
    [open, close, toggle, isOpen]
  );

  return (
    <CommandPaletteContext.Provider value={ctxValue}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-start justify-center pt-[14vh] px-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-[560px] bg-[#161b22] border border-slate-700 rounded-xl shadow-2xl overflow-hidden toast-in"
            onClick={e => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center px-4 py-3 border-b border-slate-700/70">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search request ID, vendor, department or item..."
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none px-3"
                autoComplete="off"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {loading && (
                <div className="px-4 py-8 text-center text-xs text-slate-400">Loading requests...</div>
              )}
              {!loading && results.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <Terminal className="w-5 h-5 mx-auto mb-2 text-slate-500" />
                  <p className="text-xs text-slate-300 font-semibold">No matching requests</p>
                  <p className="text-[10px] text-slate-500 mt-1">Try a different keyword.</p>
                </div>
              )}
              {!loading && results.length > 0 && (
                <ul className="divide-y divide-slate-800">
                  {results.map((req, idx) => (
                    <li
                      key={req.request_id}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => {
                        navigate(`/requests/${req.request_id}`);
                        close();
                      }}
                      className={`px-4 py-3 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                        idx === activeIndex
                          ? "bg-indigo-500/10 border-l-2 border-indigo-500"
                          : "border-l-2 border-transparent hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-400 text-[10.5px]">
                            {highlightMatch(req.request_id, query)}
                          </span>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {highlightMatch(req.request.department, query)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-100 truncate mt-1">
                          {highlightMatch(req.request.item_description, query)}
                        </p>
                        <div className="flex items-center mt-1 text-[10px] text-slate-400 gap-1.5">
                          <span>Vendor:</span>
                          <span className="font-medium text-slate-300 truncate">
                            {highlightMatch(req.request.vendor_name, query)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="font-mono font-extrabold text-slate-100 text-xs">
                          {formatCurrency(req.request.total_cost)}
                        </span>
                        <StatusBadge status={req.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-slate-700/70 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  <ArrowDown className="w-3 h-3" />
                  navigate
                </span>
                <span className="inline-flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3" />
                  open
                </span>
                <span>ESC close</span>
              </div>
              <span className="inline-flex items-center gap-1">
                <FileSpreadsheet className="w-3 h-3" />
                <span>{results.length} results</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </CommandPaletteContext.Provider>
  );
};
