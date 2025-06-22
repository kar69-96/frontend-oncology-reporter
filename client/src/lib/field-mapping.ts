import type { FieldExtraction } from './api-client';

// Backend to Frontend field mapping
export const BACKEND_TO_FRONTEND_MAPPING: Record<string, string> = {
  // Patient & Demographic Information
  'full_name': 'patientName',
  'date_of_birth': 'dateOfBirth',
  'sex_gender': 'sex',
  'race': 'race',
  'ethnicity': 'ethnicity',
  'address': 'addressAtDiagnosis',
  'place_of_birth': 'countyAtDiagnosis', // Approximate mapping
  'ssn': 'socialSecurityNumber',
  
  // Tumor Identification
  'primary_site': 'primarySite',
  'histology': 'histologicType',
  'behavior': 'behaviorCode',
  'laterality': 'laterality',
  'grade': 'gradeDifferentiation',
  'date_of_diagnosis': 'dateOfDiagnosis',
  'sequence_number': 'sequenceNumber',
  
  // Staging
  'stage': 'seerSummaryStage2018', // Approximate mapping
  
  // Treatment Information
  'treatment_type': 'surgeryOfPrimarySite', // Approximate mapping
  'treatment_dates': 'dateOfSurgery', // Approximate mapping
  
  // Outcome Information
  'vital_status': 'vitalStatus',
  'last_contact_date': 'dateOfLastContact',
  'death_date': 'dateOfDeath',
  'cause_of_death': 'causeOfDeath',
  
  // Additional mappings for fields that might be extracted
  'primary_site_description': 'primarySite',
  'histology_description': 'histologicType',
  'place_of_diagnosis': 'diagnosticConfirmation',
  'provider_information': 'reportingFacilityId',
  'facility_details': 'reportingFacilityId',
  'biomarkers': 'cancerStatus', // Approximate mapping
  'survival_time': 'dateOfLastContact', // Approximate mapping
  'marital_status': 'recordType', // Approximate mapping
};

// Frontend to Backend field mapping (reverse)
export const FRONTEND_TO_BACKEND_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(BACKEND_TO_FRONTEND_MAPPING).map(([backend, frontend]) => [frontend, backend])
);

export interface MappedFieldData {
  [frontendField: string]: {
    value: string;
    confidence: number;
    sourceSnippet: string;
    sourceLocation: string;
    reasoning: string;
    timestamp?: string;
  };
}

/**
 * Maps backend extracted data to frontend field names
 */
export function mapBackendToFrontend(backendData: Record<string, FieldExtraction>): MappedFieldData {
  const mappedData: MappedFieldData = {};
  
  Object.entries(backendData).forEach(([backendField, extraction]) => {
    const frontendField = BACKEND_TO_FRONTEND_MAPPING[backendField];
    
    if (frontendField && extraction.value) {
      mappedData[frontendField] = {
        value: extraction.value,
        confidence: extraction.confidence,
        sourceSnippet: extraction.source_snippet,
        sourceLocation: extraction.source_location,
        reasoning: extraction.reasoning,
        timestamp: extraction.timestamp,
      };
    }
  });
  
  return mappedData;
}

/**
 * Validates field completeness and returns missing required fields
 */
export function validateFieldCompleteness(mappedData: MappedFieldData): {
  missing: string[];
  present: string[];
  confidence: Record<string, 'high' | 'medium' | 'low'>;
} {
  const requiredFields = [
    'patientName',
    'dateOfBirth',
    'sex',
    'primarySite',
    'histologicType',
    'behaviorCode',
    'dateOfDiagnosis',
    'vitalStatus',
    'dateOfLastContact',
    'accessionNumber',
    'reportingFacilityId',
    'dateCaseAbstracted',
    'editChecksPassed',
    'recordType',
    'seerSummaryStage2018'
  ];
  
  const present = Object.keys(mappedData);
  const missing = requiredFields.filter(field => !present.includes(field));
  
  // Determine confidence levels based on extracted data
  const confidence: Record<string, 'high' | 'medium' | 'low'> = {};
  Object.entries(mappedData).forEach(([field, data]) => {
    if (data.confidence >= 0.8) {
      confidence[field] = 'high';
    } else if (data.confidence >= 0.6) {
      confidence[field] = 'medium';
    } else {
      confidence[field] = 'low';
    }
  });
  
  return { missing, present, confidence };
}

/**
 * Formats extracted data for form population
 */
export function formatForForm(mappedData: MappedFieldData): Record<string, string> {
  const formData: Record<string, string> = {};
  
  Object.entries(mappedData).forEach(([field, data]) => {
    formData[field] = data.value;
  });
  
  return formData;
} 