import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadDialog } from "@/components/ui/upload-dialog";
import { ArrowLeft, Expand, Combine, Play } from "lucide-react";
import { Link } from "wouter";
import { EnhancedDocumentViewer } from "@/components/patient/enhanced-document-viewer";
import { ComprehensivePatientForm } from "@/components/patient/comprehensive-patient-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { oncologyAPI } from "@/lib/api-client";
import { mapBackendToFrontend, validateFieldCompleteness, formatForForm } from "@/lib/field-mapping";
import type { Patient, Document, TumorRegistryForm } from "@/lib/types";

export default function PatientDetail() {
  const params = useParams<{ id: string }>();
  const patientId = parseInt(params.id || "0");
  const { toast } = useToast();
  
  const [showCodes, setShowCodes] = useState(false);
  const [documentPaneExpanded, setDocumentPaneExpanded] = useState(false);
  const [formPaneExpanded, setFormPaneExpanded] = useState(false);
  const [highlightText, setHighlightText] = useState<{
    documentId: number;
    textContent: string;
  } | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: [`/api/patients/${patientId}/documents`],
    enabled: !!patientId,
  });

  const { data: form } = useQuery<TumorRegistryForm>({
    queryKey: [`/api/patients/${patientId}/form`],
    enabled: !!patientId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploadPromises = files.map(async (file) => {
        try {
          const uploadResult = await oncologyAPI.uploadDocument(file, patientId);
          setUploadedDocuments(prev => [...prev, uploadResult]);
          return uploadResult;
        } catch (error) {
          console.error('Upload error:', error);
          throw error;
        }
      });
      
      return Promise.all(uploadPromises);
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/documents`] });
      toast({
        title: "Upload Successful",
        description: `${results.length} document(s) uploaded successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const processAllMutation = useMutation({
    mutationFn: async () => {
      setProcessingStatus('processing');
      
      // Process all uploaded documents
      const documentsToProcess = uploadedDocuments.length > 0 ? uploadedDocuments : documents;
      
      if (documentsToProcess.length === 0) {
        throw new Error('No documents to process');
      }

      const results = [];
      
      for (const doc of documentsToProcess) {
        try {
          const documentId = doc.document_id || doc.documentId || doc.id;
          
          // Update processing status to 'processing'
          if (doc.id) {
            await oncologyAPI.updateDocumentProcessingStatus(doc.id, 'processing');
          }
          
          const result = await oncologyAPI.processDocument(documentId, patientId);
          results.push(result);
          
          // Update form with extracted data
          if (result.fields) {
            const mappedData = mapBackendToFrontend(result.fields);
            const formData = formatForForm(mappedData);
            
            // Update the form in the database
            await updateFormWithExtractedData(formData);
            
            // Update document with extracted data and processing status
            if (doc.id) {
              await oncologyAPI.updateDocumentExtractedData(doc.id, result.fields, 0.85); // Default confidence
              await oncologyAPI.updateDocumentProcessingStatus(doc.id, 'completed', result.fields);
            }
          }
        } catch (error) {
          console.error(`Failed to process document ${doc.filename}:`, error);
          
          // Update processing status to 'failed'
          if (doc.id) {
            await oncologyAPI.updateDocumentProcessingStatus(doc.id, 'failed', null, error instanceof Error ? error.message : 'Unknown error');
          }
          
          throw error;
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      setProcessingStatus('completed');
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/form`] });
      toast({
        title: "Processing Completed",
        description: `Successfully processed ${results.length} document(s). Form has been updated with extracted data.`,
      });
    },
    onError: (error: Error) => {
      setProcessingStatus('error');
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Function to update form with extracted data
  const updateFormWithExtractedData = async (formData: Record<string, string>) => {
    try {
      const response = await apiRequest('PUT', `/api/patients/${patientId}/form`, formData);
      
      if (!response.ok) {
        throw new Error('Failed to update form');
      }
      
      return response.json();
    } catch (error) {
      console.error('Form update error:', error);
      throw error;
    }
  };

  const handleFieldSourceClick = (documentId: number, textContent: string) => {
    setHighlightText({ documentId, textContent });
    // Expand document pane if it's collapsed
    if (formPaneExpanded) {
      setFormPaneExpanded(false);
    }
  };

  const handleHighlightClear = () => {
    setHighlightText(null);
  };

  const handleProcessAll = () => {
    if (uploadedDocuments.length === 0 && documents.length === 0) {
      toast({
        title: "No Documents",
        description: "Please upload documents first before processing.",
        variant: "destructive",
      });
      return;
    }
    
    processAllMutation.mutate();
  };

  // Enhanced file upload with processing
  const handleFileUpload = async (files: File[]) => {
    try {
      const uploadResults = await uploadMutation.mutateAsync(files);
      
      // Auto-process if user prefers (you can add a toggle for this)
      const autoProcess = true; // This could be a user preference
      
      if (autoProcess && uploadResults.length > 0) {
        // Process the uploaded documents
        setProcessingStatus('processing');
        
        for (const uploadResult of uploadResults) {
          try {
            // Find the corresponding document in the database
            const dbDocument = documents.find(doc => doc.filename === uploadResult.filename);
            
            // Update processing status to 'processing'
            if (dbDocument?.id) {
              await oncologyAPI.updateDocumentProcessingStatus(dbDocument.id, 'processing');
            }
            
            const result = await oncologyAPI.processDocument(uploadResult.document_id, patientId);
            
            if (result.fields) {
              const mappedData = mapBackendToFrontend(result.fields);
              const formData = formatForForm(mappedData);
              await updateFormWithExtractedData(formData);
              
              // Update document with extracted data and processing status
              if (dbDocument?.id) {
                await oncologyAPI.updateDocumentExtractedData(dbDocument.id, result.fields, 0.85);
                await oncologyAPI.updateDocumentProcessingStatus(dbDocument.id, 'completed', result.fields);
              }
            }
          } catch (error) {
            console.error('Auto-processing error:', error);
            
            // Update processing status to 'failed'
            const dbDocument = documents.find(doc => doc.filename === uploadResult.filename);
            if (dbDocument?.id) {
              await oncologyAPI.updateDocumentProcessingStatus(dbDocument.id, 'failed', null, error instanceof Error ? error.message : 'Unknown error');
            }
          }
        }
        
        setProcessingStatus('completed');
        queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/form`] });
        queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/documents`] });
        
        toast({
          title: "Auto-Processing Completed",
          description: "Documents uploaded and processed. Form updated with extracted data.",
        });
      }
    } catch (error) {
      console.error('Upload and processing error:', error);
    }
  };

  if (isLoading) {
    return <PatientDetailSkeleton />;
  }

  if (!patient) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Patient Not Found</h1>
          <Link href="/patients">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Patients
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const documentPaneWidth = documentPaneExpanded ? "w-full" : formPaneExpanded ? "hidden" : "w-1/2";
  const formPaneWidth = formPaneExpanded ? "w-full" : documentPaneExpanded ? "hidden" : "w-1/2";

  return (
    <div className="flex-1 flex overflow-hidden h-screen">
      {/* Document Viewer */}
      <div className={`${documentPaneWidth} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Documents</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDocumentPaneExpanded(!documentPaneExpanded);
                  if (formPaneExpanded) setFormPaneExpanded(false);
                }}
              >
                {documentPaneExpanded ? <Combine className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleProcessAll}
                disabled={processAllMutation.isPending || (uploadedDocuments.length === 0 && documents.length === 0)}
                className="inline-flex items-center"
              >
                <Play className="w-4 h-4 mr-2" />
                {processAllMutation.isPending ? "Processing..." : "Process All"}
              </Button>
              <UploadDialog onUpload={handleFileUpload}>
                <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
                  Upload
                </Button>
              </UploadDialog>
            </div>
          </div>
          
          {/* Processing Status Indicators */}
          {processingStatus === 'processing' && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg mb-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-600 text-sm">Processing documents...</span>
            </div>
          )}

          {processingStatus === 'completed' && (
            <div className="p-3 bg-green-50 rounded-lg mb-3">
              <span className="text-green-600 text-sm">✓ Documents processed successfully</span>
            </div>
          )}

          {processingStatus === 'error' && (
            <div className="p-3 bg-red-50 rounded-lg mb-3">
              <span className="text-red-600 text-sm">✗ Error processing documents</span>
            </div>
          )}

          {/* Upload Status */}
          {uploadedDocuments.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg mb-3">
              <span className="text-gray-600 text-sm">
                {uploadedDocuments.length} document(s) uploaded and ready for processing
              </span>
            </div>
          )}
        </div>
        
        <EnhancedDocumentViewer 
          documents={documents} 
          highlightText={highlightText}
          onHighlightClear={handleHighlightClear}
        />
      </div>

      {/* Registry Form */}
      <div className={`${formPaneWidth} bg-gray-50 flex flex-col transition-all duration-300 min-h-0`}>
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">
              Registry Form - {patient.name}
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFormPaneExpanded(!formPaneExpanded);
                  if (documentPaneExpanded) setDocumentPaneExpanded(false);
                }}
              >
                {formPaneExpanded ? <Combine className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCodes(!showCodes)}
                className="inline-flex items-center"
              >
                Show Codes
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Auto-saved 30s ago
            </span>
          </div>
        </div>
        
        <ComprehensivePatientForm 
          patient={patient} 
          form={form} 
          showCodes={showCodes}
          onFieldSourceClick={handleFieldSourceClick}
        />
      </div>
    </div>
  );
}

function PatientDetailSkeleton() {
  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-1/2 bg-white border-r border-gray-200 p-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
      <div className="w-1/2 bg-gray-50 p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
