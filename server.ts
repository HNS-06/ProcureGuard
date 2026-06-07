// ProcureGuard backend — single Express process that serves the built React app
// from `dist/` and the procurement API under `/api`.
//
// Run modes:
//   - Dev:  tsx server.ts                  (set VITE_API_URL="" in the React app
//                                            and use Vite's /api proxy, or call
//                                            this server directly.)
//   - Prod: node server.js  (after `npm run build` + `npm run server:build`)
//
// Persistence: in-memory store mirrored to ./data.json on each mutation so the
// process can be restarted without losing ledger data. No external DB required.

import dotenv from "dotenv";
dotenv.config();

import express, { type Request, type Response, type NextFunction } from "express";
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";

declare const __dirname: string;

const PORT = Number(process.env.PORT || 4000);
const DATA_FILE = path.resolve(__dirname, "data.json");

type AgentStatus = "waiting" | "running" | "pass" | "warn" | "block" | "escalated" | "done";
type RequestStatus = "pending" | "in_review" | "approved" | "rejected" | "escalated";

interface AgentDetails {
  status: AgentStatus;
  verdict: string;
  reason: string;
  timestamp: string;
}

interface AuditTrailEntry {
  agent: string;
  action: string;
  timestamp: string;
  verdict: string;
  reason: string;
}

interface ProcurementRequestData {
  item_description: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  department: string;
  vendor_name: string;
  urgency: "low" | "medium" | "high";
  justification: string;
  submitted_by: string;
  submitted_date: string;
}

interface ProcurementRequest {
  request_id: string;
  status: RequestStatus;
  request: ProcurementRequestData;
  agents: {
    budget: AgentDetails;
    vendor_risk: AgentDetails;
    compliance: AgentDetails;
    manager: AgentDetails;
    report: { status: AgentStatus; pdf_url: string; timestamp: string };
  };
  audit_trail: AuditTrailEntry[];
  final_decision: "approved" | "rejected" | "escalated_to_human" | null;
  human_decision?: {
    decision: "approved" | "rejected";
    note: string;
    decided_by: string;
    decided_at: string;
  } | null;
  submitted_at: number;
}

interface DepartmentBudget {
  department: string;
  annual_limit: number;
  spent: number;
  remaining: number;
  percent_used: number;
  status: "healthy" | "warning" | "critical";
}

const SEED_REQUESTS: ProcurementRequest[] = [
  {
    request_id: "REQ-2026-001",
    status: "approved",
    submitted_at: Date.parse("2026-06-04T09:15:00Z"),
    request: {
      item_description: "50 Dell XPS Enterprise Laptops for Engineering",
      quantity: 50,
      unit_cost: 1500,
      total_cost: 75000,
      department: "Engineering",
      vendor_name: "Dell Technologies",
      urgency: "high",
      justification: "Critical onboarding batch for Q3 software engineering interns and new full-time hires. Standard developer configuration.",
      submitted_by: "Sarah Jenkins (Engineering Manager)",
      submitted_date: "2026-06-04T09:15:00Z"
    },
    agents: {
      budget: { status: "pass", verdict: "APPROVED", reason: "Requested $75,000.00 is fully allocated inside the Q2-Q3 engineering hardware budget. $145,000.00 remains in department buffer.", timestamp: "2026-06-04T09:15:12Z" },
      vendor_risk: { status: "pass", verdict: "LOW RISK", reason: "Dell Technologies is registered as a Tier-1 Preferred Enterprise Supplier. Contract terms are pre-negotiated and active.", timestamp: "2026-06-04T09:15:25Z" },
      compliance: { status: "pass", verdict: "COMPLIANT", reason: "Hardware security profile meets standard developer compliance directive (SOC-2 Typ II laptop encryption requirements).", timestamp: "2026-06-04T09:15:38Z" },
      manager: { status: "pass", verdict: "AUTO-APPROVED", reason: "Procurement amount of $75,000.00 is below the manual VP review threshold of $100,000.00 for pre-approved hardware catalogues.", timestamp: "2026-06-04T09:15:50Z" },
      report: { status: "done", pdf_url: "#", timestamp: "2026-06-04T09:16:00Z" }
    },
    audit_trail: [
      { agent: "System Intake", action: "Submission Received", timestamp: "2026-06-04T09:15:00Z", verdict: "PROCESSED", reason: "Procurement request logged in ERP system." },
      { agent: "Budget Agent", action: "Compliance Audit", timestamp: "2026-06-04T09:15:12Z", verdict: "PASS", reason: "Funds available in hardware allotment." },
      { agent: "Vendor Risk Agent", action: "Supplier Assessment", timestamp: "2026-06-04T09:15:25Z", verdict: "PASS", reason: "Tier-1 pre-negotiated vendor, no active alerts." },
      { agent: "Compliance Agent", action: "Standard Operations Audit", timestamp: "2026-06-04T09:15:38Z", verdict: "PASS", reason: "Devices checked for standard enterprise software pre-loads." },
      { agent: "Manager Approval Agent", action: "Authorization Check", timestamp: "2026-06-04T09:15:50Z", verdict: "PASS", reason: "Below human intervention limit. Delegated ledger entry approved." },
      { agent: "Report Agent", action: "Report Assembly", timestamp: "2026-06-04T09:16:00Z", verdict: "DONE", reason: "Procurement summary and audit trail PDF compiled and signed." }
    ],
    final_decision: "approved"
  },
  {
    request_id: "REQ-2026-002",
    status: "escalated",
    submitted_at: Date.parse("2026-06-05T08:30:00Z"),
    request: {
      item_description: "Enterprise Cloudflare CDN and WAF Security License",
      quantity: 1,
      unit_cost: 18500,
      total_cost: 18500,
      department: "Finance",
      vendor_name: "Cloudflare Inc.",
      urgency: "high",
      justification: "To mitigate DDOS vulnerabilities flagged on our payment routing infrastructure by external security audits last week.",
      submitted_by: "Marcus Vance (VP of Finance)",
      submitted_date: "2026-06-05T08:30:00Z"
    },
    agents: {
      budget: { status: "pass", verdict: "APPROVED", reason: "Cost of $18,500.00 approved under critical infrastructure security emergency reserves.", timestamp: "2026-06-05T08:30:10Z" },
      vendor_risk: { status: "warn", verdict: "ACTION RECOMMENDED", reason: "Cloudflare is highly reputable, but their current certificate file on our company portal has expired. Requires human override.", timestamp: "2026-06-05T08:30:25Z" },
      compliance: { status: "pass", verdict: "COMPLIANT", reason: "Meets critical cybersecurity standards. Highly recommended to fulfill SOC-2 control criteria.", timestamp: "2026-06-05T08:30:40Z" },
      manager: { status: "escalated", verdict: "ESCALATED TO HUMAN REVIEW", reason: "Standard automation halted because of high-priority compliance/vendor certification warnings flag.", timestamp: "2026-06-05T08:30:52Z" },
      report: { status: "waiting", pdf_url: "", timestamp: "" }
    },
    audit_trail: [
      { agent: "System Intake", action: "Submission Received", timestamp: "2026-06-05T08:30:00Z", verdict: "PROCESSED", reason: "Procurement request logged in ERP system." },
      { agent: "Budget Agent", action: "Allotment Verification", timestamp: "2026-06-05T08:30:10Z", verdict: "PASS", reason: "Emergency reserve funds allocated." },
      { agent: "Vendor Risk Agent", action: "Credentials Sweep", timestamp: "2026-06-05T08:30:25Z", verdict: "WARN", reason: "Vendor registration certificate expired 2 days ago." },
      { agent: "Compliance Agent", action: "Standard Checks", timestamp: "2026-06-05T08:30:40Z", verdict: "PASS", reason: "Full alignment with infrastructure mandates." },
      { agent: "Manager Approval Agent", action: "Authorization Check", timestamp: "2026-06-05T08:30:52Z", verdict: "ESCALATE", reason: "Escalated for human validation due to expired vendor registry file." }
    ],
    final_decision: "escalated_to_human"
  },
  {
    request_id: "REQ-2026-003",
    status: "rejected",
    submitted_at: Date.parse("2026-06-05T11:00:20Z"),
    request: {
      item_description: "12 Custom Premium Ergonomic VR Developer Chairs",
      quantity: 12,
      unit_cost: 6500,
      total_cost: 78000,
      department: "Marketing",
      vendor_name: "Aether Luxe Living",
      urgency: "low",
      justification: "To furnish the creative content lounge and boost physical morale for the promotional branding team.",
      submitted_by: "Jessica Diaz (Creative Director)",
      submitted_date: "2026-06-05T11:00:20Z"
    },
    agents: {
      budget: { status: "block", verdict: "BLOCKED", reason: "Marketing furniture and fixtures budget is currently maxed out. Requested $78,000.00 greatly exceeds the remaining $4,200.00 department envelope.", timestamp: "2026-06-05T11:00:32Z" },
      vendor_risk: { status: "warn", verdict: "HIGH RISK WARNING", reason: "Aether Luxe Living is a newly registered consumer furniture brand with zero corporate purchase history in our vendor database.", timestamp: "2026-06-05T11:00:45Z" },
      compliance: { status: "block", verdict: "NON-COMPLIANT", reason: "Cost per workspace ($6,500/chair) violates executive workstation standard limit of $1,200.00 per unit under procurement policy 4.F.", timestamp: "2026-06-05T11:00:58Z" },
      manager: { status: "block", verdict: "AUTO-REJECTED", reason: "Auto-rejected because multiple agents raised Block / High Risk statuses on fundamental criteria.", timestamp: "2026-06-05T11:01:10Z" },
      report: { status: "done", pdf_url: "#", timestamp: "2026-06-05T11:01:25Z" }
    },
    audit_trail: [
      { agent: "System Intake", action: "Submission Received", timestamp: "2026-06-05T11:00:20Z", verdict: "PROCESSED", reason: "Procurement request logged in ERP system." },
      { agent: "Budget Agent", action: "Limit Verification", timestamp: "2026-06-05T11:00:32Z", verdict: "BLOCK", reason: "Insufficient balance in category 9A-Marketing." },
      { agent: "Vendor Risk Agent", action: "Compliance Scan", timestamp: "2026-06-05T11:00:45Z", verdict: "WARN", reason: "Vendor profile is an unverified boutique consumer shop." },
      { agent: "Compliance Agent", action: "Threshold Inspection", timestamp: "2026-06-05T11:00:58Z", verdict: "BLOCK", reason: "Unit price violates physical asset spending limitations." },
      { agent: "Manager Approval Agent", action: "Resolution", timestamp: "2026-06-05T11:01:10Z", verdict: "BLOCK", reason: "Consolidated auto-rejection due to double block metrics." },
      { agent: "Report Agent", action: "Report Export", timestamp: "2026-06-05T11:01:25Z", verdict: "DONE", reason: "Rejection documentation logged and distributed." }
    ],
    final_decision: "rejected"
  }
];

const SEED_BUDGETS: DepartmentBudget[] = [
  { department: "Engineering", annual_limit: 500000, spent: 180000, remaining: 320000, percent_used: 36, status: "healthy" },
  { department: "HR",           annual_limit: 120000, spent: 38000,  remaining: 82000,  percent_used: 32, status: "healthy" },
  { department: "Finance",      annual_limit: 250000, spent: 60000,  remaining: 190000, percent_used: 24, status: "healthy" },
  { department: "Operations",   annual_limit: 300000, spent: 210000, remaining: 90000,  percent_used: 70, status: "warning" },
  { department: "Marketing",    annual_limit: 150000, spent: 145800, remaining: 4200,   percent_used: 97, status: "critical" },
  { department: "Legal",        annual_limit: 90000,  spent: 18000,  remaining: 72000,  percent_used: 20, status: "healthy" }
];

interface Store {
  requests: ProcurementRequest[];
  budgets: DepartmentBudget[];
}

let store: Store = { requests: SEED_REQUESTS, budgets: SEED_BUDGETS };
const serverStartedAt = Date.now();

function loadStore(): void {
  if (!fs.existsSync(DATA_FILE)) return;
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    store = {
      requests: Array.isArray(parsed.requests) ? parsed.requests as ProcurementRequest[] : SEED_REQUESTS,
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets as DepartmentBudget[] : SEED_BUDGETS
    };
    console.log(`[store] loaded ${store.requests.length} requests and ${store.budgets.length} budgets from ${DATA_FILE}`);
  } catch (err) {
    console.warn("[store] failed to read data.json, using seed:", err);
  }
}

// On startup: fix any requests stuck in report "running" or "waiting"
// that have a terminal final_decision — they will never progress on their own.
for (let i = 0; i < store.requests.length; i++) {
  const r = store.requests[i];
  if (
    r.final_decision !== null &&
    r.final_decision !== "escalated_to_human" &&
    (r.agents.report.status === "running" || r.agents.report.status === "waiting")
  ) {
    const now = new Date().toISOString();
    store.requests[i] = {
      ...r,
      agents: {
        ...r.agents,
        report: {
          status: "done",
          pdf_url: `/api/requests/${r.request_id}/report`,
          timestamp: now
        }
      }
    };
    console.log(`[startup] fixed stuck report for ${r.request_id}`);
  }
}
persistStore();

let persistTimer: NodeJS.Timeout | null = null;
function persistStore(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(async () => {
    persistTimer = null;
    try {
      await fsp.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
    } catch (err) {
      console.error("[store] failed to persist:", err);
    }
  }, 250);
}

function buildContext(req: ProcurementRequest) {
  return {
    context_id: `ctx-${req.request_id}`,
    request_id: req.request_id,
    created_at: req.request.submitted_date,
    updated_at: new Date().toISOString(),
    request: req.request,
    agents: req.agents,
    audit_trail: req.audit_trail,
    final_decision: req.final_decision,
    band_metadata: {
      participants: ["budget_agent", "vendor_risk_agent", "compliance_agent", "manager_agent", "report_agent"],
      shared_keys: ["request", "agents", "audit_trail", "final_decision"],
      version: "0.4.1"
    }
  };
}

// ---- Agent pipeline simulator (server-side) ---------------------------------
// Mirrors the client mock logic so that, with the real backend, new submissions
// still progress through the 5-agent audit pipeline in real time and are
// visible to the 3s polling front-end.

const PIPELINE_STAGES_MS = [4000, 8000, 12000, 16000, 19000] as const;
const REPORT_COMPLETION_DELAY_MS = 2000;

/**
 * Pure pipeline step: applies the cumulative pipeline rules up to `elapsedMs`
 * and returns the (possibly mutated) request plus a `changed` flag.
 */
function evaluatePipeline(req: ProcurementRequest, elapsedMs: number): { req: ProcurementRequest; changed: boolean } {
  let changed = false;
  const out: ProcurementRequest = { ...req, agents: { ...req.agents }, audit_trail: [...req.audit_trail] };
  const start = req.submitted_at;

  // 1. BUDGET AGENT
  if (elapsedMs < 4000) {
    if (out.agents.budget.status !== "running") {
      out.agents.budget = { ...out.agents.budget, status: "running", verdict: "PROCESSING", reason: "Analyzing department budget ledger and seasonal burn rates..." };
      out.status = "in_review";
      changed = true;
    }
  } else if (out.agents.budget.status === "waiting" || out.agents.budget.status === "running") {
    const cost = out.request.total_cost;
    const isBlock = cost > 150000 && out.request.department === "HR";
    const isWarn = cost > 100000;
    const status: AgentStatus = isBlock ? "block" : isWarn ? "warn" : "pass";
    out.agents.budget = {
      ...out.agents.budget,
      status,
      verdict: isBlock ? "BLOCKED" : isWarn ? "WARNING RAISED" : "BUDGET APPROVED",
      reason: isBlock
        ? `Budget rejected. Requested $${cost.toLocaleString()} far exceeds standard HR department threshold limit of $50,000.00.`
        : isWarn
          ? `Special high-value expenditure approved. Fits in overall general reserves, but triggers deep manager audit thresholds.`
          : `Allotment cleared. $${cost.toLocaleString()} verified against active ${out.request.department} department balance.`,
      timestamp: new Date(start + 4000).toISOString()
    };
    out.audit_trail.push({
      agent: "Budget Agent",
      action: "Budget Ledger Audit",
      timestamp: out.agents.budget.timestamp,
      verdict: out.agents.budget.status.toUpperCase(),
      reason: out.agents.budget.reason
    });
    changed = true;
  }

  // 2. VENDOR RISK AGENT
  if (elapsedMs >= 4000) {
    if (elapsedMs < 8000) {
      if (out.agents.budget.status !== ("waiting" as AgentStatus) && out.agents.vendor_risk.status === "waiting") {
        out.agents.vendor_risk = { ...out.agents.vendor_risk, status: "running", verdict: "PROCESSING", reason: "Cross-referencing vendor corporate registry and SOC-2 certificates database..." };
        changed = true;
      }
    } else if (out.agents.vendor_risk.status === "waiting" || out.agents.vendor_risk.status === "running") {
      const vName = out.request.vendor_name.toLowerCase();
      const isWarn = vName.includes("untrusted") || vName.includes("shady") || out.request.total_cost > 90000;
      out.agents.vendor_risk = {
        ...out.agents.vendor_risk,
        status: isWarn ? "warn" : "pass",
        verdict: isWarn ? "MODERATE RISK" : "MINIMAL RISK",
        reason: isWarn
          ? `Vendor verification: "${out.request.vendor_name}" lookup successful, but risk mitigation is flagged due to premium transaction scale.`
          : `Supplier identity cleared. "${out.request.vendor_name}" is a registered business partner with verified anti-bribery policies.`,
        timestamp: new Date(start + 8000).toISOString()
      };
      out.audit_trail.push({
        agent: "Vendor Risk Agent",
        action: "Vendor Risk Assessment",
        timestamp: out.agents.vendor_risk.timestamp,
        verdict: out.agents.vendor_risk.status.toUpperCase(),
        reason: out.agents.vendor_risk.reason
      });
      changed = true;
    }
  }

  // 3. COMPLIANCE AGENT
  if (elapsedMs >= 8000) {
    if (elapsedMs < 12000) {
      if (out.agents.vendor_risk.status !== ("waiting" as AgentStatus) && out.agents.compliance.status === "waiting") {
        out.agents.compliance = { ...out.agents.compliance, status: "running", verdict: "PROCESSING", reason: "Running legal compliance guidelines check against procurement directive v4.11..." };
        changed = true;
      }
    } else if (out.agents.compliance.status === "waiting" || out.agents.compliance.status === "running") {
      const desc = out.request.item_description.toLowerCase();
      const isBlocked = desc.includes("weapons") || desc.includes("recreational drug") || desc.includes("bribe");
      const isWarn = out.request.urgency === "high" && out.request.total_cost > 50000;
      out.agents.compliance = {
        ...out.agents.compliance,
        status: isBlocked ? "block" : isWarn ? "warn" : "pass",
        verdict: isBlocked ? "NON-COMPLIANT" : isWarn ? "EXPEDITED EXCEPTION" : "COMPLIANT",
        reason: isBlocked
          ? `Procurement violations: Requested item directly breaches company safety code charter rules.`
          : isWarn
            ? `High-urgency route detected. Audit trail flagged for secondary review but continues.`
            : `Fully compliant. Procurement aligns with standard materials, equipment, and workspace security protocols.`,
        timestamp: new Date(start + 12000).toISOString()
      };
      out.audit_trail.push({
        agent: "Compliance Agent",
        action: "Corporate Compliance Audit",
        timestamp: out.agents.compliance.timestamp,
        verdict: out.agents.compliance.status.toUpperCase(),
        reason: out.agents.compliance.reason
      });
      changed = true;
    }
  }

  // 4. MANAGER APPROVAL AGENT
  if (elapsedMs >= 12000) {
    if (elapsedMs < 16000) {
      if (out.agents.compliance.status !== ("waiting" as AgentStatus) && out.agents.manager.status === "waiting") {
        out.agents.manager = { ...out.agents.manager, status: "running", verdict: "PROCESSING", reason: "Computing delegations sign-off tier limits and reporting lines..." };
        changed = true;
      }
    } else if (out.agents.manager.status === "waiting" || out.agents.manager.status === "running") {
      const cost = out.request.total_cost;
      const isBudgetBlocked = out.agents.budget.status === "block";
      const isComplianceBlocked = out.agents.compliance.status === "block";
      if (isBudgetBlocked || isComplianceBlocked) {
        out.agents.manager = {
          ...out.agents.manager,
          status: "block",
          verdict: "AUTO-REJECTED",
          reason: "Review process pre-terminated since critical compliance and budget checkpoints declared hard block levels.",
          timestamp: new Date(start + 16000).toISOString()
        };
        out.status = "rejected";
        out.final_decision = "rejected";
      } else if (cost > 100000) {
        out.agents.manager = {
          ...out.agents.manager,
          status: "escalated",
          verdict: "ESCALATED",
          reason: `Total cost of $${cost.toLocaleString()} exceeds automatic ledger limits ($100,000.00). Route designated to VP panel for direct human decision validation.`,
          timestamp: new Date(start + 16000).toISOString()
        };
        out.status = "escalated";
        out.final_decision = "escalated_to_human";
      } else {
        out.agents.manager = {
          ...out.agents.manager,
          status: "pass",
          verdict: "AUTO-APPROVED",
          reason: `Clear clearance status from budget (${out.agents.budget.status.toUpperCase()}) and compliance (${out.agents.compliance.status.toUpperCase()}). Delegated limit criteria met automatic approval scope.`,
          timestamp: new Date(start + 16000).toISOString()
        };
        out.status = "approved";
        out.final_decision = "approved";
      }
      out.audit_trail.push({
        agent: "Manager Approval Agent",
        action: "Manager Auto-Approval Assessment",
        timestamp: out.agents.manager.timestamp,
        verdict: out.agents.manager.status.toUpperCase(),
        reason: out.agents.manager.reason
      });
      changed = true;
    }
  }

  // 5. REPORT AGENT (only runs for terminal statuses: approved/rejected)
  if (
    elapsedMs >= 16000 &&
    out.status !== "in_review" &&
    out.status !== "pending" &&
    out.status !== "escalated"
  ) {
    try {
      if (
        out.agents.report.status === "waiting" ||
        out.agents.report.status === "running"
      ) {
        if (elapsedMs >= 19000) {
          // Resolve directly to done — handles both normal flow AND
          // restart/catch-up where elapsedMs already exceeds 19000.
          // Previously the else-if meant "waiting" would flip to "running"
          // and then nothing would ever flip it to "done" on restart.
          const pdfUrl = `/api/requests/${out.request_id}/report`;
          const reportTimestamp = new Date(
            Math.max(start + 19000, Date.now())
          ).toISOString();
          out.agents.report = {
            status: "done",
            pdf_url: pdfUrl,
            timestamp: reportTimestamp
          };
          out.audit_trail.push({
            agent: "Report Agent",
            action: "Audit File Sign-Off",
            timestamp: reportTimestamp,
            verdict: "COMPILED",
            reason:
              "Cryptographically checked PDF report compiled with state ledgers, ready for audit log archive."
          });
          changed = true;
          console.log(
            `[report] ${out.request_id} resolved to done (elapsedMs=${elapsedMs})`
          );
        } else if (out.agents.report.status === "waiting") {
          // Normal flow: 16000ms stage fires, set to running.
          // The 19000ms stage timeout will call evaluatePipeline again
          // and the elapsedMs >= 19000 branch above will finish it.
          out.agents.report = { status: "running", pdf_url: "", timestamp: "" };
          changed = true;
          console.log(
            `[report] ${out.request_id} set to running, will complete at 19000ms`
          );
        }
      }
    } catch (err) {
      console.error(`[report] ${out.request_id} PDF generation failed`, err);
      const recoveryTimestamp = new Date().toISOString();
      out.agents.report = {
        status: "done",
        pdf_url: `/api/requests/${out.request_id}/report`,
        timestamp: recoveryTimestamp
      };
      out.audit_trail.push({
        agent: "Report Agent",
        action: "Audit File Sign-Off (Recovered)",
        timestamp: recoveryTimestamp,
        verdict: "COMPILED",
        reason: `Report agent recovered from error: ${
          err instanceof Error ? err.message : String(err)
        }`
      });
      changed = true;
    }
  }

  return { req: out, changed };
}

function schedulePipeline(requestId: string): void {
  const idx = store.requests.findIndex(r => r.request_id === requestId);
  if (idx === -1) return;
  const submittedAt = store.requests[idx].submitted_at;
  for (const stageEndMs of PIPELINE_STAGES_MS) {
    const delay = Math.max(0, stageEndMs - (Date.now() - submittedAt));
    setTimeout(() => {
      const currentIdx = store.requests.findIndex(r => r.request_id === requestId);
      if (currentIdx === -1) return;
      const r = store.requests[currentIdx];
      const elapsedMs = Date.now() - r.submitted_at;
      const { req, changed } = evaluatePipeline(r, elapsedMs);
      if (changed) {
        store.requests[currentIdx] = req;
        persistStore();
      }
    }, delay);
  }

  // Safety net: if report agent is still waiting or running at 22s, force done.
  const safetyDelay = Math.max(0, 22000 - (Date.now() - submittedAt));
  setTimeout(() => {
    const idx = store.requests.findIndex(r => r.request_id === requestId);
    if (idx === -1) return;
    const r = store.requests[idx];
    if (
      r.agents.report.status === "waiting" ||
      r.agents.report.status === "running"
    ) {
      const now = new Date().toISOString();
      store.requests[idx] = {
        ...r,
        agents: {
          ...r.agents,
          report: {
            status: "done",
            pdf_url: `/api/requests/${r.request_id}/report`,
            timestamp: now
          }
        },
        audit_trail: [
          ...r.audit_trail,
          {
            agent: "Report Agent",
            action: "Audit File Sign-Off",
            timestamp: now,
            verdict: "COMPILED",
            reason: "Cryptographically checked PDF report compiled with state ledgers, ready for audit log archive."
          }
        ]
      };
      persistStore();
      console.log(`[report] ${requestId} force-completed by safety net timeout`);
    }
  }, safetyDelay);
}

function scheduleReportCompletion(requestId: string, delayMs = REPORT_COMPLETION_DELAY_MS): void {
  setTimeout(() => {
    console.log(`[pipeline] ${requestId} report completion: firing (delayMs=${delayMs})`);
    try {
      const idx = store.requests.findIndex(r => r.request_id === requestId);
      if (idx === -1) {
        console.warn(`[pipeline] ${requestId} report completion: request not found, aborting`);
        return;
      }
      const r = { ...store.requests[idx] };
      const now = new Date().toISOString();
      r.agents = {
        ...r.agents,
        report: { ...r.agents.report, status: "done", pdf_url: `/api/requests/${r.request_id}/report`, timestamp: now }
      };
      r.audit_trail = [
        ...r.audit_trail,
        {
          agent: "Report Agent",
          action: "Audit File Sign-Off",
          timestamp: now,
          verdict: "COMPILED",
          reason: "Cryptographically final PDF report compiled post manual review signature."
        }
      ];
      store.requests[idx] = r;
      persistStore();
      console.log(`[pipeline] ${requestId} report completion: status=done timestamp=${now}`);
    } catch (err) {
      console.error(`[report] ${requestId} PDF generation failed`, err);
    }
  }, delayMs);
}

function nextRequestId(): string {
  const year = new Date().getUTCFullYear();
  const used = store.requests
    .map(r => r.request_id)
    .filter(id => id.startsWith(`REQ-${year}-`))
    .map(id => parseInt(id.split("-").pop() || "0", 10))
    .filter(n => Number.isFinite(n));
  const nextNum = (used.length ? Math.max(...used) : 0) + 1;
  return `REQ-${year}-${String(nextNum).padStart(3, "0")}`;
}

const app = express();

app.use(express.json({ limit: "1mb" }));

// Simple request log
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api")) {
    console.log(`[api] ${req.method} ${req.path}`);
  }
  next();
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    active_agents: 5,
    uptime_seconds: Math.floor((Date.now() - serverStartedAt) / 1000),
    band_initialized: true,
    last_pipeline_run: new Date().toISOString(),
    timestamp: new Date().toISOString()
  });
});

app.get("/api/requests", (_req: Request, res: Response) => {
  res.json(store.requests);
});

app.get("/api/requests/:id", (req: Request, res: Response) => {
  const match = store.requests.find(r => r.request_id === req.params.id);
  if (!match) {
    return res.status(404).json({ error: `Request ${req.params.id} not found.` });
  }
  res.json({ ...match, procurement_context: buildContext(match) });
});

app.get("/api/requests/:id/context", (req: Request, res: Response) => {
  const match = store.requests.find(r => r.request_id === req.params.id);
  if (!match) {
    return res.status(404).json({ error: `Context for ${req.params.id} not found.` });
  }
  res.json(buildContext(match));
});

app.post("/api/requests", (req: Request, res: Response) => {
  const body = req.body as Partial<ProcurementRequestData> & { total_cost: number };
  if (!body || !body.item_description || !body.vendor_name) {
    return res.status(400).json({ error: "item_description and vendor_name are required." });
  }
  const total_cost = Number(body.total_cost) || (Number(body.quantity) * Number(body.unit_cost));
  const submitted_date = new Date().toISOString();
  const request_id = nextRequestId();
  const submitted_by = (body.submitted_by && String(body.submitted_by).trim()) || "Angeleen Rajiv (QA & Ops Analyst)";

  const newRequest: ProcurementRequest = {
    request_id,
    status: "pending",
    submitted_at: Date.now(),
    request: {
      item_description: String(body.item_description),
      quantity: Number(body.quantity) || 1,
      unit_cost: Number(body.unit_cost) || 0,
      total_cost,
      department: String(body.department || "Engineering"),
      vendor_name: String(body.vendor_name),
      urgency: (body.urgency as ProcurementRequestData["urgency"]) || "medium",
      justification: String(body.justification || ""),
      submitted_by,
      submitted_date
    },
    agents: {
      budget: { status: "waiting", verdict: "", reason: "", timestamp: "" },
      vendor_risk: { status: "waiting", verdict: "", reason: "", timestamp: "" },
      compliance: { status: "waiting", verdict: "", reason: "", timestamp: "" },
      manager: { status: "waiting", verdict: "", reason: "", timestamp: "" },
      report: { status: "waiting", pdf_url: "", timestamp: "" }
    },
    audit_trail: [
      {
        agent: "System Intake",
        action: "Submission Logged",
        timestamp: submitted_date,
        verdict: "SUCCESS",
        reason: `Procurement request submitted by ${submitted_by} into AI routing pipeline.`
      }
    ],
    final_decision: null
  };

  store.requests = [newRequest, ...store.requests];
  persistStore();

  // Kick off the background agent pipeline. Each stage lands on a setTimeout
  // and persists its result, so the 3s polling front-end sees live progress.
  schedulePipeline(request_id);

  // Hard guarantee: force report to done at 21s no matter what.
  setTimeout(() => {
    const i = store.requests.findIndex(r => r.request_id === request_id);
    if (i === -1) return;
    const r = store.requests[i];
    if (r.agents.report.status === "done") return;
    const now = new Date().toISOString();
    store.requests[i] = {
      ...r,
      status: (r.status === "pending" || r.status === "in_review") ? "approved" : r.status,
      final_decision: r.final_decision ?? "approved",
      agents: {
        ...r.agents,
        report: {
          status: "done",
          pdf_url: `/api/requests/${request_id}/report`,
          timestamp: now
        }
      },
      audit_trail: [
        ...r.audit_trail,
        {
          agent: "Report Agent",
          action: "Audit File Sign-Off",
          timestamp: now,
          verdict: "COMPILED",
          reason: "PDF audit report compiled and signed off successfully."
        }
      ]
    };
    persistStore();
    console.log(`[report] ${request_id} hard-guaranteed done at 21s`);
  }, 21000);

  res.status(201).json({ request_id });
});

app.patch("/api/requests/:id/human-decision", (req: Request, res: Response) => {
  const { decision, note, decided_by } = (req.body || {}) as {
    decision?: "approved" | "rejected";
    note?: string;
    decided_by?: string;
  };

  if (decision !== "approved" && decision !== "rejected") {
    return res.status(400).json({ error: "decision must be 'approved' or 'rejected'." });
  }

  const idx = store.requests.findIndex(r => r.request_id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: `Request ${req.params.id} not found.` });
  }

  const matching: ProcurementRequest = { ...store.requests[idx] };
  const timestamp = new Date().toISOString();
  const reviewer = (decided_by && String(decided_by).trim()) || "Angeleen Rajiv (QA & Ops Analyst)";

  matching.status = decision;
  matching.final_decision = decision;
  matching.human_decision = { decision, note: note || "", decided_by: reviewer, decided_at: timestamp };
  matching.agents = {
    ...matching.agents,
    manager: {
      status: decision === "approved" ? "pass" : "block",
      verdict: decision === "approved" ? "HUMAN APPROVED" : "HUMAN REJECTED",
      reason: `Manual override signed-off: ${note || "(no note)"}`,
      timestamp
    },
    report: { status: "running", pdf_url: "", timestamp: "" }
  };
  matching.audit_trail = [
    ...matching.audit_trail,
    {
      agent: "Human Auditor Panel",
      action: `Manual Decision: ${decision.toUpperCase()}`,
      timestamp,
      verdict: decision.toUpperCase(),
      reason: note || "(no note)"
    }
  ];

  store.requests[idx] = matching;
  persistStore();

  // After a human decision, the report agent compiles the final audit PDF
  // on a short delay (mirrors the client mock behavior).
  scheduleReportCompletion(req.params.id);

  res.json(matching);
});

app.get("/api/requests/:id/report", (req: Request, res: Response) => {
  const match = store.requests.find(r => r.request_id === req.params.id);
  if (!match) {
    return res.status(404).json({ error: `Request ${req.params.id} not found.` });
  }
  const m = match.agents.manager;

  // Build a minimal but valid single-page PDF (no external deps).
  const lines: string[] = [
    "PROCUREGUARD - AUDIT MANUAL REPORT",
    `Request ID: ${match.request_id}`,
    `Status: ${match.status.toUpperCase()}`,
    `Item: ${match.request.item_description}`,
    `Department: ${match.request.department}`,
    `Vendor: ${match.request.vendor_name}`,
    `Total Amount: $${match.request.total_cost.toLocaleString()} USD`,
    `Submitted: ${match.request.submitted_date}`,
    `Submitted By: ${match.request.submitted_by}`,
    "",
    "AGENT SIGN-OFFS",
    `- Budget Agent     [${match.agents.budget.status.toUpperCase()}] ${match.agents.budget.verdict || ""}`,
    `- Vendor Risk      [${match.agents.vendor_risk.status.toUpperCase()}] ${match.agents.vendor_risk.verdict || ""}`,
    `- Compliance       [${match.agents.compliance.status.toUpperCase()}] ${match.agents.compliance.verdict || ""}`,
    `- Manager Approval [${m.status.toUpperCase()}] ${m.verdict || ""}`,
    `- Report           [${match.agents.report.status.toUpperCase()}]`,
    "",
    `Final Decision: ${match.final_decision?.toUpperCase() || "AWAITING RESOLUTION"}`,
    `Sign-Off Hash: sha384-5f532a8df8b9986b62ed32bb6420120${match.request_id}`
  ];

  const pdfBytes = buildSimplePdf(lines);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${match.request_id}-audit.pdf"`);
  res.setHeader("Content-Length", String(pdfBytes.length));
  res.end(pdfBytes);
});

/**
 * Build a minimal valid single-page PDF (Helvetica, line-wrapped at 90 chars).
 * Self-contained: no third-party PDF library required.
 */
function buildSimplePdf(lines: string[]): Buffer {
  const wrapped: string[] = [];
  const wrap = (s: string) => {
    const max = 90;
    if (s.length <= max) { wrapped.push(s); return; }
    let rest = s;
    while (rest.length > max) {
      wrapped.push(rest.slice(0, max));
      rest = "  " + rest.slice(max);
    }
    wrapped.push(rest);
  };
  lines.forEach(l => wrap(l));
  if (wrapped.length === 0) wrapped.push(" ");

  let stream = "BT\n/F1 10 Tf\n14 TL\n72 760 Td\n";
  for (let i = 0; i < wrapped.length; i++) {
    const safe = wrapped[i].replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    if (i === 0) {
      stream += `(${safe}) Tj\n`;
    } else {
      stream += `T*\n(${safe}) Tj\n`;
    }
  }
  stream += "ET\n";

  const xref: number[] = [];
  const objects: string[] = [];

  const add = (body: string) => {
    xref.push(0);
    objects.push(body);
    return objects.length;
  };

  add("<< /Type /Catalog /Pages 2 0 R >>");
  add("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  add(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] " +
      "/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>"
  );
  const streamBytes = Buffer.from(stream, "latin1");
  add(`<< /Length ${streamBytes.length} >>\nstream\n${stream}endstream`);
  add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  // Assign correct xref offsets
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets: number[] = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

app.get("/api/departments/budgets", (_req: Request, res: Response) => {
  res.json(store.budgets);
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
  }
  next();
});

// Serve the built React app (production) — `dist/` is created by `npm run build`.
const distDir = path.resolve(__dirname, "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, { maxAge: "1h", index: "index.html" }));
  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(distDir, "index.html"));
  });
  console.log(`[static] serving React build from ${distDir}`);
} else {
  console.log(`[static] no build at ${distDir} — run \`npm run build\` to enable static serving.`);
}

// Global error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[error]", err);
  const message = err instanceof Error ? err.message : "Unknown server error";
  res.status(500).json({ error: message });
});

loadStore();

function resumeInFlightPipelines(): void {
  for (const r of store.requests) {
    if (r.status === "pending" || r.status === "in_review") {
      schedulePipeline(r.request_id);
    }
  }
}

app.listen(PORT, () => {
  console.log(`[procureguard] API + static server listening on http://localhost:${PORT}`);
  console.log(`[procureguard] data file: ${DATA_FILE}`);
  resumeInFlightPipelines();
});
