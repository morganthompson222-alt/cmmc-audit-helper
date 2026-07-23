export type ControlStatus = "not_started" | "yes" | "in_progress" | "not_applicable";

export type CMMCLevel = 1 | 2;

export interface Control {
  id: string;
  control_id: string;
  domain: string;
  question: string;
  good: string;
  mistake: string;
  evidence_required: boolean;
  evidence_guidance: string;
}

export interface ControlResponse {
  id?: string;
  assessment_id: string;
  control_id: string;
  status: ControlStatus;
  notes: string;
  updated_at?: string;
}

export interface EvidenceFile {
  id?: string;
  control_response_id: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at?: string;
}

export interface POAMItem {
  id?: string;
  control_response_id: string;
  description: string;
  responsible_party: string;
  target_date: string;
  status: "open" | "closed";
}

export interface Assessment {
  id?: string;
  company_id: string;
  level: CMMCLevel;
  sprs_score: number | null;
  status: "in_progress" | "completed";
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  id?: string;
  name: string;
  owner_user_id: string;
  cmmc_level: CMMCLevel | null;
  subscription_status: "unpaid" | "paid" | "cancelled";
  created_at?: string;
}

export interface Payment {
  id?: string;
  company_id: string;
  stripe_session_id: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  created_at?: string;
}

export interface ScopeItem {
  value: string;
  label: string;
}

export interface AssessmentState {
  level: CMMCLevel | null;
  scope: string[];
  responses: Record<string, ControlStatus>;
  notes: Record<string, string>;
  evidence: Record<string, { id: string; name: string; size: number; type: string }[]>;
  poam: Record<string, { description: string; responsible: string; date: string; status: string }>;
}
