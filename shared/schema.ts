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
  // Patient Demographics
  patientName: text("patient_name"),
  medicalRecordNumber: text("medical_record_number"),
  dateOfBirth: text("date_of_birth"),
  sex: text("sex"),
  // Tumor Information
  primarySite: text("primary_site"),
  primarySiteCode: text("primary_site_code"),
  histology: text("histology"),
  histologyCode: text("histology_code"),
  grade: text("grade"),
  laterality: text("laterality"),
  behavior: text("behavior"),
  // Staging Information
  clinicalT: text("clinical_t"),
  clinicalN: text("clinical_n"),
  clinicalM: text("clinical_m"),
  // Treatment Information
  dateOfFirstContact: text("date_of_first_contact"),
  dateOfDiagnosis: text("date_of_diagnosis"),
  surgeryPerformed: text("surgery_performed"),
  // Auto-fill confidence scores
  primarySiteConfidence: decimal("primary_site_confidence"),
  histologyConfidence: decimal("histology_confidence"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const icdCodes = pgTable("icd_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // topography, morphology
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
