import type { User, InsertUser, Patient, InsertPatient, Document, InsertDocument, TumorRegistryForm, InsertTumorRegistryForm, IcdCode, InsertIcdCode } from "../shared/schema";
import { DocumentGenerator } from "./document-generator";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Patient methods
  getPatients(): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;

  // Document methods
  getDocumentsByPatientId(patientId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;

  // Tumor Registry Form methods
  getFormByPatientId(patientId: number): Promise<TumorRegistryForm | undefined>;
  createOrUpdateForm(form: InsertTumorRegistryForm): Promise<TumorRegistryForm>;

  // ICD Code methods
  getIcdCodes(): Promise<IcdCode[]>;
  getIcdCode(id: number): Promise<IcdCode | undefined>;
  createIcdCode(code: InsertIcdCode): Promise<IcdCode>;
  updateIcdCode(id: number, code: Partial<InsertIcdCode>): Promise<IcdCode | undefined>;
  deleteIcdCode(id: number): Promise<boolean>;
  searchIcdCodes(query: string, category?: string): Promise<IcdCode[]>;

  // Dashboard methods
  getDashboardMetrics(): Promise<{
    totalPatients: number;
    completedReports: number;
    pendingReviews: number;
    errorFlags: number;
    statusDistribution: { status: string; count: number }[];
    monthlySubmissions: { month: string; count: number }[];
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private documents: Map<number, Document>;
  private tumorRegistryForms: Map<number, TumorRegistryForm>;
  private icdCodes: Map<number, IcdCode>;
  private currentId: number;
  private documentGenerator: DocumentGenerator;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.documents = new Map();
    this.tumorRegistryForms = new Map();
    this.icdCodes = new Map();
    this.currentId = 1;
    this.documentGenerator = new DocumentGenerator();
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize ICD codes and NAACCR codes
    const icdData = [
      // ICD-O-3 Codes - Breast
      { code: "C50.9", description: "Malignant neoplasm of breast, unspecified", category: "Breast", codeType: "ICD-O-3" },
      { code: "C50.1", description: "Malignant neoplasm of central portion of breast", category: "Breast", codeType: "ICD-O-3" },
      { code: "C50.2", description: "Malignant neoplasm of upper-inner quadrant of breast", category: "Breast", codeType: "ICD-O-3" },
      { code: "C50.3", description: "Malignant neoplasm of lower-inner quadrant of breast", category: "Breast", codeType: "ICD-O-3" },
      { code: "C50.4", description: "Malignant neoplasm of upper-outer quadrant of breast", category: "Breast", codeType: "ICD-O-3" },
      { code: "C50.5", description: "Malignant neoplasm of lower-outer quadrant of breast", category: "Breast", codeType: "ICD-O-3" },
      { code: "C50.8", description: "Malignant neoplasm of overlapping sites of breast", category: "Breast", codeType: "ICD-O-3" },
      
      // ICD-O-3 Codes - Lung
      { code: "C78.1", description: "Secondary malignant neoplasm of lung", category: "Lung", codeType: "ICD-O-3" },
      { code: "C34.1", description: "Malignant neoplasm of upper lobe, bronchus or lung", category: "Lung", codeType: "ICD-O-3" },
      { code: "C34.2", description: "Malignant neoplasm of middle lobe, bronchus or lung", category: "Lung", codeType: "ICD-O-3" },
      { code: "C34.3", description: "Malignant neoplasm of lower lobe, bronchus or lung", category: "Lung", codeType: "ICD-O-3" },
      { code: "C34.8", description: "Malignant neoplasm of overlapping sites of bronchus and lung", category: "Lung", codeType: "ICD-O-3" },
      { code: "C34.9", description: "Malignant neoplasm of unspecified part of bronchus or lung", category: "Lung", codeType: "ICD-O-3" },
      
      // ICD-O-3 Codes - Prostate  
      { code: "C61", description: "Malignant neoplasm of prostate", category: "Prostate", codeType: "ICD-O-3" },
      
      // ICD-O-3 Codes - Colorectal
      { code: "C18.9", description: "Malignant neoplasm of colon, unspecified", category: "Colorectal", codeType: "ICD-O-3" },
      { code: "C18.0", description: "Malignant neoplasm of cecum", category: "Colorectal", codeType: "ICD-O-3" },
      { code: "C19", description: "Malignant neoplasm of rectosigmoid junction", category: "Colorectal", codeType: "ICD-O-3" },
      { code: "C20", description: "Malignant neoplasm of rectum", category: "Colorectal", codeType: "ICD-O-3" },
      
      // ICD-O-3 Codes - Pancreas
      { code: "C25.9", description: "Malignant neoplasm of pancreas, unspecified", category: "Pancreas", codeType: "ICD-O-3" },
      { code: "C25.0", description: "Malignant neoplasm of head of pancreas", category: "Pancreas", codeType: "ICD-O-3" },
      
      // NAACCR Codes - Demographics
      { code: "0040", description: "Patient ID Number", category: "Demographics", codeType: "NAACCR" },
      { code: "0160", description: "Patient Name - Last", category: "Demographics", codeType: "NAACCR" },
      { code: "0210", description: "Patient Name - First", category: "Demographics", codeType: "NAACCR" },
      { code: "0220", description: "Patient Name - Middle", category: "Demographics", codeType: "NAACCR" },
      { code: "0240", description: "Date of Birth", category: "Demographics", codeType: "NAACCR" },
      { code: "0220", description: "Sex", category: "Demographics", codeType: "NAACCR" },
      { code: "0160", description: "Race 1", category: "Demographics", codeType: "NAACCR" },
      { code: "0170", description: "Race 2", category: "Demographics", codeType: "NAACCR" },
      { code: "0190", description: "Spanish/Hispanic Origin", category: "Demographics", codeType: "NAACCR" },
      { code: "0070", description: "Address at Diagnosis - No & Street", category: "Demographics", codeType: "NAACCR" },
      
      // NAACCR Codes - Tumor Identification
      { code: "0400", description: "Primary Site", category: "Tumor", codeType: "NAACCR" },
      { code: "0420", description: "Laterality", category: "Tumor", codeType: "NAACCR" },
      { code: "0521", description: "Histologic Type ICD-O-3", category: "Tumor", codeType: "NAACCR" },
      { code: "0522", description: "Behavior Code ICD-O-3", category: "Tumor", codeType: "NAACCR" },
      { code: "0440", description: "Date of Diagnosis", category: "Tumor", codeType: "NAACCR" },
      { code: "0490", description: "Grade", category: "Tumor", codeType: "NAACCR" },
      { code: "0430", description: "Diagnostic Confirmation", category: "Tumor", codeType: "NAACCR" },
      { code: "0610", description: "Class of Case", category: "Tumor", codeType: "NAACCR" },
      
      // NAACCR Codes - Staging
      { code: "0940", description: "TNM Clin T", category: "Staging", codeType: "NAACCR" },
      { code: "0950", description: "TNM Clin N", category: "Staging", codeType: "NAACCR" },
      { code: "0960", description: "TNM Clin M", category: "Staging", codeType: "NAACCR" },
      { code: "0970", description: "TNM Clin Stage Group", category: "Staging", codeType: "NAACCR" },
      { code: "1000", description: "TNM Path T", category: "Staging", codeType: "NAACCR" },
      { code: "1010", description: "TNM Path N", category: "Staging", codeType: "NAACCR" },
      { code: "1020", description: "TNM Path M", category: "Staging", codeType: "NAACCR" },
      { code: "1030", description: "TNM Path Stage Group", category: "Staging", codeType: "NAACCR" },
      { code: "0759", description: "SEER Summary Stage 2000", category: "Staging", codeType: "NAACCR" },
      
      // NAACCR Codes - Treatment
      { code: "1290", description: "Date of 1st Course Treatment", category: "Treatment", codeType: "NAACCR" },
      { code: "1340", description: "RX Summ--Surgery Primary Site", category: "Treatment", codeType: "NAACCR" },
      { code: "1350", description: "RX Summ--Scope Reg LN Sur", category: "Treatment", codeType: "NAACCR" },
      { code: "1360", description: "RX Summ--Surg Oth Reg/Dis", category: "Treatment", codeType: "NAACCR" },
      { code: "1380", description: "RX Summ--Radiation", category: "Treatment", codeType: "NAACCR" },
      { code: "1390", description: "RX Summ--Chemo", category: "Treatment", codeType: "NAACCR" },
      { code: "1400", description: "RX Summ--Hormone", category: "Treatment", codeType: "NAACCR" },
      { code: "1410", description: "RX Summ--BRM", category: "Treatment", codeType: "NAACCR" },
      { code: "1420", description: "RX Summ--Other", category: "Treatment", codeType: "NAACCR" },
      
      // NAACCR Codes - Follow-up
      { code: "1750", description: "Date of Last Contact", category: "Follow-up", codeType: "NAACCR" },
      { code: "1760", description: "Vital Status", category: "Follow-up", codeType: "NAACCR" },
      { code: "1850", description: "Date of Death", category: "Follow-up", codeType: "NAACCR" },
      { code: "1860", description: "Cause of Death", category: "Follow-up", codeType: "NAACCR" },
      { code: "1870", description: "Cancer Status", category: "Follow-up", codeType: "NAACCR" },
      
      // NAACCR Codes - Administrative
      { code: "0540", description: "Sequence Number--Central", category: "Administrative", codeType: "NAACCR" },
      { code: "0570", description: "Text--Usual Occupation", category: "Administrative", codeType: "NAACCR" },
      { code: "0580", description: "Text--Usual Industry", category: "Administrative", codeType: "NAACCR" },
      { code: "2300", description: "Abstractor ID", category: "Administrative", codeType: "NAACCR" },
      { code: "2310", description: "Date of 1st Contact", category: "Administrative", codeType: "NAACCR" },
      { code: "2320", description: "Date Case Initiated", category: "Administrative", codeType: "NAACCR" },
      { code: "2330", description: "Date Case Completed", category: "Administrative", codeType: "NAACCR" },
      { code: "2340", description: "Date Case Last Changed", category: "Administrative", codeType: "NAACCR" }
    ];

    icdData.forEach(data => {
      const icdCode: IcdCode = {
        id: this.currentId++,
        code: data.code,
        description: data.description,
        category: data.category,
        codeType: data.codeType,
        lastUpdated: new Date()
      };
      this.icdCodes.set(icdCode.id, icdCode);
    });

    // Initialize sample patients
    const samplePatients = [
      {
        name: "Sarah Johnson",
        mrn: "MRN001234",
        dateOfBirth: "1978-05-15",
        sex: "Female",
        diagnosis: "Invasive ductal carcinoma of breast",
        status: "completed" as const
      },
      {
        name: "Michael Chen",
        mrn: "MRN001235",
        dateOfBirth: "1972-08-22",
        sex: "Male",
        diagnosis: "Adenocarcinoma of lung",
        status: "in_progress" as const
      },
      {
        name: "Emily Rodriguez",
        mrn: "MRN001236",
        dateOfBirth: "1965-11-08",
        sex: "Female",
        diagnosis: "Squamous cell carcinoma of cervix",
        status: "needs_review" as const
      },
      {
        name: "David Thompson",
        mrn: "MRN001237",
        dateOfBirth: "1959-03-12",
        sex: "Male",
        diagnosis: "Prostate adenocarcinoma",
        status: "submitted" as const
      },
      {
        name: "Lisa Anderson",
        mrn: "MRN001238",
        dateOfBirth: "1984-07-25",
        sex: "Female",
        diagnosis: "Melanoma of skin",
        status: "in_progress" as const
      },
      {
        name: "Robert Garcia",
        mrn: "MRN001239",
        dateOfBirth: "1963-09-05",
        sex: "Male",
        diagnosis: "Colorectal adenocarcinoma", 
        status: "submitted" as const
      },
      {
        name: "Jennifer Williams",
        mrn: "MRN001240",
        dateOfBirth: "1971-12-08",
        sex: "Female",
        diagnosis: "Ovarian serous carcinoma",
        status: "needs_review" as const
      },
      {
        name: "James Miller",
        mrn: "MRN001241",
        dateOfBirth: "1952-02-28",
        sex: "Male", 
        diagnosis: "Pancreatic ductal adenocarcinoma",
        status: "in_progress" as const
      },
      {
        name: "Maria Gonzalez",
        mrn: "MRN001242",
        dateOfBirth: "1967-06-14",
        sex: "Female",
        diagnosis: "Breast lobular carcinoma",
        status: "completed" as const
      },
      {
        name: "Kevin Lee",
        mrn: "MRN001243",
        dateOfBirth: "1955-10-03",
        sex: "Male",
        diagnosis: "Gastric adenocarcinoma",
        status: "in_progress" as const
      }
    ];

    samplePatients.forEach(patientData => {
      const patient: Patient = {
        id: this.currentId++,
        name: patientData.name,
        mrn: patientData.mrn,
        dateOfBirth: patientData.dateOfBirth,
        sex: patientData.sex,
        diagnosis: patientData.diagnosis,
        status: patientData.status,
        lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      };
      this.patients.set(patient.id, patient);

      // Add sample documents for each patient
      const docTypes: Array<'pathology' | 'clinical_notes' | 'imaging'> = ["pathology", "clinical_notes", "imaging"];
      const numDocs = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numDocs; i++) {
        const docType = docTypes[i % docTypes.length];
        const filename = `${docType}_${patient.mrn}_${i + 1}.pdf`;
        
        // Generate actual medical document content
        const documentContent = {
          patientName: patient.name,
          mrn: patient.mrn,
          dateOfBirth: patient.dateOfBirth,
          diagnosis: patient.diagnosis || "Unknown diagnosis",
          type: docType
        };
        
        // Create the actual document file with .html extension for serving
        const htmlFilename = filename.replace('.pdf', '.html');
        if (docType === 'pathology') {
          this.documentGenerator.generatePathologyReport(documentContent, htmlFilename);
        } else if (docType === 'clinical_notes') {
          this.documentGenerator.generateClinicalNotes(documentContent, htmlFilename);
        } else if (docType === 'imaging') {
          this.documentGenerator.generateImagingReport(documentContent, htmlFilename);
        }
        
        const document: Document = {
          id: this.currentId++,
          patientId: patient.id,
          filename: filename,
          type: docType,
          uploadDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          size: Math.floor(Math.random() * 5000000) + 500000,
          content: `Medical ${docType} document for ${patient.name}. Document content viewable by clicking the filename.`
        };
        this.documents.set(document.id, document);
      }

      // Add sample tumor registry form for each patient
      const form: TumorRegistryForm = {
        id: this.currentId++,
        patientId: patient.id,
        
        // I. PATIENT & DEMOGRAPHIC INFORMATION
        patientName: patient.name,
        dateOfBirth: patient.dateOfBirth,
        sex: patient.sex === "Male" ? "1" : patient.sex === "Female" ? "2" : "9",
        race: this.getSampleRace(),
        ethnicity: this.getSampleEthnicity(),
        addressAtDiagnosis: this.getSampleAddress(),
        countyAtDiagnosis: this.getSampleCounty(),
        socialSecurityNumber: null,
        
        // II. TUMOR IDENTIFICATION
        primarySite: this.getSamplePrimarySite(patient.diagnosis || ""),
        histologicType: null, // Low confidence - leave empty
        behaviorCode: "3", // Malignant
        laterality: this.getSampleLaterality(patient.diagnosis || ""),
        gradeDifferentiation: null, // Low confidence - leave empty
        dateOfDiagnosis: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        diagnosticConfirmation: this.getSampleDiagnosticConfirmation(),
        classOfCase: this.getSampleClassOfCase(),
        sequenceNumber: "00",
        
        // III. STAGING
        clinicalT: this.getSampleTStage(),
        clinicalN: this.getSampleNStage(),
        clinicalM: null, // Low confidence - leave empty
        pathologicT: this.getSampleTStage(),
        pathologicN: null, // Low confidence - leave empty
        pathologicM: this.getSampleMStage(),
        ajccStageGroupClinical: this.getSampleStageGroup(),
        ajccStageGroupPathologic: this.getSampleStageGroup(),
        seerSummaryStage2018: this.getSampleSeerStage(),
        
        // IV. FIRST COURSE OF TREATMENT
        surgeryOfPrimarySite: this.getSampleSurgery(),
        dateOfSurgery: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        radiationTherapy: null, // Low confidence - leave empty
        dateRadiationStarted: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        chemotherapy: "01", // Medium confidence - provide value
        hormoneTherapy: "01",
        immunotherapy: "00",
        
        // V. FOLLOW-UP & OUTCOME
        dateOfLastContact: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        vitalStatus: Math.random() > 0.8 ? "2" : "1", // Mostly alive
        dateOfDeath: null,
        causeOfDeath: null,
        cancerStatus: this.getSampleCancerStatus(),
        
        // VI. ADMINISTRATIVE & QUALITY
        accessionNumber: `ACC${patient.id.toString().padStart(6, '0')}`,
        reportingFacilityId: "12345",
        abstractorId: `ABS${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`,
        dateCaseAbstracted: new Date().toISOString().split('T')[0],
        editChecksPassed: "1",
        recordType: "A",
        
        // Auto-fill confidence scores
        primarySiteConfidence: Math.random() > 0.3 ? "0.98" : "0.95",
        histologyConfidence: Math.random() > 0.2 ? "0.97" : "0.94",
        lastUpdated: new Date()
      };
      this.tumorRegistryForms.set(form.id, form);
    });
  }

  private getSamplePrimarySite(diagnosis: string): string {
    if (diagnosis.includes("breast")) return "Breast";
    if (diagnosis.includes("lung")) return "Lung";
    if (diagnosis.includes("prostate")) return "Prostate";
    if (diagnosis.includes("colorectal") || diagnosis.includes("colon")) return "Colon";
    if (diagnosis.includes("pancreatic")) return "Pancreas";
    if (diagnosis.includes("cervix")) return "Cervix";
    if (diagnosis.includes("melanoma")) return "Skin";
    if (diagnosis.includes("ovarian")) return "Ovary";
    if (diagnosis.includes("gastric")) return "Stomach";
    return "Unknown primary";
  }

  private getSampleSiteCode(diagnosis: string): string {
    if (diagnosis.includes("breast")) return "C50.9";
    if (diagnosis.includes("lung")) return "C34.1";
    if (diagnosis.includes("prostate")) return "C61";
    if (diagnosis.includes("colorectal") || diagnosis.includes("colon")) return "C18.9";
    if (diagnosis.includes("pancreatic")) return "C25.9";
    if (diagnosis.includes("cervix")) return "C53.9";
    if (diagnosis.includes("melanoma")) return "C43.9";
    if (diagnosis.includes("ovarian")) return "C56";
    if (diagnosis.includes("gastric")) return "C16.9";
    return "C80.1";
  }

  private getSampleHistology(diagnosis: string): string {
    if (diagnosis.includes("ductal") || diagnosis.includes("lobular")) return "Adenocarcinoma";
    if (diagnosis.includes("squamous")) return "Squamous cell carcinoma";
    if (diagnosis.includes("melanoma")) return "Melanoma";
    if (diagnosis.includes("adenocarcinoma")) return "Adenocarcinoma";
    if (diagnosis.includes("serous")) return "Serous adenocarcinoma";
    return "Carcinoma, NOS";
  }

  private getSampleHistologyCode(diagnosis: string): string {
    if (diagnosis.includes("ductal")) return "8500/3";
    if (diagnosis.includes("lobular")) return "8520/3";
    if (diagnosis.includes("squamous")) return "8070/3";
    if (diagnosis.includes("melanoma")) return "8720/3";
    if (diagnosis.includes("adenocarcinoma")) return "8140/3";
    if (diagnosis.includes("serous")) return "8441/3";
    return "8010/3";
  }

  // Helper methods for comprehensive cancer registry fields
  private getSampleRace(): string {
    const races = ["01", "02", "96", "03"];
    return races[Math.floor(Math.random() * races.length)];
  }

  private getSampleEthnicity(): string {
    const ethnicities = ["0", "1", "2", "3"];
    return ethnicities[Math.floor(Math.random() * ethnicities.length)];
  }

  private getSampleAddress(): string {
    const addresses = [
      "123 Main St, Anytown, ST 12345",
      "456 Oak Ave, Somewhere, ST 67890", 
      "789 Pine Rd, Elsewhere, ST 54321",
      "321 Elm Dr, Nowhere, ST 98765"
    ];
    return addresses[Math.floor(Math.random() * addresses.length)];
  }

  private getSampleCounty(): string {
    const counties = ["Cook County", "Los Angeles County", "Harris County", "Maricopa County", "Orange County"];
    return counties[Math.floor(Math.random() * counties.length)];
  }

  private getSampleLaterality(diagnosis: string): string {
    if (diagnosis.includes("breast") || diagnosis.includes("lung") || diagnosis.includes("kidney")) {
      return Math.random() > 0.5 ? "1" : "2"; // Right or Left
    }
    return "8"; // Not applicable
  }

  private getSampleGrade(): string {
    const grades = ["1", "2", "3", "4"];
    return grades[Math.floor(Math.random() * grades.length)];
  }

  private getSampleDiagnosticConfirmation(): string {
    const confirmations = ["1", "2", "4", "8"];
    return confirmations[Math.floor(Math.random() * confirmations.length)];
  }

  private getSampleClassOfCase(): string {
    const classes = ["00", "10", "11", "13"];
    return classes[Math.floor(Math.random() * classes.length)];
  }

  private getSampleTStage(): string {
    const stages = ["T1", "T2", "T3", "T4", "TX"];
    return stages[Math.floor(Math.random() * stages.length)];
  }

  private getSampleNStage(): string {
    const stages = ["N0", "N1", "N2", "N3", "NX"];
    return stages[Math.floor(Math.random() * stages.length)];
  }

  private getSampleMStage(): string {
    const stages = ["M0", "M1", "MX"];
    return stages[Math.floor(Math.random() * stages.length)];
  }

  private getSampleStageGroup(): string {
    const stages = ["I", "IA", "IB", "II", "IIA", "IIB", "III", "IIIA", "IIIB", "IIIC", "IV", "IVA", "IVB"];
    return stages[Math.floor(Math.random() * stages.length)];
  }

  private getSampleSeerStage(): string {
    const stages = ["0", "1", "2", "3", "9"];
    return stages[Math.floor(Math.random() * stages.length)];
  }

  private getSampleSurgery(): string {
    const surgeries = ["00", "10", "20", "30", "40", "50", "60", "70", "80", "90"];
    return surgeries[Math.floor(Math.random() * surgeries.length)];
  }

  private getSampleCancerStatus(): string {
    const statuses = ["0", "1", "9"];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.currentId++;
    const patient: Patient = { 
      ...insertPatient, 
      id,
      lastUpdated: new Date()
    };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: number, updateData: Partial<InsertPatient>): Promise<Patient | undefined> {
    const existingPatient = this.patients.get(id);
    if (!existingPatient) return undefined;
    
    const updatedPatient: Patient = { 
      ...existingPatient, 
      ...updateData,
      lastUpdated: new Date()
    };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  async deletePatient(id: number): Promise<boolean> {
    return this.patients.delete(id);
  }

  async getDocumentsByPatientId(patientId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.patientId === patientId);
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentId++;
    const document: Document = { 
      ...insertDocument, 
      id,
      uploadDate: new Date()
    };
    this.documents.set(id, document);
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  async getFormByPatientId(patientId: number): Promise<TumorRegistryForm | undefined> {
    for (const form of this.tumorRegistryForms.values()) {
      if (form.patientId === patientId) {
        return form;
      }
    }
    return undefined;
  }

  async createOrUpdateForm(insertForm: InsertTumorRegistryForm): Promise<TumorRegistryForm> {
    const existingForm = await this.getFormByPatientId(insertForm.patientId);
    
    if (existingForm) {
      const updatedForm: TumorRegistryForm = {
        ...existingForm,
        ...insertForm,
        lastUpdated: new Date()
      };
      this.tumorRegistryForms.set(existingForm.id, updatedForm);
      return updatedForm;
    } else {
      const id = this.currentId++;
      const form: TumorRegistryForm = {
        ...insertForm,
        id,
        lastUpdated: new Date()
      };
      this.tumorRegistryForms.set(id, form);
      return form;
    }
  }

  async getIcdCodes(): Promise<IcdCode[]> {
    return Array.from(this.icdCodes.values());
  }

  async getIcdCode(id: number): Promise<IcdCode | undefined> {
    return this.icdCodes.get(id);
  }

  async createIcdCode(insertCode: InsertIcdCode): Promise<IcdCode> {
    const id = this.currentId++;
    const code: IcdCode = { 
      ...insertCode, 
      id
    };
    this.icdCodes.set(id, code);
    return code;
  }

  async updateIcdCode(id: number, updateData: Partial<InsertIcdCode>): Promise<IcdCode | undefined> {
    const existingCode = this.icdCodes.get(id);
    if (!existingCode) return undefined;
    
    const updatedCode: IcdCode = { 
      ...existingCode, 
      ...updateData
    };
    this.icdCodes.set(id, updatedCode);
    return updatedCode;
  }

  async deleteIcdCode(id: number): Promise<boolean> {
    return this.icdCodes.delete(id);
  }

  async searchIcdCodes(query: string, category?: string): Promise<IcdCode[]> {
    const codes = Array.from(this.icdCodes.values());
    return codes.filter(code => {
      const matchesQuery = query ? (
        code.code.toLowerCase().includes(query.toLowerCase()) ||
        code.description.toLowerCase().includes(query.toLowerCase())
      ) : true;
      const matchesCategory = category ? code.category === category : true;
      return matchesQuery && matchesCategory;
    });
  }

  async getDashboardMetrics() {
    const patients = Array.from(this.patients.values());
    const forms = Array.from(this.tumorRegistryForms.values());
    
    const totalPatients = patients.length;
    const completedReports = patients.filter(p => p.status === "completed").length;
    const pendingReviews = patients.filter(p => p.status === "needs_review").length;
    const errorFlags = Math.floor(Math.random() * 5);
    
    const statusCounts = patients.reduce((acc, patient) => {
      acc[patient.status] = (acc[patient.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));
    
    const monthlySubmissions = [
      { month: "Jan", count: Math.floor(Math.random() * 50) + 10 },
      { month: "Feb", count: Math.floor(Math.random() * 50) + 10 },
      { month: "Mar", count: Math.floor(Math.random() * 50) + 10 },
      { month: "Apr", count: Math.floor(Math.random() * 50) + 10 },
      { month: "May", count: Math.floor(Math.random() * 50) + 10 },
      { month: "Jun", count: Math.floor(Math.random() * 50) + 10 }
    ];
    
    return {
      totalPatients,
      completedReports,
      pendingReviews,
      errorFlags,
      statusDistribution,
      monthlySubmissions
    };
  }
}

export const storage = new MemStorage();