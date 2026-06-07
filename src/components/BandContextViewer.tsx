import React from "react";
import { ChevronDown, ChevronUp, Copy, Check, Code2 } from "lucide-react";

interface BandContextViewerProps {
  data: unknown;
  isLive?: boolean;
  defaultExpanded?: boolean;
}

const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const tokenize = (json: string): string => {
  // Escape, then highlight keys, strings, numbers, booleans, null
  const escaped = escapeHtml(json);
  return escaped.replace(
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "json-key" : "json-string";
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
};

const formatJson = (data: unknown): string => {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

export const BandContextViewer: React.FC<BandContextViewerProps> = ({
  data,
  isLive = true,
  defaultExpanded = false
}) => {
  const [expanded, setExpanded] = React.useState<boolean>(defaultExpanded);
  const [copied, setCopied] = React.useState<boolean>(false);
  const [flash, setFlash] = React.useState<boolean>(false);
  const prevDataRef = React.useRef<string>("");

  const jsonString = React.useMemo(() => formatJson(data), [data]);
  const highlighted = React.useMemo(() => tokenize(jsonString), [jsonString]);

  // Subtle highlight flash whenever the JSON changes (live poll)
  React.useEffect(() => {
    if (prevDataRef.current && prevDataRef.current !== jsonString) {
      setFlash(true);
      const id = window.setTimeout(() => setFlash(false), 700);
      return () => window.clearTimeout(id);
    }
    prevDataRef.current = jsonString;
    return undefined;
  }, [jsonString]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      id="band-context-viewer"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm"
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer border-b border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Band shared context
          </h4>
          {isLive && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 border border-purple-200/60 dark:border-purple-500/30 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 live-dot" />
              LIVE
            </span>
          )}
          {flash && (
            <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-wider">
              · updated
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            ProcurementContext
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="relative">
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-slate-800/70 hover:bg-slate-700/80 text-slate-200 border border-slate-700 cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
          <pre
            className="bg-[#0d1117] text-[13px] leading-relaxed font-mono text-slate-200 p-5 pt-12 overflow-x-auto max-h-[520px] overflow-y-auto"
            style={{ fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace' }}
          >
            <code
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      )}
    </div>
  );
};
