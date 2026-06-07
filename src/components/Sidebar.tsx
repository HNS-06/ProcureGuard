import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileSpreadsheet,
  PlusCircle,
  ShieldCheck,
  Moon,
  Sun,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut
} from "lucide-react";
import { usePolling } from "../hooks/usePolling";
import { client } from "../api/client";
import type { HealthResponse } from "../types";
import { useUser, getInitials } from "../auth/UserContext";

interface SidebarProps {
  id?: string;
}

const STORAGE_KEY = "sidebar_collapsed";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/submit", label: "New Request", icon: PlusCircle },
  { to: "/requests", label: "All Requests", icon: FileSpreadsheet }
];

export const Sidebar: React.FC<SidebarProps> = ({ id }) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  const handleSignOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  React.useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  // Health poll every 30s for the system status indicator
  const { data: health } = usePolling<HealthResponse>(() => client.getHealth(), 30000);

  const isOnline = health?.status === "ok";

  return (
    <aside
      id={id || "app-sidebar"}
      className="border-r border-slate-800 bg-slate-900 dark:bg-slate-950 text-white flex flex-col h-screen sticky top-0 shrink-0 transition-[width] duration-200 ease-in-out"
      style={{ width: collapsed ? 56 : 260 }}
    >
      {/* Brand area + collapse toggle */}
      <div
        className={`border-b border-slate-800 flex items-center ${
          collapsed ? "justify-center px-2 py-5" : "justify-between p-6"
        }`}
      >
        {!collapsed && (
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">
                ProcureGuard
              </h1>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                Auto-Audit Node
              </span>
            </div>
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-md border border-slate-800 transition-colors cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation list */}
      <nav className={`flex-1 overflow-y-auto ${collapsed ? "px-2 py-4" : "p-4"}`}>
        {!collapsed && (
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">
            Control Panel
          </div>
        )}
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center ${
                      collapsed ? "justify-center px-2 py-2.5" : "space-x-3 px-3 py-2"
                    } rounded-md text-sm font-semibold transition-colors duration-150 ${
                      isActive
                        ? "text-white bg-[rgba(59,130,246,0.1)] border-l-2 border-[#3b82f6] -ml-[2px]"
                        : "text-[#6b7280] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#9ca3af] border-l-2 border-transparent"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Area */}
      <div className={`border-t border-slate-800 bg-slate-900/50 ${collapsed ? "p-2" : "p-4"} space-y-3`}>
        {/* System status indicator */}
        <div
          className={`flex items-center ${collapsed ? "justify-center" : "space-x-2"}`}
          title={isOnline ? "All agents online" : "Agent error"}
        >
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              isOnline ? "bg-emerald-500" : "bg-rose-500"
            }`}
          >
            {isOnline && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            )}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className={`text-[10px] font-bold tracking-wider uppercase ${isOnline ? "text-emerald-400" : "text-rose-400"}`}>
                {isOnline ? "All agents online" : "Agent error"}
              </p>
              {health && (
                <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                  {health.active_agents} active cores
                </p>
              )}
            </div>
          )}
        </div>

        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          <button
            onClick={toggleDarkMode}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle visual theme"
            title="Toggle visual theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {!collapsed && (
            <span className="text-[10px] text-slate-500 font-mono">v1.2.5 [PROD]</span>
          )}
        </div>

        {/* User profile section */}
        <div
          className={`flex items-center ${collapsed ? "justify-center" : "space-x-3"}`}
          title={collapsed ? `${user?.name ?? "Signed out"} · Authorized User` : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-indigo-200 text-indigo-900 flex items-center justify-center text-xs font-bold shrink-0">
            {user ? getInitials(user.name) : "?"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-none">
                {user?.name ?? "Signed out"}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-tight truncate mt-1">
                Authorized User
              </p>
            </div>
          )}
          {!collapsed && user && (
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-md border border-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
