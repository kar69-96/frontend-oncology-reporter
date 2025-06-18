import type { User, InsertUser, Patient, InsertPatient, Document, InsertDocument, TumorRegistryForm, InsertTumorRegistryForm, IcdCode, InsertIcdCode } from "../shared/schema";

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

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.documents = new Map();
    this.tumorRegistryForms = new Map();
    this.icdCodes = new Map();
    this.currentId = 1;
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize ICD codes
    const icdData = [
      { code: "C50.9", description: "Malignant neoplasm of breast, unspecified", category: "Breast" },
      { code: "C78.1", description: "Secondary malignant neoplasm of lung", category: "Lung" },
      { code: "C61", description: "Malignant neoplasm of prostate", category: "Prostate" },
      { code: "C18.9", description: "Malignant neoplasm of colon, unspecified", category: "Colorectal" },
      { code: "C25.9", description: "Malignant neoplasm of pancreas, unspecified", category: "Pancreas" }
    ];

    icdData.forEach(data => {
      const icdCode: IcdCode = {
        id: this.currentId++,
        code: data.code,
        description: data.description,
        category: data.category,
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
      const docTypes = ["pathology", "clinical_notes", "imaging"];
      const numDocs = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numDocs; i++) {
        const docType = docTypes[i % docTypes.length];
        const document: Document = {
          id: this.currentId++,
          patientId: patient.id,
          filename: `${docType}_${patient.mrn}_${i + 1}.pdf`,
          type: docType,
          uploadDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          size: Math.floor(Math.random() * 5000000) + 500000,
          content: `Sample ${docType} content for ${patient.name}. This would contain the actual extracted text from the PDF document in a real implementation.`
        };
        this.documents.set(document.id, document);
      }

      // Add sample tumor registry form for each patient
      const form: TumorRegistryForm = {
        id: this.currentId++,
        patientId: patient.id,
        patientName: patient.name,
        medicalRecordNumber: patient.mrn,
        dateOfBirth: patient.dateOfBirth,
        sex: patient.sex,
        primarySite: this.getSamplePrimarySite(patient.diagnosis || ""),
        primarySiteCode: this.getSampleSiteCode(patient.diagnosis || ""),
        histology: this.getSampleHistology(patient.diagnosis || ""),
        histologyCode: this.getSampleHistologyCode(patient.diagnosis || ""),
        grade: Math.random() > 0.5 ? `Grade ${Math.floor(Math.random() * 4) + 1}` : null,
        laterality: Math.random() > 0.5 ? ["Right", "Left", "Bilateral"][Math.floor(Math.random() * 3)] : null,
        behavior: "Malignant",
        clinicalT: Math.random() > 0.3 ? `T${Math.floor(Math.random() * 4) + 1}` : null,
        clinicalN: Math.random() > 0.3 ? `N${Math.floor(Math.random() * 4)}` : null,
        clinicalM: Math.random() > 0.7 ? "M1" : "M0",
        dateOfFirstContact: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dateOfDiagnosis: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        surgeryPerformed: Math.random() > 0.4 ? "Yes" : "No",
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