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
  Breast: {
    label: "Breast",
    color: "bg-pink-100 text-pink-800",
  },
  Lung: {
    label: "Lung",
    color: "bg-blue-100 text-blue-800",
  },
  Prostate: {
    label: "Prostate",
    color: "bg-green-100 text-green-800",
  },
  Colorectal: {
    label: "Colorectal",
    color: "bg-orange-100 text-orange-800",
  },
  Pancreas: {
    label: "Pancreas",
    color: "bg-purple-100 text-purple-800",
  },
  Endocrine: {
    label: "Endocrine",
    color: "bg-teal-100 text-teal-800",
  },
  Urological: {
    label: "Urological",
    color: "bg-cyan-100 text-cyan-800",
  },
  Gynecological: {
    label: "Gynecological",
    color: "bg-rose-100 text-rose-800",
  },
  Skin: {
    label: "Skin",
    color: "bg-amber-100 text-amber-800",
  },
  Hepatobiliary: {
    label: "Hepatobiliary",
    color: "bg-emerald-100 text-emerald-800",
  },
  Gastrointestinal: {
    label: "Gastrointestinal",
    color: "bg-lime-100 text-lime-800",
  },
  "Head and Neck": {
    label: "Head and Neck",
    color: "bg-indigo-100 text-indigo-800",
  },
} as const;
