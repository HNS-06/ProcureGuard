export type UrgencyType = "low" | "medium" | "high";
export type RequestStatus = "pending" | "in_review" | "approved" | "rejected" | "escalated";

export interface ProcurementRequestData {
  item_description: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  department: string;
  vendor_name: string;
  urgency: UrgencyType;
  justification: string;
  submitted_by: string;
  submitted_date: string;
}

export type AgentStatusType = "waiting" | "running" | "pass" | "warn" | "block";
export type ManagerAgentStatusType = "waiting" | "running" | "pass" | "warn" | "block" | "escalated";
export type ReportAgentStatusType = "waiting" | "running" | "done";

export interface AgentDetails {
  status: AgentStatusType;
  verdict: string;
  reason: string;
  timestamp: string;
}

export interface ManagerAgentDetails {
  status: ManagerAgentStatusType;
  verdict: string;
  reason: string;
  timestamp: string;
}

export interface ReportAgentDetails {
  status: ReportAgentStatusType;
  pdf_url: string;
  timestamp: string;
}

export interface AgentPipeline {
  budget: AgentDetails;
  vendor_risk: AgentDetails;
  compliance: AgentDetails;
  manager: ManagerAgentDetails;
  report: ReportAgentDetails;
}

export interface AuditTrailEntry {
  agent: string;
  action: string;
  timestamp: string;
  verdict: string;
  reason: string;
}

export interface HumanDecision {
  decision: "approved" | "rejected";
  note: string;
  decided_by: string;
  decided_at: string;
}

export interface ProcurementRequest {
  request_id: string;
  status: RequestStatus;
  request: ProcurementRequestData;
  agents: AgentPipeline;
  audit_trail: AuditTrailEntry[];
  final_decision: "approved" | "rejected" | "escalated_to_human" | null;
  human_decision?: HumanDecision | null;
  procurement_context?: ProcurementContext;
}

export interface StatMetrics {
  totalRequests: number;
  pendingApproval: number;
  autoApprovedToday: number;
  rejectedToday: number;
}

export interface DepartmentBudget {
  department: string;
  annual_limit: number;
  spent: number;
  remaining: number;
  percent_used: number;
  status: "healthy" | "warning" | "critical";
}

export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  active_agents: number;
  uptime_seconds: number;
  band_initialized: boolean;
  last_pipeline_run: string;
  timestamp: string;
}

export interface ProcurementContext {
  context_id: string;
  request_id: string;
  created_at: string;
  updated_at: string;
  request: ProcurementRequestData;
  agents: AgentPipeline;
  audit_trail: AuditTrailEntry[];
  final_decision: ProcurementRequest["final_decision"];
  band_metadata: {
    participants: string[];
    shared_keys: string[];
    version: string;
  };
}

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  createdAt: number;
  duration: number;
}
