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

// Comprehensive field source mapping for all tumor registry form fields
export const getFieldSourceMapping = (patientId: number): FieldSourceMapping => {
  // This simulates OCR extraction results that would map form fields to document locations
  const mappings: FieldSourceMapping = {
    // Demographics Section - Clinical Notes & Registration Documents
    patientName: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Michael Chen',
      startIndex: 60,
      endIndex: 72,
      confidence: 0.98
    },
    dateOfBirth: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: '1985-03-15',
      startIndex: 113,
      endIndex: 123,
      confidence: 0.95
    },
    sex: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Male',
      startIndex: 132,
      endIndex: 136,
      confidence: 0.97
    },
    race: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Asian',
      startIndex: 142,
      endIndex: 147,
      confidence: 0.94
    },
    ethnicity: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Not Hispanic or Latino',
      startIndex: 11,
      endIndex: 33,
      confidence: 0.93
    },
    addressAtDiagnosis: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: '123 Main Street, San Francisco, CA 94102',
      startIndex: 9,
      endIndex: 48,
      confidence: 0.89
    },
    countyAtDiagnosis: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'San Francisco County',
      startIndex: 8,
      endIndex: 27,
      confidence: 0.91
    },
    socialSecurityNumber: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'XXX-XX-1234',
      startIndex: 5,
      endIndex: 16,
      confidence: 0.96
    },

    // Tumor Information - Pathology Reports
    primarySite: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'Right upper lobe',
      startIndex: 14,
      endIndex: 29,
      confidence: 0.92
    },
    histologicType: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'adenocarcinoma',
      startIndex: 17,
      endIndex: 31,
      confidence: 0.89
    },
    behaviorCode: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'Malignant',
      startIndex: 10,
      endIndex: 18,
      confidence: 0.96
    },
    gradeDifferentiation: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'moderately differentiated',
      startIndex: 7,
      endIndex: 42,
      confidence: 0.87
    },
    laterality: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'right',
      startIndex: 12,
      endIndex: 17,
      confidence: 0.95
    },
    tumorSize: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: '3.2 cm',
      startIndex: 12,
      endIndex: 18,
      confidence: 0.94
    },
    diagnosticConfirmation: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'histology',
      startIndex: 14,
      endIndex: 40,
      confidence: 0.93
    },

    // Staging Information - Clinical & Pathology
    clinicalT: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'T2',
      startIndex: 18,
      endIndex: 20,
      confidence: 0.91
    },
    clinicalN: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'N1',
      startIndex: 18,
      endIndex: 20,
      confidence: 0.88
    },
    clinicalM: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'M0',
      startIndex: 18,
      endIndex: 20,
      confidence: 0.85
    },
    pathologicT: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'pT2',
      startIndex: 14,
      endIndex: 17,
      confidence: 0.92
    },
    pathologicN: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'pN1',
      startIndex: 14,
      endIndex: 17,
      confidence: 0.86
    },
    pathologicM: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'pM0',
      startIndex: 14,
      endIndex: 17,
      confidence: 0.90
    },
    stageGroup: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Overall stage: Stage IIB',
      startIndex: 15,
      endIndex: 25,
      confidence: 0.89
    },
    seerStage: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'SEER stage: Regional',
      startIndex: 12,
      endIndex: 20,
      confidence: 0.91
    },

    // Treatment Information - Clinical Notes & Surgical Reports
    classOfCase: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Class of case: Analytic',
      startIndex: 15,
      endIndex: 23,
      confidence: 0.95
    },
    surgeryOfPrimarySite: {
      documentId: patientId * 10 + 2,
      documentType: 'clinical_notes',
      textContent: 'Surgery performed: Right upper lobectomy with lymph node dissection',
      startIndex: 19,
      endIndex: 66,
      confidence: 0.94
    },
    scopeOfRegionalLymphNodeSurgery: {
      documentId: patientId * 10 + 2,
      documentType: 'clinical_notes',
      textContent: 'Lymph nodes: Regional lymph node dissection performed',
      startIndex: 13,
      endIndex: 53,
      confidence: 0.92
    },
    numberOfLymphNodesExamined: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'Lymph nodes examined: 15',
      startIndex: 22,
      endIndex: 24,
      confidence: 0.96
    },
    numberOfLymphNodesPositive: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'Positive lymph nodes: 3',
      startIndex: 22,
      endIndex: 23,
      confidence: 0.95
    },
    radiationTherapy: {
      documentId: patientId * 10 + 2,
      documentType: 'clinical_notes',
      textContent: 'Radiation therapy: External beam radiation completed',
      startIndex: 19,
      endIndex: 52,
      confidence: 0.84
    },
    chemotherapy: {
      documentId: patientId * 10 + 2,
      documentType: 'clinical_notes',
      textContent: 'Chemotherapy: Carboplatin and Paclitaxel regimen administered',
      startIndex: 14,
      endIndex: 61,
      confidence: 0.93
    },
    hormoneTherapy: {
      documentId: patientId * 10 + 2,
      documentType: 'clinical_notes',
      textContent: 'Hormone therapy: Not applicable for lung cancer',
      startIndex: 17,
      endIndex: 47,
      confidence: 0.91
    },
    immunotherapy: {
      documentId: patientId * 10 + 2,
      documentType: 'clinical_notes',
      textContent: 'Immunotherapy: Pembrolizumab initiated',
      startIndex: 15,
      endIndex: 38,
      confidence: 0.88
    },

    // Follow-up Information - Clinical Notes
    dateOfLastContact: {
      documentId: patientId * 10 + 2,
      documentType: 'clinical_notes',
      textContent: 'Last contact: 2024-01-15',
      startIndex: 14,
      endIndex: 24,
      confidence: 0.97
    },
    vitalStatus: {
      documentId: patientId * 10 + 2,
      documentType: 'clinical_notes',
      textContent: 'Patient status: Alive with disease',
      startIndex: 16,
      endIndex: 34,
      confidence: 0.96
    },
    causeOfDeath: {
      documentId: patientId * 10 + 2,
      documentType: 'clinical_notes',
      textContent: 'Cause of death: Not applicable - patient alive',
      startIndex: 16,
      endIndex: 46,
      confidence: 0.98
    },
    survivesMonths: {
      documentId: patientId * 10 + 2,
      documentType: 'clinical_notes',
      textContent: 'Survival: 18 months from diagnosis',
      startIndex: 10,
      endIndex: 12,
      confidence: 0.93
    },

    // Administrative Fields - Registration & Clinical Notes
    reportingFacility: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Reporting facility: San Francisco General Hospital',
      startIndex: 20,
      endIndex: 49,
      confidence: 0.97
    },
    recordType: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Record type: Incidence',
      startIndex: 13,
      endIndex: 22,
      confidence: 0.95
    },
    sequenceNumber: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Sequence number: 00',
      startIndex: 17,
      endIndex: 19,
      confidence: 0.96
    },
    dateOfDiagnosis: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'Date of diagnosis: 2022-06-15',
      startIndex: 19,
      endIndex: 29,
      confidence: 0.98
    },
    ageAtDiagnosis: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Age at diagnosis: 37 years',
      startIndex: 18,
      endIndex: 20,
      confidence: 0.94
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