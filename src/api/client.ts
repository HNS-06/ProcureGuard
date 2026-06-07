import {
  ProcurementRequest,
  ProcurementRequestData,
  ProcurementContext,
  StatMetrics,
  DepartmentBudget,
  HealthResponse
} from "../types";

function getCurrentUserLabel(): string {
  if (typeof window === "undefined") return "Angeleen Rajiv (QA & Ops Analyst)";
  try {
    const raw = window.localStorage.getItem("procureguard_user");
    if (raw) {
      const parsed = JSON.parse(raw) as { name?: string };
      if (parsed && typeof parsed.name === "string" && parsed.name.trim().length > 0) {
        return `${parsed.name.trim()} (Authorized User)`;
      }
    }
  } catch {
    /* fall through */
  }
  return "Angeleen Rajiv (QA & Ops Analyst)";
}

// Base API URL from environment variable
const BASE_URL = (import.meta as any).env?.VITE_API_URL || "";

// Check if we should fall back to mock client (if VITE_API_URL is missing or empty)
const useMock = false;

// Initial high-fidelity seed data for the enterprise mock system
const MOCK_SEED_REQUESTS: ProcurementRequest[] = [
  {
    request_id: "REQ-2026-001",
    status: "approved",
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
      budget: {
        status: "pass",
        verdict: "APPROVED",
        reason: "Requested $75,000.00 is fully allocated inside the Q2-Q3 engineering hardware budget. $145,000.00 remains in department buffer.",
        timestamp: "2026-06-04T09:15:12Z"
      },
      vendor_risk: {
        status: "pass",
        verdict: "LOW RISK",
        reason: "Dell Technologies is registered as a Tier-1 Preferred Enterprise Supplier. Contract terms are pre-negotiated and active.",
        timestamp: "2026-06-04T09:15:25Z"
      },
      compliance: {
        status: "pass",
        verdict: "COMPLIANT",
        reason: "Hardware security profile meets standard developer compliance directive (SOC-2 Typ II laptop encryption requirements).",
        timestamp: "2026-06-04T09:15:38Z"
      },
      manager: {
        status: "pass",
        verdict: "AUTO-APPROVED",
        reason: "Procurement amount of $75,000.00 is below the manual VP review threshold of $100,000.00 for pre-approved hardware catalogues.",
        timestamp: "2026-06-04T09:15:50Z"
      },
      report: {
        status: "done",
        pdf_url: "#",
        timestamp: "2026-06-04T09:16:00Z"
      }
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
      budget: {
        status: "pass",
        verdict: "APPROVED",
        reason: "Cost of $18,500.00 approved under critical infrastructure security emergency reserves.",
        timestamp: "2026-06-05T08:30:10Z"
      },
      vendor_risk: {
        status: "warn",
        verdict: "ACTION RECOMMENDED",
        reason: "Cloudflare is highly reputable, but their current certificate file on our company portal has expired. Requires human override.",
        timestamp: "2026-06-05T08:30:25Z"
      },
      compliance: {
        status: "pass",
        verdict: "COMPLIANT",
        reason: "Meets critical cybersecurity standards. Highly recommended to fulfill SOC-2 control criteria.",
        timestamp: "2026-06-05T08:30:40Z"
      },
      manager: {
        status: "escalated",
        verdict: "ESCALATED TO HUMAN REVIEW",
        reason: "Standard automation halted because of high-priority compliance/vendor certification warnings flag.",
        timestamp: "2026-06-05T08:30:52Z"
      },
      report: {
        status: "waiting",
        pdf_url: "",
        timestamp: ""
      }
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
      budget: {
        status: "block",
        verdict: "BLOCKED",
        reason: "Marketing furniture and fixtures budget is currently maxed out. Requested $78,000.00 greatly exceeds the remaining $4,200.00 department envelope.",
        timestamp: "2026-06-05T11:00:32Z"
      },
      vendor_risk: {
        status: "warn",
        verdict: "HIGH RISK WARNING",
        reason: "Aether Luxe Living is a newly registered consumer furniture brand with zero corporate purchase history in our vendor database.",
        timestamp: "2026-06-05T11:00:45Z"
      },
      compliance: {
        status: "block",
        verdict: "NON-COMPLIANT",
        reason: "Cost per workspace ($6,500/chair) violates executive workstation standard limit of $1,200.00 per unit under procurement policy 4.F.",
        timestamp: "2026-06-05T11:00:58Z"
      },
      manager: {
        status: "block",
        verdict: "AUTO-REJECTED",
        reason: "Auto-rejected because multiple agents raised Block / High Risk statuses on fundamental criteria.",
        timestamp: "2026-06-05T11:01:10Z"
      },
      report: {
        status: "done",
        pdf_url: "#",
        timestamp: "2026-06-05T11:01:25Z"
      }
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

// Initial department budget state used for both chart and form dropdown
const MOCK_DEPT_BUDGETS: DepartmentBudget[] = [
  { department: "Engineering", annual_limit: 500000, spent: 180000, remaining: 320000, percent_used: 36, status: "healthy" },
  { department: "HR",           annual_limit: 120000, spent: 38000,  remaining: 82000,  percent_used: 32, status: "healthy" },
  { department: "Finance",      annual_limit: 250000, spent: 60000,  remaining: 190000, percent_used: 24, status: "healthy" },
  { department: "Operations",   annual_limit: 300000, spent: 210000, remaining: 90000,  percent_used: 70, status: "warning" },
  { department: "Marketing",    annual_limit: 150000, spent: 145800, remaining: 4200,   percent_used: 97, status: "critical" },
  { department: "Legal",        annual_limit: 90000,  spent: 18000,  remaining: 72000,  percent_used: 20, status: "healthy" }
];

function getMockDeptBudgets(): DepartmentBudget[] {
  const stored = localStorage.getItem("procurement_dept_budgets");
  if (!stored) {
    localStorage.setItem("procurement_dept_budgets", JSON.stringify(MOCK_DEPT_BUDGETS));
    return MOCK_DEPT_BUDGETS;
  }
  try {
    return JSON.parse(stored) as DepartmentBudget[];
  } catch {
    return MOCK_DEPT_BUDGETS;
  }
}

function buildProcurementContext(req: ProcurementRequest): ProcurementContext {
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

// In-memory / local storage helper for mock database
function getMockRequests(): ProcurementRequest[] {
  const stored = localStorage.getItem("procurement_requests");
  if (!stored) {
    localStorage.setItem("procurement_requests", JSON.stringify(MOCK_SEED_REQUESTS));
    return MOCK_SEED_REQUESTS;
  }
  const parsed: ProcurementRequest[] = JSON.parse(stored);

  // Dynamic status processor simulator
  let changed = false;
  const now = Date.now();

  const processed = parsed.map(req => {
    if (req.status === "pending" || req.status === "in_review") {
      const start = new Date(req.request.submitted_date).getTime();
      const elapsed = now - start;

      let updatedReq = { ...req };
      let stepChanged = false;

      // 1. BUDGET AGENT
      if (elapsed < 4000) {
        if (updatedReq.agents.budget.status !== "running") {
          updatedReq.agents.budget.status = "running";
          updatedReq.agents.budget.verdict = "PROCESSING";
          updatedReq.agents.budget.reason = "Analyzing department budget ledger and seasonal burn rates...";
          updatedReq.status = "in_review";
          stepChanged = true;
        }
      } else if (updatedReq.agents.budget.status === "waiting" || updatedReq.agents.budget.status === "running") {
        const cost = updatedReq.request.total_cost;
        const isBlock = cost > 150000 && updatedReq.request.department === "HR";
        const isWarn = cost > 100000;

        updatedReq.agents.budget.status = isBlock ? "block" : isWarn ? "warn" : "pass";
        updatedReq.agents.budget.verdict = isBlock ? "BLOCKED" : isWarn ? "WARNING RAISED" : "BUDGET APPROVED";
        updatedReq.agents.budget.reason = isBlock
          ? `Budget rejected. Requested $${cost.toLocaleString()} far exceeds standard HR department threshold limit of $50,000.00.`
          : isWarn
            ? `Special high-value expenditure approved. Fits in overall general reserves, but triggers deep manager audit thresholds.`
            : `Allotment cleared. $${cost.toLocaleString()} verified against active ${updatedReq.request.department} department balance.`;
        updatedReq.agents.budget.timestamp = new Date(start + 4000).toISOString();

        updatedReq.audit_trail.push({
          agent: "Budget Agent",
          action: "Budget Ledger Audit",
          timestamp: updatedReq.agents.budget.timestamp,
          verdict: updatedReq.agents.budget.status.toUpperCase(),
          reason: updatedReq.agents.budget.reason
        });
        stepChanged = true;
      }

      // 2. VENDOR RISK AGENT
      if (elapsed >= 4000) {
        if (elapsed < 8000) {
          if ((updatedReq.agents.budget.status as any) !== "waiting" && updatedReq.agents.vendor_risk.status === "waiting") {
            updatedReq.agents.vendor_risk.status = "running";
            updatedReq.agents.vendor_risk.verdict = "PROCESSING";
            updatedReq.agents.vendor_risk.reason = "Cross-referencing vendor corporate registry and SOC-2 certificates database...";
            stepChanged = true;
          }
        } else if (updatedReq.agents.vendor_risk.status === "waiting" || updatedReq.agents.vendor_risk.status === "running") {
          const vName = updatedReq.request.vendor_name.toLowerCase();
          const isWarn = vName.includes("untrusted") || vName.includes("shady") || updatedReq.request.total_cost > 90000;

          updatedReq.agents.vendor_risk.status = isWarn ? "warn" : "pass";
          updatedReq.agents.vendor_risk.verdict = isWarn ? "MODERATE RISK" : "MINIMAL RISK";
          updatedReq.agents.vendor_risk.reason = isWarn
            ? `Vendor verification: "${updatedReq.request.vendor_name}" lookup successful, but risk mitigation is flagged due to premium transaction scale.`
            : `Supplier identity cleared. "${updatedReq.request.vendor_name}" is a registered business partner with verified anti-bribery policies.`;
          updatedReq.agents.vendor_risk.timestamp = new Date(start + 8000).toISOString();

          updatedReq.audit_trail.push({
            agent: "Vendor Risk Agent",
            action: "Vendor Risk Assessment",
            timestamp: updatedReq.agents.vendor_risk.timestamp,
            verdict: updatedReq.agents.vendor_risk.status.toUpperCase(),
            reason: updatedReq.agents.vendor_risk.reason
          });
          stepChanged = true;
        }
      }

      // 3. COMPLIANCE AGENT
      if (elapsed >= 8000) {
        if (elapsed < 12000) {
          if (updatedReq.agents.vendor_risk.status !== "waiting" && updatedReq.agents.compliance.status === "waiting") {
            updatedReq.agents.compliance.status = "running";
            updatedReq.agents.compliance.verdict = "PROCESSING";
            updatedReq.agents.compliance.reason = "Running legal compliance guidelines check against procurement directive v4.11...";
            stepChanged = true;
          }
        } else if (updatedReq.agents.compliance.status === "waiting" || updatedReq.agents.compliance.status === "running") {
          const desc = updatedReq.request.item_description.toLowerCase();
          const isBlocked = desc.includes("weapons") || desc.includes("recreational drug") || desc.includes("bribe");
          const isWarn = updatedReq.request.urgency === "high" && updatedReq.request.total_cost > 50000;

          updatedReq.agents.compliance.status = isBlocked ? "block" : isWarn ? "warn" : "pass";
          updatedReq.agents.compliance.verdict = isBlocked ? "NON-COMPLIANT" : isWarn ? "EXPEDITED EXCEPTION" : "COMPLIANT";
          updatedReq.agents.compliance.reason = isBlocked
            ? `Procurement violations: Requested item directly breaches company safety code charter rules.`
            : isWarn
              ? `High-urgency route detected. Audit trail flagged for secondary review but continues.`
              : `Fully compliant. Procurement aligns with standard materials, equipment, and workspace security protocols.`;
          updatedReq.agents.compliance.timestamp = new Date(start + 12000).toISOString();

          updatedReq.audit_trail.push({
            agent: "Compliance Agent",
            action: "Corporate Compliance Audit",
            timestamp: updatedReq.agents.compliance.timestamp,
            verdict: updatedReq.agents.compliance.status.toUpperCase(),
            reason: updatedReq.agents.compliance.reason
          });
          stepChanged = true;
        }
      }

      // 4. MANAGER APPROVAL AGENT
      if (elapsed >= 12000) {
        if (elapsed < 16000) {
          if (updatedReq.agents.compliance.status !== "waiting" && updatedReq.agents.manager.status === "waiting") {
            updatedReq.agents.manager.status = "running";
            updatedReq.agents.manager.verdict = "PROCESSING";
            updatedReq.agents.manager.reason = "Computing delegations sign-off tier limits and reporting lines...";
            stepChanged = true;
          }
        } else if (updatedReq.agents.manager.status === "waiting" || updatedReq.agents.manager.status === "running") {
          const cost = updatedReq.request.total_cost;
          const isBudgetBlocked = updatedReq.agents.budget.status === "block";
          const isComplianceBlocked = updatedReq.agents.compliance.status === "block";

          if (isBudgetBlocked || isComplianceBlocked) {
            updatedReq.agents.manager.status = "block";
            updatedReq.agents.manager.verdict = "AUTO-REJECTED";
            updatedReq.agents.manager.reason = "Review process pre-terminated since critical compliance and budget checkpoints declared hard block levels.";
            updatedReq.status = "rejected";
            updatedReq.final_decision = "rejected";
          } else if (cost > 100000) {
            updatedReq.agents.manager.status = "escalated";
            updatedReq.agents.manager.verdict = "ESCALATED";
            updatedReq.agents.manager.reason = `Total cost of $${cost.toLocaleString()} exceeds automatic ledger limits ($100,000.00). Route designated to VP panel for direct human decision validation.`;
            updatedReq.status = "escalated";
            updatedReq.final_decision = "escalated_to_human";
          } else {
            updatedReq.agents.manager.status = "pass";
            updatedReq.agents.manager.verdict = "AUTO-APPROVED";
            updatedReq.agents.manager.reason = `Clear clearance status from budget (${updatedReq.agents.budget.status.toUpperCase()}) and compliance (${updatedReq.agents.compliance.status.toUpperCase()}). Delegated limit criteria met automatic approval scope.`;
            updatedReq.status = "approved";
            updatedReq.final_decision = "approved";
          }
          updatedReq.agents.manager.timestamp = new Date(start + 16000).toISOString();

          updatedReq.audit_trail.push({
            agent: "Manager Approval Agent",
            action: "Manager Auto-Approval Assessment",
            timestamp: updatedReq.agents.manager.timestamp,
            verdict: updatedReq.agents.manager.status.toUpperCase(),
            reason: updatedReq.agents.manager.reason
          });
          stepChanged = true;
        }
      }

      // 5. REPORT AGENT
      if (elapsed >= 16000 && updatedReq.status !== "in_review" && updatedReq.status !== "pending") {
        if (updatedReq.agents.report.status === "waiting") {
          updatedReq.agents.report.status = "running";
          stepChanged = true;
        } else if (updatedReq.agents.report.status === "running" && elapsed >= 19000) {
          updatedReq.agents.report.status = "done";
          updatedReq.agents.report.pdf_url = "#";
          updatedReq.agents.report.timestamp = new Date(start + 19000).toISOString();

          updatedReq.audit_trail.push({
            agent: "Report Agent",
            action: "Audit File Sign-Off",
            timestamp: updatedReq.agents.report.timestamp,
            verdict: "COMPILED",
            reason: "Cryptographically checked PDF report compiled with state ledgers, ready for audit log archive."
          });
          stepChanged = true;
        }
      }

      if (stepChanged) {
        changed = true;
        return updatedReq;
      }
    }
    return req;
  });

  if (changed) {
    localStorage.setItem("procurement_requests", JSON.stringify(processed));
    return processed;
  }

  return parsed;
}

// REST Client Module
export const client = {
  /**
   * Get all procurement requests
   */
  async getRequests(): Promise<ProcurementRequest[]> {
    if (useMock) {
      await new Promise(resolve => setTimeout(resolve, 350));
      return getMockRequests();
    }

    const response = await fetch(`${BASE_URL}/api/requests`);
    if (!response.ok) {
      throw new Error(`Failed to fetch requests: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Get full request details by ID
   */
  async getRequest(id: string): Promise<ProcurementRequest> {
    if (useMock) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const requests = getMockRequests();
      const match = requests.find(r => r.request_id === id);
      if (!match) {
        throw new Error(`Request ${id} not found in database.`);
      }
      const enriched = { ...match, procurement_context: buildProcurementContext(match) };
      return enriched;
    }

    const response = await fetch(`${BASE_URL}/api/requests/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch request detail for ID ${id}: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Get the full Band procurement shared context
   */
  async getContext(id: string): Promise<ProcurementContext> {
    if (useMock) {
      await new Promise(resolve => setTimeout(resolve, 250));
      const requests = getMockRequests();
      const match = requests.find(r => r.request_id === id);
      if (!match) {
        throw new Error(`Context for ${id} not found.`);
      }
      return buildProcurementContext(match);
    }

    const response = await fetch(`${BASE_URL}/api/requests/${id}/context`);
    if (!response.ok) {
      throw new Error(`Failed to fetch procurement context for ${id}: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Submit new procurement request
   */
  async submitRequest(data: Omit<ProcurementRequestData, "submitted_by" | "submitted_date" | "total_cost">): Promise<{ request_id: string }> {
    const total_cost = data.quantity * data.unit_cost;
    const submitted_date = new Date().toISOString();
    const currentUser = getCurrentUserLabel();

    if (useMock) {
      await new Promise(resolve => setTimeout(resolve, 600));
      const requests = getMockRequests();

      const newIdNumber = requests.length + 1;
      const request_id = `REQ-2026-0${newIdNumber < 10 ? "0" + newIdNumber : newIdNumber}`;

      const newRequest: ProcurementRequest = {
        request_id,
        status: "pending",
        request: {
          ...data,
          total_cost,
          submitted_by: currentUser,
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
            reason: `Procurement request submitted by ${currentUser} into AI routing pipeline.`
          }
        ],
        final_decision: null
      };

      const updated = [newRequest, ...requests];
      localStorage.setItem("procurement_requests", JSON.stringify(updated));
      return { request_id };
    }

    const response = await fetch(`${BASE_URL}/api/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        total_cost,
        submitted_by: currentUser,
        submitted_date
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to submit request: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Handle human override decision on escalated requests
   */
  async submitHumanDecision(id: string, decision: "approved" | "rejected", note: string): Promise<ProcurementRequest> {
    if (useMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const requests = getMockRequests();
      const matchIndex = requests.findIndex(r => r.request_id === id);
      if (matchIndex === -1) {
        throw new Error(`Request ${id} not found.`);
      }

      const matching = { ...requests[matchIndex] };
      const timestamp = new Date().toISOString();
      const currentUser = getCurrentUserLabel();

      matching.status = decision;
      matching.final_decision = decision;
      matching.human_decision = {
        decision,
        note,
        decided_by: currentUser,
        decided_at: timestamp
      };
      matching.agents.manager.status = decision === "approved" ? "pass" : "block";
      matching.agents.manager.verdict = decision === "approved" ? "HUMAN APPROVED" : "HUMAN REJECTED";
      matching.agents.manager.reason = `Manual override signed-off: ${note}`;
      matching.agents.manager.timestamp = timestamp;

      matching.agents.report.status = "running";

      matching.audit_trail.push({
        agent: "Human Auditor Panel",
        action: `Manual Decision: ${decision.toUpperCase()}`,
        timestamp,
        verdict: decision.toUpperCase(),
        reason: note
      });

      setTimeout(() => {
        const reqs = getMockRequests();
        const idx = reqs.findIndex(r => r.request_id === id);
        if (idx !== -1) {
          const r = { ...reqs[idx] };
          r.agents.report.status = "done";
          r.agents.report.pdf_url = "#";
          r.agents.report.timestamp = new Date().toISOString();
          r.audit_trail.push({
            agent: "Report Agent",
            action: "Audit File Sign-Off",
            timestamp: r.agents.report.timestamp,
            verdict: "COMPILED",
            reason: "Cryptographically final PDF report compiled post manual review signature."
          });
          reqs[idx] = r;
          localStorage.setItem("procurement_requests", JSON.stringify(reqs));
        }
      }, 2000);

      requests[matchIndex] = matching;
      localStorage.setItem("procurement_requests", JSON.stringify(requests));
      return matching;
    }

    const response = await fetch(`${BASE_URL}/api/requests/${id}/human-decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note, decided_by: getCurrentUserLabel() })
    });

    if (!response.ok) {
      throw new Error(`Failed to submit human override decision: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Fetch PDF Report Blob
   */
  async getReportBlob(id: string): Promise<Blob> {
    if (useMock) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const requests = getMockRequests();
      const match = requests.find(r => r.request_id === id);

      const fileContent = `
================================================================================
                    PROCUREMENT SYSTEM AUDIT MANUAL REPORT
================================================================================
REQUEST ID: ${id}
STATUS: ${match?.status.toUpperCase() || "UNKNOWN"}
ITEM: ${match?.request.item_description || ""}
DEPARTMENT: ${match?.request.department || ""}
VENDOR: ${match?.request.vendor_name || ""}
TOTAL AMOUNT: $${(match?.request.total_cost || 0).toLocaleString()} USD
SUBMITTED DATE: ${match?.request.submitted_date || ""}
SUBMITTED BY: ${match?.request.submitted_by || ""}

--------------------------------------------------------------------------------
AGENT LEDGER SIGN-OFFS & STAMPS
--------------------------------------------------------------------------------
1. BUDGET AGENT: [${match?.agents.budget.status.toUpperCase() || "WAITING"}]
   Verdict: ${match?.agents.budget.verdict || "NOT_RUN"}
   Reason: ${match?.agents.budget.reason || "Waiting for checkpoint trigger."}
   Timestamp: ${match?.agents.budget.timestamp || ""}

2. VENDOR RISK AGENT: [${match?.agents.vendor_risk.status.toUpperCase() || "WAITING"}]
   Verdict: ${match?.agents.vendor_risk.verdict || "NOT_RUN"}
   Reason: ${match?.agents.vendor_risk.reason || "Waiting for checkpoint trigger."}
   Timestamp: ${match?.agents.vendor_risk.timestamp || ""}

3. COMPLIANCE AGENT: [${match?.agents.compliance.status.toUpperCase() || "WAITING"}]
   Verdict: ${match?.agents.compliance.verdict || "NOT_RUN"}
   Reason: ${match?.agents.compliance.reason || "Waiting for checkpoint trigger."}
   Timestamp: ${match?.agents.compliance.timestamp || ""}

4. MANAGER APPROVAL AGENT: [${match?.agents.manager.status.toUpperCase() || "WAITING"}]
   Verdict: ${match?.agents.manager.verdict || "NOT_RUN"}
   Reason: ${match?.agents.manager.reason || "Waiting for checkpoint trigger."}
   Timestamp: ${match?.agents.manager.timestamp || ""}

5. CONSOLIDATED ACTION METRICS:
   Final Decision Status: ${match?.final_decision?.toUpperCase() || "AWAITING RESOLUTION"}
   Cryptographic Sign-Off Hash: sha384-5f532a8df8b9986b62ed32bb6420120${id}
--------------------------------------------------------------------------------
                    END OF TRANSACTION AUDIT TRANSCRIPT
================================================================================
      `.trim();
      return new Blob([fileContent], { type: "application/pdf" });
    }

    const response = await fetch(`${BASE_URL}/api/requests/${id}/report`);
    if (!response.ok) {
      throw new Error(`Failed to download report PDF: ${response.statusText}`);
    }
    return response.blob();
  },

  /**
   * Get department budget health
   */
  async getDeptBudgets(): Promise<DepartmentBudget[]> {
    if (useMock) {
      await new Promise(resolve => setTimeout(resolve, 250));
      return getMockDeptBudgets();
    }

    const response = await fetch(`${BASE_URL}/api/departments/budgets`);
    if (!response.ok) {
      throw new Error(`Failed to fetch department budgets: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Health endpoint used by the sidebar status indicator
   */
  async getHealth(): Promise<HealthResponse> {
    if (useMock) {
      return {
        status: "ok",
        active_agents: 5,
        uptime_seconds: Math.floor(performance.now() / 1000),
        band_initialized: true,
        last_pipeline_run: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
    }

    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Helper metrics calculations
   */
  async calcMetrics(): Promise<StatMetrics> {
    const list = await this.getRequests();

    const totalRequests = list.length;
    const pendingApproval = list.filter(r => r.status === "pending" || r.status === "in_review" || r.status === "escalated").length;
    const autoApprovedToday = list.filter(r => r.status === "approved" && r.agents.manager.status === "pass").length;
    const rejectedToday = list.filter(r => r.status === "rejected").length;

    return {
      totalRequests,
      pendingApproval,
      autoApprovedToday,
      rejectedToday
    };
  }
};
