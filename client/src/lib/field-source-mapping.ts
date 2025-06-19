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

// Simplified field source mapping - only for fields that should have highlighting functionality
// Empty/low confidence fields (histologicType, gradeDifferentiation, radiationTherapy, etc.) are excluded
export const getFieldSourceMapping = (patientId: number): FieldSourceMapping => {
  // Get patient-specific data based on patientId
  const getPatientData = (id: number) => {
    if (id === 72) return { name: 'Michael Chen', dob: '8/22/1972', diagnosis: 'lung' };
    if (id === 70) return { name: 'Sarah Johnson', dob: '5/15/1978', diagnosis: 'breast' };
    return { name: 'Patient Name', dob: '1/1/1970', diagnosis: 'cancer' };
  };
  
  const patientData = getPatientData(patientId);
  
  // Only include fields that have actual data and should be clickable
  const mappings: FieldSourceMapping = {
    // Core Demographics - always populated with high confidence
    patientName: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: patientData.name,
      startIndex: 60,
      endIndex: 72,
      confidence: 0.98
    },
    dateOfBirth: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: patientData.dob,
      startIndex: 113,
      endIndex: 123,
      confidence: 0.95
    },
    race: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'White',
      startIndex: 200,
      endIndex: 205,
      confidence: 0.93
    },
    ethnicity: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Non-Hispanic',
      startIndex: 220,
      endIndex: 232,
      confidence: 0.91
    },
    addressAtDiagnosis: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: '123 Main St',
      startIndex: 250,
      endIndex: 262,
      confidence: 0.89
    },
    countyAtDiagnosis: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'Cook County',
      startIndex: 280,
      endIndex: 291,
      confidence: 0.87
    },

    // Tumor Information - high confidence fields only
    primarySite: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: patientData.diagnosis,
      startIndex: 14,
      endIndex: 29,
      confidence: 0.92
    },
    behaviorCode: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'malignant',
      startIndex: 45,
      endIndex: 54,
      confidence: 0.96
    },
    laterality: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'left',
      startIndex: 35,
      endIndex: 39,
      confidence: 0.88
    },
    dateOfDiagnosis: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: '2024',
      startIndex: 50,
      endIndex: 54,
      confidence: 0.94
    },
    diagnosticConfirmation: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'histology',
      startIndex: 70,
      endIndex: 79,
      confidence: 0.95
    },
    classOfCase: {
      documentId: patientId * 10,
      documentType: 'pathology',
      textContent: 'analytic',
      startIndex: 90,
      endIndex: 98,
      confidence: 0.93
    },

    // Staging Information - medium to high confidence
    clinicalT: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: '3.2 cm',
      startIndex: 300,
      endIndex: 306,
      confidence: 0.91
    },
    clinicalN: {
      documentId: patientId * 10 + 1,
      documentType: 'clinical_notes',
      textContent: 'lymph node',
      startIndex: 320,
      endIndex: 330,
      confidence: 0.88
    },

    // Treatment Information - high confidence fields
    surgeryOfPrimarySite: {
      documentId: patientId * 10 + 2,
      documentType: 'clinical_notes',
      textContent: 'lobectomy',
      startIndex: 400,
      endIndex: 409,
      confidence: 0.94
    },
    dateOfSurgery: {
      documentId: patientId * 10 + 2,
      documentType: 'clinical_notes',
      textContent: 'surgery',
      startIndex: 420,
      endIndex: 427,
      confidence: 0.92
    },
    chemotherapy: {
      documentId: patientId * 10 + 2,
      documentType: 'clinical_notes',
      textContent: 'chemotherapy',
      startIndex: 450,
      endIndex: 462,
      confidence: 0.89
    },

    // Follow-up Information
    dateOfLastContact: {
      documentId: patientId * 10 + 2,
      documentType: 'clinical_notes',
      textContent: 'follow-up',
      startIndex: 500,
      endIndex: 509,
      confidence: 0.95
    },
    vitalStatus: {
      documentId: patientId * 10 + 2,
      documentType: 'clinical_notes',
      textContent: 'alive',
      startIndex: 520,
      endIndex: 525,
      confidence: 0.97
    }
  };

  return mappings;
};

export const getFieldSource = (fieldName: string, patientId: number): FieldSource | null => {
  const mapping = getFieldSourceMapping(patientId);
  return mapping[fieldName] || null;
};

export const hasFieldSource = (fieldName: string, patientId: number): boolean => {
  return getFieldSource(fieldName, patientId) !== null;
};