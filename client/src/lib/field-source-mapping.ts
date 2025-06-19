// Field source mapping for linking form fields to document locations
export interface FieldSource {
  documentId: number;
  documentType: string;
  textContent: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export interface FieldSourceMapping {
  [fieldName: string]: FieldSource;
}

// Simulated field source mapping based on document content analysis
export const getFieldSourceMapping = (patientId: number): FieldSourceMapping => {
  // This simulates OCR extraction results that would map form fields to document locations
  const mappings: FieldSourceMapping = {
    // Patient Demographics - typically from clinical notes
    patientName: {
      documentId: patientId * 10 + 1, // Simulate document ID pattern
      documentType: 'clinical_notes',
      textContent: 'Patient Name: Sarah Johnson',
      startIndex: 14,
      endIndex: 26,
      confidence: 0.98
    },
    dateOfBirth: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes', 
      textContent: 'DOB: 1985-03-15',
      startIndex: 5,
      endIndex: 15,
      confidence: 0.95
    },
    sex: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Gender: Female',
      startIndex: 8,
      endIndex: 14,
      confidence: 0.97
    },
    
    // Tumor Information - typically from pathology reports
    primarySite: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'Primary site: Breast, upper outer quadrant',
      startIndex: 14,
      endIndex: 43,
      confidence: 0.92
    },
    histologicType: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'Histologic type: Invasive ductal carcinoma',
      startIndex: 17,
      endIndex: 42,
      confidence: 0.89
    },
    behaviorCode: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'Behavior: Malignant (3)',
      startIndex: 10,
      endIndex: 18,
      confidence: 0.96
    },
    
    // Staging - from pathology and clinical notes
    clinicalT: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Clinical T stage: T2',
      startIndex: 18,
      endIndex: 20,
      confidence: 0.91
    },
    clinicalN: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Clinical N stage: N1',
      startIndex: 18,
      endIndex: 20,
      confidence: 0.88
    },
    
    // Treatment - from clinical notes
    surgeryOfPrimarySite: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Surgery performed: Lumpectomy with sentinel lymph node biopsy',
      startIndex: 19,
      endIndex: 62,
      confidence: 0.94
    },
    chemotherapy: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Chemotherapy: Adriamycin and Cyclophosphamide',
      startIndex: 14,
      endIndex: 45,
      confidence: 0.93
    },
    
    // Follow-up
    vitalStatus: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Patient status: Alive with no evidence of disease',
      startIndex: 16,
      endIndex: 47,
      confidence: 0.96
    }
  };
  
  return mappings;
};

// Get source information for a specific field
export const getFieldSource = (fieldName: string, patientId: number): FieldSource | null => {
  const mappings = getFieldSourceMapping(patientId);
  return mappings[fieldName] || null;
};

// Check if field has source mapping
export const hasFieldSource = (fieldName: string, patientId: number): boolean => {
  return getFieldSource(fieldName, patientId) !== null;
};