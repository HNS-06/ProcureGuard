import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, LogIn } from "lucide-react";
import { useUser } from "../auth/UserContext";

export const Login: React.FC = () => {
  const { login, user } = useUser();
  const navigate = useNavigate();
  const [name, setName] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // If already logged in, bounce straight to the dashboard
  React.useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Please enter at least 2 characters.");
      return;
    }
    setError("");
    login(trimmed);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            ProcureGuard
          </h1>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mt-1">
            Auto-Audit Node · v1.2.5 [PROD]
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/5 p-7 space-y-5"
        >
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Sign in to continue
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Enter your name to access the procurement audit pipeline. Your display name will be recorded on every submission and human-review decision.
            </p>
          </div>

          <div>
            <label
              htmlFor="login-name"
              className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5"
            >
              Your name
            </label>
            <input
              id="login-name"
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Angeleen Rajiv"
              autoComplete="name"
              className={`w-full text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg px-3.5 py-2.5 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/40 ${
                error
                  ? "border-rose-400 focus:border-rose-500"
                  : "border-slate-200 dark:border-slate-800 focus:border-indigo-500"
              }`}
            />
            {error && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5 font-semibold">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Enter Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed text-center font-mono">
              Sandbox build · No password required for this demo
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
