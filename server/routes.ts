import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, insertDocumentSchema, insertTumorRegistryFormSchema, insertIcdCodeSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import type { Request } from "express";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const upload = multer({ 
  dest: 'temp/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from public directory with cache-busting for development
  app.use(express.static(path.join(process.cwd(), 'public'), {
    setHeaders: (res, path) => {
      // Force cache invalidation for PDF viewer and other HTML files
      if (path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

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
    console.log('📄 Documents route hit for patient', req.params.patientId);
    try {
      const patientId = parseInt(req.params.patientId);
      const documents = await storage.getDocumentsByPatientId(patientId);
      console.log(`📄 Found ${documents.length} documents for patient ${patientId}:`);
      documents.forEach(doc => {
        console.log(`📄   - ID: ${doc.id}, Filename: ${doc.filename}, Type: ${doc.type}`);
      });
      res.json(documents);
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
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

  // Enhanced document routes for AI processing
  app.put("/api/documents/:id/processing-status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, extractedData, errorMessage } = req.body;
      
      const document = await storage.updateDocumentProcessingStatus(id, status, extractedData, errorMessage);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document processing status" });
    }
  });

  app.put("/api/documents/:id/extracted-data", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { extractedData, confidence } = req.body;
      
      const document = await storage.updateDocumentExtractedData(id, extractedData, confidence);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document extracted data" });
    }
  });

  app.get("/api/documents/backend/:backendId", async (req, res) => {
    try {
      const backendId = req.params.backendId;
      const document = await storage.getDocumentByBackendId(backendId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.put("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDocument(id, validatedData);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid document data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update document" });
      }
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🗑️ Attempting to delete document with ID: ${id}`);
      
      // Check if document exists first
      const document = await storage.getDocument(id);
      console.log(`🗑️ Document found:`, document ? `${document.filename} (ID: ${document.id})` : 'Not found');
      
      const success = await storage.deleteDocument(id);
      if (!success) {
        console.log(`🗑️ Delete failed - document ${id} not found`);
        return res.status(404).json({ message: "Document not found" });
      }
      
      console.log(`🗑️ Successfully deleted document ${id}`);
      res.status(204).send();
    } catch (error) {
      console.error('❌ Delete document error:', error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Debug endpoint to list all documents
  app.get("/api/debug/documents", async (req, res) => {
    try {
      const allPatients = await storage.getPatients();
      const allDocuments = [];
      
      for (const patient of allPatients) {
        const docs = await storage.getDocumentsByPatientId(patient.id);
        allDocuments.push(...docs.map(doc => ({
          id: doc.id,
          patientId: doc.patientId,
          patientName: patient.name,
          filename: doc.filename,
          type: doc.type
        })));
      }
      
      res.json({
        totalDocuments: allDocuments.length,
        documents: allDocuments
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch debug info" });
    }
  });

  // PDF serving endpoint for PDF viewer
  app.get("/api/pdf/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const fs = await import('fs/promises');
      const path = await import('path');
      
      console.log(`[PDF-VIEWER] Serving PDF: ${filename}`);
      
      // Strategy 1: Look in public/documents directory
      const publicPdfPath = path.join(process.cwd(), 'public', 'documents', filename);
      try {
        const pdfBuffer = await fs.readFile(publicPdfPath);
        console.log(`[PDF-VIEWER] ✅ Found PDF in public/documents: ${filename}`);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(pdfBuffer);
        return;
      } catch (publicError) {
        console.log(`[PDF-VIEWER] PDF not found in public/documents: ${filename}`);
      }
      
      // Strategy 2: Look in Python backend temp directory
      try {
        const pythonBackendPath = path.join(process.cwd(), '../Oncology-reporter-API/temp');
        const files = await fs.readdir(pythonBackendPath);
        
        // Find files that end with the target filename (handle UUID prefixes)
        const matchingFile = files.find(file => file.endsWith(filename));
        
        if (matchingFile) {
          const pdfPath = path.join(pythonBackendPath, matchingFile);
          const pdfBuffer = await fs.readFile(pdfPath);
          console.log(`[PDF-VIEWER] ✅ Found PDF in backend temp: ${matchingFile}`);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.send(pdfBuffer);
          return;
        }
      } catch (backendError: any) {
        console.log(`[PDF-VIEWER] Could not access backend temp directory: ${backendError.message}`);
      }
      
      // Strategy 3: Look in Oncology-reporter-API temp directory (alternative path)
      try {
        const altBackendPath = path.join(process.cwd(), 'Oncology-reporter-API/temp');
        const files = await fs.readdir(altBackendPath);
        
        const matchingFile = files.find(file => file.endsWith(filename));
        
        if (matchingFile) {
          const pdfPath = path.join(altBackendPath, matchingFile);
          const pdfBuffer = await fs.readFile(pdfPath);
          console.log(`[PDF-VIEWER] ✅ Found PDF in alt backend temp: ${matchingFile}`);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.send(pdfBuffer);
          return;
        }
      } catch (altBackendError: any) {
        console.log(`[PDF-VIEWER] Could not access alt backend temp directory: ${altBackendError.message}`);
      }
      
      console.log(`[PDF-VIEWER] ❌ PDF not found anywhere: ${filename}`);
      res.status(404).json({ 
        message: `PDF file not found: ${filename}`,
        searched: [
          'public/documents/',
          '../Oncology-reporter-API/temp/',
          'Oncology-reporter-API/temp/'
        ]
      });
    } catch (error) {
      console.error(`[PDF-VIEWER] Error serving PDF ${req.params.filename}:`, error);
      res.status(500).json({ message: "Failed to serve PDF file" });
    }
  });

  // PDF viewer redirect endpoint
  app.get("/api/pdf-viewer/:filename", async (req, res) => {
    const filename = req.params.filename;
    const highlight = req.query.highlight || '';
    const field = req.query.field || '';
    const confidence = req.query.confidence || '0';
    
    const pdfViewerUrl = `/pdf-viewer.html?filename=${encodeURIComponent(filename)}&highlight=${encodeURIComponent(highlight as string)}&field=${encodeURIComponent(field as string)}&confidence=${confidence}`;
    
    console.log(`[PDF-VIEWER] Redirecting to: ${pdfViewerUrl}`);
    res.redirect(302, pdfViewerUrl);
  });

  // Enhanced document serving with robust error handling and auto-repair
  app.get("/api/documents/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const fs = await import('fs/promises');
      const path = await import('path');
      
      console.log(`[DOCUMENT-RESOLVER] Attempting to serve: ${filename}`);
      
      // Strategy 1: Try HTML file from filesystem (preferred for formatted documents)
      const htmlFilename = filename.replace('.pdf', '.html');
      const htmlPath = path.join(process.cwd(), 'public', 'documents', htmlFilename);
      
      try {
        const htmlContent = await fs.readFile(htmlPath, 'utf-8');
        console.log(`[DOCUMENT-RESOLVER] ✅ Found HTML file: ${htmlFilename}`);
        res.json({ content: htmlContent, type: 'html' });
        return;
      } catch (fileError) {
        console.log(`[DOCUMENT-RESOLVER] HTML file not found: ${htmlFilename}`);
      }
      
      // Strategy 2: Try to find PDF files in Python backend temp directory
      if (filename.endsWith('.pdf')) {
        try {
          const pythonBackendPath = path.join(process.cwd(), '../Oncology-reporter-API/temp');
          const files = await fs.readdir(pythonBackendPath);
          
          // Find files that end with the target filename (handle UUID prefixes)
          const matchingFile = files.find(file => file.endsWith(filename));
          
          if (matchingFile) {
            const pdfPath = path.join(pythonBackendPath, matchingFile);
            console.log(`[DOCUMENT-RESOLVER] ✅ Found PDF file: ${matchingFile}`);
            res.json({ 
              content: `PDF Document: ${filename}`, 
              type: 'pdf',
              filepath: pdfPath,
              filename: matchingFile,
              originalFilename: filename
            });
            return;
          }
        } catch (pdfError: any) {
          console.log(`[DOCUMENT-RESOLVER] Could not access Python backend temp directory: ${pdfError.message}`);
        }
      }
      
      // Strategy 3: Check database for document content
      const document = await storage.getDocumentByFilename(filename);
      if (document && document.content) {
        console.log(`[DOCUMENT-RESOLVER] ✅ Found document in database: ${filename}`);
        res.json({ content: document.content, type: 'text' });
        return;
      }
      
      // Strategy 4: Try fuzzy matching for similar filenames
      const allDocuments = await storage.getAllDocuments();
      const similarDocument = findSimilarDocument(filename, allDocuments);
      
      if (similarDocument) {
        console.log(`[DOCUMENT-RESOLVER] ✅ Found similar document: ${filename} -> ${similarDocument.filename}`);
        res.json({ 
          content: similarDocument.content || `Document: ${similarDocument.filename}`,
          type: similarDocument.filename.endsWith('.html') ? 'html' : 'text',
          resolvedFrom: similarDocument.filename,
          confidence: 0.8
        });
        return;
      }
      
      // Strategy 5: Auto-generate missing document based on filename patterns
      const generatedContent = await generateMissingDocument(filename);
      if (generatedContent) {
        console.log(`[DOCUMENT-RESOLVER] ✅ Generated missing document: ${filename}`);
        
        // Save the generated document to prevent future 404s
        const generatedPath = path.join(process.cwd(), 'public', 'documents', htmlFilename);
        await fs.writeFile(generatedPath, generatedContent, 'utf-8');
        
        res.json({ 
          content: generatedContent, 
          type: 'html',
          generated: true,
          message: `Document was missing and has been auto-generated based on available data`
        });
        return;
      }
      
      // Strategy 6: Final fallback - try original filename in public documents
      try {
        const originalPath = path.join(process.cwd(), 'public', 'documents', filename);
        const content = await fs.readFile(originalPath, 'utf-8');
        console.log(`[DOCUMENT-RESOLVER] ✅ Found original file: ${filename}`);
        res.json({ content, type: 'text' });
      } catch (originalFileError) {
        console.log(`[DOCUMENT-RESOLVER] ❌ Document not found anywhere: ${filename}`);
        res.status(404).json({ 
          message: `Document not found: ${filename}`,
          suggestions: await getSuggestedDocuments(filename),
          availableDocuments: allDocuments.map((d: any) => d.filename)
        });
      }
    } catch (error) {
      console.error(`[DOCUMENT-RESOLVER] Error serving document ${req.params.filename}:`, error);
      res.status(500).json({ message: "Failed to serve document" });
    }
  });

  // Helper function to find similar documents using fuzzy matching
  function findSimilarDocument(targetFilename: string, documents: any[]): any | null {
    const target = targetFilename.toLowerCase();
    
    // Extract key components from filename
    const nameMatch = target.match(/([a-z]+)\s*([a-z]+)/);
    if (!nameMatch) return null;
    
    const [, firstName, lastName] = nameMatch;
    
    // Find documents with similar patient names
    for (const doc of documents) {
      const docName = doc.filename.toLowerCase();
      if (docName.includes(firstName) && docName.includes(lastName)) {
        return doc;
      }
    }
    
    // Fallback: find documents with at least one name match
    for (const doc of documents) {
      const docName = doc.filename.toLowerCase();
      if (docName.includes(firstName) || docName.includes(lastName)) {
        return doc;
      }
    }
    
    return null;
  }

  // Helper function to generate missing documents based on patterns
  async function generateMissingDocument(filename: string): Promise<string | null> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      // Extract patient info from filename
      const nameMatch = filename.match(/([a-z]+)\s*([a-z]+)/i);
      if (!nameMatch) return null;
      
      const [, firstName, lastName] = nameMatch;
      const patientName = `${firstName.charAt(0).toUpperCase() + firstName.slice(1)} ${lastName.charAt(0).toUpperCase() + lastName.slice(1)}`;
      
      // Check if we have text files for this patient
      const textFiles = [
        `${firstName}_${lastName}_demographics.txt`,
        `${firstName}_${lastName}_pathology.txt`,
        `${firstName}_${lastName}_clinical.txt`
      ];
      
      let sourceContent = '';
      for (const textFile of textFiles) {
        try {
          const textPath = path.join(process.cwd(), textFile);
          const content = await fs.readFile(textPath, 'utf-8');
          sourceContent += content + '\n\n';
        } catch (e) {
          // File doesn't exist, continue
        }
      }
      
      if (sourceContent.trim()) {
        // Generate HTML document from text content
        const documentType = filename.includes('demographics') ? 'Demographics' : 
                           filename.includes('pathology') ? 'Pathology Report' : 
                           filename.includes('clinical') ? 'Clinical Notes' : 'Medical Document';
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${documentType} - ${patientName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .label { font-weight: bold; color: #333; }
        .auto-generated { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="auto-generated">
        <strong>⚠️ Auto-Generated Document</strong><br>
        This document was automatically generated from available text files because the original PDF was missing.
    </div>
    
    <div class="header">
        <h1>${documentType}</h1>
        <p><strong>Patient:</strong> ${patientName}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="section">
        <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${sourceContent}</pre>
    </div>
</body>
</html>`;
      }
    } catch (error) {
      console.log(`[DOCUMENT-GENERATOR] Could not generate document for ${filename}:`, error);
    }
    
    return null;
  }

  // Helper function to suggest alternative documents
  async function getSuggestedDocuments(filename: string): Promise<string[]> {
    const allDocuments = await storage.getAllDocuments();
    const suggestions: string[] = [];
    
    // Extract patient name from filename
    const nameMatch = filename.match(/([a-z]+)\s*([a-z]+)/i);
    if (nameMatch) {
      const [, firstName, lastName] = nameMatch;
      
      // Find documents for the same patient
      for (const doc of allDocuments) {
        const docName = doc.filename.toLowerCase();
        if ((docName.includes(firstName.toLowerCase()) && docName.includes(lastName.toLowerCase())) ||
            docName.includes(`${firstName.toLowerCase()}_${lastName.toLowerCase()}`)) {
          suggestions.push(doc.filename);
        }
      }
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

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

  app.put("/api/patients/:patientId/form", async (req, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const form = await storage.createOrUpdateForm({
        ...req.body,
        patientId,
      });
      res.json(form);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid form data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update registry form" });
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

  // Upload endpoint DISABLED - frontend uses Python backend directly
  app.post("/api/upload-disabled", upload.single("file"), async (req: Request, res) => {
    try {
      const file = (req as any).file;
      const patientId = req.body.patient_id || req.body.patientId;
      if (!file || !patientId) {
        return res.status(400).json({ message: "Missing file or patient_id" });
      }
      
      // Generate a UUID for the document that Python backend can use
      const { randomUUID } = await import('crypto');
      const documentId = randomUUID();
      
      // Copy file to Python backend directory structure
      const fs = await import('fs');
      const path = await import('path');
      const pythonUploadDir = path.join(process.cwd(), '../Oncology-reporter-API/temp');
      const targetPath = path.join(pythonUploadDir, `${documentId}_${file.originalname}`);
      
      // Ensure directory exists
      await fs.promises.mkdir(pythonUploadDir, { recursive: true });
      
      // Copy file to Python backend location
      await fs.promises.copyFile(file.path, targetPath);
      
      // Create local record with the generated document_id
      const document = await storage.createDocument({
        patientId: parseInt(patientId),
        filename: file.originalname,
        type: req.body.type || "pathology", 
        size: file.size,
        content: null,
        documentId: documentId
      });
      
      res.status(201).json({
        document_id: documentId,
        filename: file.originalname,
        status: "uploaded",
        message: "File uploaded successfully. Use /process/{document_id} to start processing."
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Serve PDF files directly from Python backend
  app.get("/api/pdf/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const fs = await import('fs');
      const path = await import('path');
      
      // Look for PDF files in Python backend temp directory
      const pythonBackendPath = path.join(process.cwd(), '../Oncology-reporter-API/temp');
      const files = await fs.promises.readdir(pythonBackendPath);
      
      // Find files that end with the target filename (handle UUID prefixes)
      const matchingFile = files.find(file => file.endsWith(filename));
      
      if (matchingFile) {
        const pdfPath = path.join(pythonBackendPath, matchingFile);
        
        // Check if file exists
        if (fs.existsSync(pdfPath)) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
          
          // Stream the PDF file
          const fileStream = fs.createReadStream(pdfPath);
          fileStream.pipe(res);
          return;
        }
      }
      
      res.status(404).json({ message: `PDF file not found: ${filename}` });
    } catch (error: any) {
      console.error('Error serving PDF:', error);
      res.status(500).json({ message: "Failed to serve PDF file" });
    }
  });

  // Serve PDF viewer with automatic highlighting capabilities
  app.get("/api/pdf-viewer/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const highlight = req.query.highlight as string || '';
      const field = req.query.field as string || '';
      const confidence = req.query.confidence as string || '0';
      
      // Redirect to the static HTML file with parameters
      const redirectUrl = `/pdf-viewer.html?filename=${encodeURIComponent(filename)}&highlight=${encodeURIComponent(highlight)}&field=${encodeURIComponent(field)}&confidence=${confidence}`;
      res.redirect(redirectUrl);
    } catch (error: any) {
      console.error('Error serving PDF viewer:', error);
      res.status(500).json({ message: "Failed to serve PDF viewer" });
    }
  });

  // Document validation and cleanup endpoint
  app.post("/api/documents/validate-and-repair", async (req, res) => {
    try {
      console.log('[DOCUMENT-VALIDATOR] Starting comprehensive document validation and repair...');
      
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const allDocuments = await storage.getAllDocuments();
      const validationResults = {
        totalDocuments: allDocuments.length,
        validDocuments: 0,
        repairedDocuments: 0,
        failedDocuments: 0,
        generatedDocuments: 0,
        deletedCorruptedDocuments: 0,
        issues: [] as string[],
        repairs: [] as string[]
      };

      for (const document of allDocuments) {
        try {
          console.log(`[DOCUMENT-VALIDATOR] Validating: ${document.filename}`);
          
          // Check if document is corrupted (extremely large size indicates corruption)
          if (document.size > 1000000) { // 1MB threshold
            console.log(`[DOCUMENT-VALIDATOR] ⚠️ Corrupted document detected: ${document.filename} (${document.size} bytes)`);
            
            // Delete corrupted document
            await storage.deleteDocument(document.id);
            validationResults.deletedCorruptedDocuments++;
            validationResults.repairs.push(`Deleted corrupted document: ${document.filename} (${document.size} bytes)`);
            continue;
          }
          
          // Try to access the document content
          const htmlFilename = document.filename.replace('.pdf', '.html');
          const htmlPath = path.join(process.cwd(), 'public', 'documents', htmlFilename);
          
          let documentExists = false;
          
          // Check if HTML version exists
          try {
            await fs.access(htmlPath);
            documentExists = true;
            console.log(`[DOCUMENT-VALIDATOR] ✅ Document exists: ${htmlFilename}`);
          } catch (e) {
            // HTML doesn't exist, check other locations
          }
          
          // Check if PDF exists in Python backend
          if (!documentExists && document.filename.endsWith('.pdf')) {
            try {
              const pythonBackendPath = path.join(process.cwd(), '../Oncology-reporter-API/temp');
              const files = await fs.readdir(pythonBackendPath);
              const matchingFile = files.find(file => file.endsWith(document.filename));
              
              if (matchingFile) {
                documentExists = true;
                console.log(`[DOCUMENT-VALIDATOR] ✅ PDF exists in backend: ${matchingFile}`);
              }
            } catch (e) {
              // Backend not accessible
            }
          }
          
          // Check if document content exists in database
          if (!documentExists && document.content && document.content.length > 100) {
            documentExists = true;
            console.log(`[DOCUMENT-VALIDATOR] ✅ Document content exists in database: ${document.filename}`);
          }
          
          if (!documentExists) {
            console.log(`[DOCUMENT-VALIDATOR] ❌ Missing document: ${document.filename}`);
            validationResults.issues.push(`Missing document: ${document.filename}`);
            
            // Try to auto-generate missing document
            const generatedContent = await generateMissingDocumentForValidation(document.filename);
            if (generatedContent) {
              const generatedPath = path.join(process.cwd(), 'public', 'documents', htmlFilename);
              await fs.writeFile(generatedPath, generatedContent, 'utf-8');
              
              validationResults.generatedDocuments++;
              validationResults.repairs.push(`Auto-generated missing document: ${document.filename}`);
              console.log(`[DOCUMENT-VALIDATOR] ✅ Generated missing document: ${document.filename}`);
            } else {
              validationResults.failedDocuments++;
            }
          } else {
            validationResults.validDocuments++;
          }
          
        } catch (error) {
          console.error(`[DOCUMENT-VALIDATOR] Error validating ${document.filename}:`, error);
          validationResults.failedDocuments++;
          validationResults.issues.push(`Validation error for ${document.filename}: ${error}`);
        }
      }
      
      console.log('[DOCUMENT-VALIDATOR] Validation complete:', validationResults);
      
      res.json({
        success: true,
        message: "Document validation and repair completed",
        results: validationResults
      });
      
    } catch (error) {
      console.error('[DOCUMENT-VALIDATOR] Validation failed:', error);
      res.status(500).json({ 
        success: false,
        message: "Document validation failed", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Enhanced helper function for validation
  async function generateMissingDocumentForValidation(filename: string): Promise<string | null> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      // Extract patient info from filename
      const nameMatch = filename.match(/([a-z]+)\s*([a-z]+)/i);
      if (!nameMatch) return null;
      
      const [, firstName, lastName] = nameMatch;
      const patientName = `${firstName.charAt(0).toUpperCase() + firstName.slice(1)} ${lastName.charAt(0).toUpperCase() + lastName.slice(1)}`;
      
      // Check if we have text files for this patient
      const textFiles = [
        `${firstName}_${lastName}_demographics.txt`,
        `${firstName}_${lastName}_pathology.txt`,
        `${firstName}_${lastName}_clinical.txt`
      ];
      
      let sourceContent = '';
      for (const textFile of textFiles) {
        try {
          const textPath = path.join(process.cwd(), textFile);
          const content = await fs.readFile(textPath, 'utf-8');
          sourceContent += content + '\n\n';
        } catch (e) {
          // File doesn't exist, continue
        }
      }
      
      if (sourceContent.trim()) {
        // Generate HTML document from text content
        const documentType = filename.includes('demographics') ? 'Demographics' : 
                           filename.includes('pathology') ? 'Pathology Report' : 
                           filename.includes('clinical') ? 'Clinical Notes' : 'Medical Document';
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${documentType} - ${patientName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .label { font-weight: bold; color: #333; }
        .auto-generated { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="auto-generated">
        <strong>⚠️ Auto-Generated Document</strong><br>
        This document was automatically generated during system validation because the original was missing.
    </div>
    
    <div class="header">
        <h1>${documentType.toUpperCase()}</h1>
        <p><strong>Patient:</strong> ${patientName}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="section">
        <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${sourceContent}</pre>
    </div>
</body>
</html>`;
      }
    } catch (error) {
      console.log(`[DOCUMENT-GENERATOR] Could not generate document for ${filename}:`, error);
    }
    
    return null;
  }

  // Enhanced source text finding endpoint (Phase 2 of roadmap)
  app.post('/api/documents/:id/find-source', async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { extractedText, fieldId } = req.body;
      
      console.log(`🔍 Finding exact source for document ${documentId}, field ${fieldId}`);
      console.log(`📝 Extracted text: "${extractedText}"`);
      
      // Get document info
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // For PDFs, redirect to PDF viewer with highlighting
      if (document.filename.toLowerCase().endsWith('.pdf')) {
        return res.json({
          sourceMatch: {
            found: false,
            exactMatch: false,
            strategy: 'pdf_redirect',
            confidence: 0.5,
            message: 'PDF documents should be viewed using the PDF viewer for exact source highlighting',
            pdfViewerUrl: `/api/pdf-viewer/${encodeURIComponent(document.filename)}?highlight=${encodeURIComponent(extractedText)}&field=${encodeURIComponent(fieldId)}`
          },
          fieldId,
          documentId,
          timestamp: new Date().toISOString()
        });
      }
      
      // For HTML/text documents, perform enhanced text matching
      const fs = await import('fs/promises');
      const documentPath = path.join(process.cwd(), 'public', 'documents', document.filename);
      let documentContent = '';
      
      try {
        documentContent = await fs.readFile(documentPath, 'utf-8');
      } catch (fileError) {
        console.warn(`⚠️ Could not read document file: ${fileError}`);
        return res.status(404).json({ message: "Document content not accessible" });
      }
      
      // Enhanced medical text matching strategies (following roadmap Phase 2)
      const matchStrategies = [
        {
          name: 'exact',
          search: (content: string, query: string) => {
            const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const matches = [...content.matchAll(regex)];
            return matches.map(match => ({
              text: match[0],
              index: match.index || 0,
              confidence: 1.0,
              context: content.substring(Math.max(0, (match.index || 0) - 50), (match.index || 0) + match[0].length + 50)
            }));
          }
        },
        {
          name: 'medical-contextual',
          search: (content: string, query: string) => {
            const medicalPatterns = [
              query.replace(/([a-zA-Z\s]+):\s*([a-zA-Z0-9\s,.-]+)/g, '$1:\\s*$2'),
              query.replace(/Stage\s+([IVX]+[ABC]?)\s*\(([T]\d[N]\d[M]\d)\)/gi, 'Stage\\s+$1\\s*\\($2\\)'),
              query.replace(/(\d+\.?\d*)\s*(cm|mm|kg|%)/gi, '$1\\s*$2'),
            ];
            
            const matches: any[] = [];
            for (const pattern of medicalPatterns) {
              if (pattern !== query) {
                try {
                  const regex = new RegExp(pattern, 'gi');
                  const patternMatches = [...content.matchAll(regex)];
                  matches.push(...patternMatches.map(match => ({
                    text: match[0],
                    index: match.index || 0,
                    confidence: 0.9,
                    context: content.substring(Math.max(0, (match.index || 0) - 50), (match.index || 0) + match[0].length + 50),
                    strategy: 'medical-pattern'
                  })));
                } catch (regexError) {
                  console.warn('Medical pattern regex error:', regexError);
                }
              }
            }
            return matches;
          }
        }
      ];
      
      // Apply search strategies and find best match
      let bestMatch = null;
      let allMatches: any[] = [];
      
      for (const strategy of matchStrategies) {
        const matches = strategy.search(documentContent, extractedText);
        if (matches.length > 0) {
          allMatches.push(...matches.map(match => ({ ...match, strategy: strategy.name })));
          if (!bestMatch || matches[0].confidence > bestMatch.confidence) {
            bestMatch = { ...matches[0], strategy: strategy.name };
          }
        }
      }
      
      res.json({
        sourceMatch: bestMatch ? {
          found: true,
          exactMatch: bestMatch.confidence >= 0.95,
          text: bestMatch.text,
          context: bestMatch.context,
          position: bestMatch.index,
          strategy: bestMatch.strategy,
          confidence: bestMatch.confidence
        } : {
          found: false,
          exactMatch: false,
          strategy: 'none',
          confidence: 0.0,
          message: 'No matching text found using any strategy'
        },
        allMatches: allMatches.slice(0, 5),
        fieldId,
        documentId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error finding source text:', error);
      res.status(500).json({ message: "Failed to find source text" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
