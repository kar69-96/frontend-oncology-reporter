import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, insertDocumentSchema, insertTumorRegistryFormSchema, insertIcdCodeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard routes
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Patient routes
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatient(id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create patient" });
      }
    }
  });

  app.put("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(id, validatedData);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update patient" });
      }
    }
  });

  app.delete("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePatient(id);
      if (!success) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });

  // Document routes
  app.get("/api/patients/:patientId/documents", async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const documents = await storage.getDocumentsByPatientId(patientId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/patients/:patientId/documents", async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        patientId,
      });
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid document data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create document" });
      }
    }
  });

  // Tumor Registry Form routes
  app.get("/api/patients/:patientId/form", async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const form = await storage.getFormByPatientId(patientId);
      res.json(form);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch registry form" });
    }
  });

  app.post("/api/patients/:patientId/form", async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const validatedData = insertTumorRegistryFormSchema.parse({
        ...req.body,
        patientId,
      });
      const form = await storage.createOrUpdateForm(validatedData);
      res.json(form);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid form data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save registry form" });
      }
    }
  });

  // ICD Code routes
  app.get("/api/icd-codes", async (req, res) => {
    try {
      const { search, category } = req.query;
      let codes;
      
      if (search) {
        codes = await storage.searchIcdCodes(search as string, category as string);
      } else {
        codes = await storage.getIcdCodes();
        if (category && category !== "all") {
          codes = codes.filter(code => code.category === category);
        }
      }
      
      res.json(codes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ICD codes" });
    }
  });

  app.post("/api/icd-codes", async (req, res) => {
    try {
      const validatedData = insertIcdCodeSchema.parse(req.body);
      const code = await storage.createIcdCode(validatedData);
      res.status(201).json(code);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ICD code data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create ICD code" });
      }
    }
  });

  app.put("/api/icd-codes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertIcdCodeSchema.partial().parse(req.body);
      const code = await storage.updateIcdCode(id, validatedData);
      if (!code) {
        return res.status(404).json({ message: "ICD code not found" });
      }
      res.json(code);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ICD code data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update ICD code" });
      }
    }
  });

  app.delete("/api/icd-codes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteIcdCode(id);
      if (!success) {
        return res.status(404).json({ message: "ICD code not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ICD code" });
    }
  });

  // Upload endpoint for documents
  app.post("/api/upload", async (req, res) => {
    try {
      // Simple upload simulation - in a real app, you'd handle multipart/form-data
      const { patientId, filename, type, size, content } = req.body;
      
      const document = await storage.createDocument({
        patientId: parseInt(patientId),
        filename: filename || "uploaded_document.pdf",
        type: type || "pathology",
        size: size || 1024000,
        content: content || "Uploaded document content"
      });
      
      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Serve generated medical documents
  app.get("/api/documents/:filename", (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = `./public/documents/${filename}`;
      
      // Serve HTML files with proper content type
      if (filename.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html');
      }
      
      res.sendFile(filePath, { root: process.cwd() }, (err) => {
        if (err) {
          res.status(404).json({ message: "Document not found" });
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to serve document" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
