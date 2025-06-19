import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mrn: text("mrn").notNull().unique(),
  dateOfBirth: text("date_of_birth").notNull(),
  sex: text("sex").notNull(),
  diagnosis: text("diagnosis"),
  status: text("status").notNull().default("in_progress"), // in_progress, completed, needs_review, submitted
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  filename: text("filename").notNull(),
  type: text("type").notNull(), // pathology, clinical_notes, imaging
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  size: integer("size").notNull(),
  content: text("content"), // extracted text content
});

export const tumorRegistryForms = pgTable("tumor_registry_forms", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  
  // I. PATIENT & DEMOGRAPHIC INFORMATION
  patientName: text("patient_name"),
  dateOfBirth: text("date_of_birth"),
  sex: text("sex"), // 1=Male, 2=Female, 3=Other, 9=Unknown
  race: text("race"), // 01=White, 02=Black, 96=Asian, 03=Native American, Custom
  ethnicity: text("ethnicity"), // 0=Non-Hispanic, 1=Mexican, 2=Puerto Rican, 3=Cuban, Custom
  addressAtDiagnosis: text("address_at_diagnosis"),
  countyAtDiagnosis: text("county_at_diagnosis"),
  socialSecurityNumber: text("social_security_number"),
  
  // II. TUMOR IDENTIFICATION
  primarySite: text("primary_site"), // ICD-O-3
  histologicType: text("histologic_type"), // ICD-O-3
  behaviorCode: text("behavior_code"), // 0=Benign, 1=Uncertain, 2=In Situ, 3=Malignant
  laterality: text("laterality"), // 1=Right, 2=Left, 3=Only One Side, 8=Not Applicable
  gradeDifferentiation: text("grade_differentiation"), // 1=Well, 2=Moderate, 3=Poor, 4=Undifferentiated
  dateOfDiagnosis: text("date_of_diagnosis"),
  diagnosticConfirmation: text("diagnostic_confirmation"), // 1=Histology, 2=Clinical, 4=Physician, 8=Radiology
  classOfCase: text("class_of_case"), // 00=Dx&Tx Elsewhere, 10=Dx Only, 11=Dx+Tx, 13=Tx Only
  sequenceNumber: text("sequence_number"),
  
  // III. STAGING
  clinicalT: text("clinical_t"),
  clinicalN: text("clinical_n"),
  clinicalM: text("clinical_m"),
  pathologicT: text("pathologic_t"),
  pathologicN: text("pathologic_n"),
  pathologicM: text("pathologic_m"),
  ajccStageGroupClinical: text("ajcc_stage_group_clinical"),
  ajccStageGroupPathologic: text("ajcc_stage_group_pathologic"),
  seerSummaryStage2018: text("seer_summary_stage_2018"), // 0=In Situ, 1=Localized, 2=Regional, 3=Distant, 9=Unknown
  
  // IV. FIRST COURSE OF TREATMENT
  surgeryOfPrimarySite: text("surgery_of_primary_site"),
  dateOfSurgery: text("date_of_surgery"),
  radiationTherapy: text("radiation_therapy"), // 0=None, 1=Yes, 9=Unknown
  dateRadiationStarted: text("date_radiation_started"),
  chemotherapy: text("chemotherapy"), // 00=None, 01=Yes, 99=Unknown
  hormoneTherapy: text("hormone_therapy"), // 00=None, 01=Yes
  immunotherapy: text("immunotherapy"), // 00=None, 01=Yes
  
  // V. FOLLOW-UP & OUTCOME
  dateOfLastContact: text("date_of_last_contact"),
  vitalStatus: text("vital_status"), // 1=Alive, 2=Dead
  dateOfDeath: text("date_of_death"),
  causeOfDeath: text("cause_of_death"),
  cancerStatus: text("cancer_status"), // 0=No Evidence, 1=Present, 9=Unknown
  
  // VI. ADMINISTRATIVE & QUALITY
  accessionNumber: text("accession_number"),
  reportingFacilityId: text("reporting_facility_id"),
  abstractorId: text("abstractor_id"),
  dateCaseAbstracted: text("date_case_abstracted"),
  editChecksPassed: text("edit_checks_passed"), // 1=Pass, 0=Fail
  recordType: text("record_type"), // A=Abstract, I=Incidence
  
  // Auto-fill confidence scores
  primarySiteConfidence: decimal("primary_site_confidence"),
  histologyConfidence: decimal("histology_confidence"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const icdCodes = pgTable("icd_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // Breast, Lung, Prostate, Colorectal, Pancreas
  codeType: text("code_type").notNull().default("ICD-O-3"), // ICD-O-3 or NAACCR
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  lastUpdated: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadDate: true,
});

export const insertTumorRegistryFormSchema = createInsertSchema(tumorRegistryForms).omit({
  id: true,
  lastUpdated: true,
});

export const insertIcdCodeSchema = createInsertSchema(icdCodes).omit({
  id: true,
  lastUpdated: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type TumorRegistryForm = typeof tumorRegistryForms.$inferSelect;
export type InsertTumorRegistryForm = z.infer<typeof insertTumorRegistryFormSchema>;

export type IcdCode = typeof icdCodes.$inferSelect;
export type InsertIcdCode = z.infer<typeof insertIcdCodeSchema>;
