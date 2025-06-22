export interface FieldExtraction {
  value?: string;
  code?: string;
  confidence: number;
  source_snippet: string;
  source_document: string;
  source_location: string;
  reasoning: string;
  timestamp?: string;
}

export interface ProcessingResponse {
  document_id: string;
  document_name: string;
  extraction_date: string;
  fields: Record<string, FieldExtraction>;
  processing_time: string;
  total_sections?: number;
  total_chunks?: number;
  error?: string;
}

export interface UploadResponse {
  document_id: string;
  filename: string;
  status: string;
  message: string;
}

export interface StatusResponse {
  document_id: string;
  status: string;
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  services: Record<string, any>;
}

export class OncologyAPIClient {
  private baseUrl = 'http://localhost:5001';
  
  async uploadDocument(file: File, patientId?: number): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (patientId) {
      formData.append('patient_id', patientId.toString());
    }
    
    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async processDocument(documentId: string, patientId?: number): Promise<ProcessingResponse> {
    const body: any = {};
    if (patientId) {
      body.patient_id = patientId;
    }
    
    const response = await fetch(`${this.baseUrl}/process/${documentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`Processing failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getProcessingStatus(documentId: string): Promise<StatusResponse> {
    const response = await fetch(`${this.baseUrl}/status/${documentId}`);
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async healthCheck(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getVectorStoreStats(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/vector-store/stats`);
    
    if (!response.ok) {
      throw new Error(`Vector store stats failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Document Storage Integration Methods
  async updateDocumentProcessingStatus(documentId: number, status: string, extractedData?: any, errorMessage?: string): Promise<any> {
    const response = await fetch(`/api/documents/${documentId}/processing-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, extractedData, errorMessage }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update processing status: ${response.statusText}`);
    }
    
    return response.json();
  }

  async updateDocumentExtractedData(documentId: number, extractedData: any, confidence?: number): Promise<any> {
    const response = await fetch(`/api/documents/${documentId}/extracted-data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ extractedData, confidence }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update extracted data: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getDocumentByBackendId(backendDocumentId: string): Promise<any> {
    const response = await fetch(`/api/documents/backend/${backendDocumentId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }
    
    return response.json();
  }

  async updateDocument(documentId: number, updateData: any): Promise<any> {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update document: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Create a singleton instance
export const oncologyAPI = new OncologyAPIClient(); 