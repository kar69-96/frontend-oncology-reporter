import type { Patient, Document, TumorRegistryForm, IcdCode } from "@shared/schema";

export type PatientStatus = "in_progress" | "completed" | "needs_review" | "submitted";

export interface DashboardMetrics {
  totalPatients: number;
  completedReports: number;
  pendingReviews: number;
  errorFlags: number;
  statusDistribution: { status: string; count: number }[];
  monthlySubmissions: { month: string; count: number }[];
}

export interface PatientWithDocuments extends Patient {
  documents?: Document[];
  form?: TumorRegistryForm;
}

export type DocumentType = "pathology" | "clinical_notes" | "imaging";

export interface StatusBadgeProps {
  status: PatientStatus;
  className?: string;
}

export { type Patient, type Document, type TumorRegistryForm, type IcdCode };
