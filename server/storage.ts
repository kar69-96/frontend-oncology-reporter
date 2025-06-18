import { users, patients, documents, tumorRegistryForms, icdCodes, type User, type InsertUser, type Patient, type InsertPatient, type Document, type InsertDocument, type TumorRegistryForm, type InsertTumorRegistryForm, type IcdCode, type InsertIcdCode } from "@shared/schema";

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

    // Initialize with default ICD codes
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Sample ICD-O-3 codes
    const defaultCodes = [
      { code: "C50.9", description: "Breast, unspecified", category: "topography" },
      { code: "8500/3", description: "Invasive ductal carcinoma, NOS", category: "morphology" },
      { code: "C78.0", description: "Secondary malignant neoplasm of lung", category: "topography" },
      { code: "8140/3", description: "Adenocarcinoma, NOS", category: "morphology" },
      { code: "C34.1", description: "Upper lobe, bronchus or lung", category: "topography" },
    ];

    defaultCodes.forEach(code => {
      const icdCode: IcdCode = {
        id: this.currentId++,
        code: code.code,
        description: code.description,
        category: code.category,
        lastUpdated: new Date(),
      };
      this.icdCodes.set(icdCode.id, icdCode);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values()).sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
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
    const patient = this.patients.get(id);
    if (!patient) return undefined;
    
    const updatedPatient: Patient = { 
      ...patient, 
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
    return Array.from(this.tumorRegistryForms.values()).find(form => form.patientId === patientId);
  }

  async createOrUpdateForm(insertForm: InsertTumorRegistryForm): Promise<TumorRegistryForm> {
    const existingForm = Array.from(this.tumorRegistryForms.values()).find(
      form => form.patientId === insertForm.patientId
    );

    if (existingForm) {
      const updatedForm: TumorRegistryForm = {
        ...existingForm,
        ...insertForm,
        lastUpdated: new Date(),
      };
      this.tumorRegistryForms.set(existingForm.id, updatedForm);
      return updatedForm;
    } else {
      const id = this.currentId++;
      const form: TumorRegistryForm = {
        ...insertForm,
        id,
        lastUpdated: new Date(),
      };
      this.tumorRegistryForms.set(id, form);
      return form;
    }
  }

  async getIcdCodes(): Promise<IcdCode[]> {
    return Array.from(this.icdCodes.values()).sort((a, b) => a.code.localeCompare(b.code));
  }

  async getIcdCode(id: number): Promise<IcdCode | undefined> {
    return this.icdCodes.get(id);
  }

  async createIcdCode(insertCode: InsertIcdCode): Promise<IcdCode> {
    const id = this.currentId++;
    const code: IcdCode = { 
      ...insertCode, 
      id, 
      lastUpdated: new Date() 
    };
    this.icdCodes.set(id, code);
    return code;
  }

  async updateIcdCode(id: number, updateData: Partial<InsertIcdCode>): Promise<IcdCode | undefined> {
    const code = this.icdCodes.get(id);
    if (!code) return undefined;
    
    const updatedCode: IcdCode = { 
      ...code, 
      ...updateData, 
      lastUpdated: new Date() 
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
      const matchesQuery = code.code.toLowerCase().includes(query.toLowerCase()) ||
                          code.description.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !category || category === "all" || code.category === category;
      return matchesQuery && matchesCategory;
    });
  }

  async getDashboardMetrics() {
    const patients = Array.from(this.patients.values());
    const totalPatients = patients.length;
    
    const statusCounts = patients.reduce((acc, patient) => {
      acc[patient.status] = (acc[patient.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completedReports = statusCounts.completed || 0;
    const pendingReviews = statusCounts.needs_review || 0;
    const errorFlags = Math.floor(totalPatients * 0.05); // 5% error rate

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // Mock monthly submissions data
    const monthlySubmissions = [
      { month: "Jan", count: 45 },
      { month: "Feb", count: 51 },
      { month: "Mar", count: 57 },
      { month: "Apr", count: 62 },
    ];

    return {
      totalPatients,
      completedReports,
      pendingReviews,
      errorFlags,
      statusDistribution,
      monthlySubmissions,
    };
  }
}

export const storage = new MemStorage();
