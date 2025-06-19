import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadDialog } from "@/components/ui/upload-dialog";
import { ArrowLeft, Expand, Combine } from "lucide-react";
import { Link } from "wouter";
import { DocumentViewer } from "@/components/patient/document-viewer";
import { ComprehensivePatientForm } from "@/components/patient/comprehensive-patient-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Patient, Document, TumorRegistryForm } from "@/lib/types";

export default function PatientDetail() {
  const params = useParams<{ id: string }>();
  const patientId = parseInt(params.id || "0");
  
  const [showCodes, setShowCodes] = useState(false);
  const [documentPaneExpanded, setDocumentPaneExpanded] = useState(false);
  const [formPaneExpanded, setFormPaneExpanded] = useState(false);

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
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      formData.append('patientId', patientId.toString());
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/documents`] });
    }
  });

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
              <UploadDialog onUpload={(files) => uploadMutation.mutate(files)}>
                <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
                  Upload
                </Button>
              </UploadDialog>
            </div>
          </div>
        </div>
        
        <DocumentViewer documents={documents} />
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
