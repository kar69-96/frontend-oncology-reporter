export const PATIENT_STATUSES = {
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-800",
    dotColor: "bg-yellow-500",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800",
    dotColor: "bg-green-500",
  },
  needs_review: {
    label: "Needs Review",
    color: "bg-red-100 text-red-800",
    dotColor: "bg-red-500",
  },
  submitted: {
    label: "Submitted",
    color: "bg-blue-100 text-blue-800",
    dotColor: "bg-blue-500",
  },
} as const;

export const DOCUMENT_TYPES = {
  pathology: {
    label: "Pathology",
    icon: "fas fa-file-pdf",
    color: "text-red-500",
  },
  clinical_notes: {
    label: "Clinical Notes",
    icon: "fas fa-file-medical",
    color: "text-blue-500",
  },
  imaging: {
    label: "Imaging",
    icon: "fas fa-x-ray",
    color: "text-purple-500",
  },
} as const;

export const ICD_CATEGORIES = {
  topography: {
    label: "Topography",
    color: "bg-blue-100 text-blue-800",
  },
  morphology: {
    label: "Morphology",
    color: "bg-green-100 text-green-800",
  },
} as const;
