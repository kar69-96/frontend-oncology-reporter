import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { oncologyAPI } from "@/lib/api-client";
import { mapBackendToFrontend, validateFieldCompleteness } from "@/lib/field-mapping";

export default function APITest() {
  const { toast } = useToast();
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [vectorStats, setVectorStats] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [mappedData, setMappedData] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState("1");
  const [documentId, setDocumentId] = useState("");
  const [processingStatus, setProcessingStatus] = useState<any>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  const testHealthCheck = async () => {
    try {
      const health = await oncologyAPI.healthCheck();
      setHealthStatus(health);
      toast({
        title: "Health Check",
        description: "Backend is healthy!",
      });
    } catch (error) {
      toast({
        title: "Health Check Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const testVectorStats = async () => {
    try {
      const stats = await oncologyAPI.getVectorStoreStats();
      setVectorStats(stats);
      toast({
        title: "Vector Store Stats",
        description: "Stats retrieved successfully!",
      });
    } catch (error) {
      toast({
        title: "Vector Stats Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const testUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await oncologyAPI.uploadDocument(selectedFile, parseInt(patientId));
      setUploadResult(result);
      toast({
        title: "Upload Successful",
        description: `File uploaded: ${result.filename}`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const testProcessing = async () => {
    if (!uploadResult?.document_id) {
      toast({
        title: "No Document to Process",
        description: "Please upload a document first",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await oncologyAPI.processDocument(uploadResult.document_id, parseInt(patientId));
      setProcessingResult(result);
      
      // Test field mapping
      if (result.fields) {
        const mapped = mapBackendToFrontend(result.fields);
        const validation = validateFieldCompleteness(mapped);
        setMappedData({ mapped, validation });
      }
      
      toast({
        title: "Processing Successful",
        description: `Document processed: ${result.document_name}`,
      });
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const testDocumentStorage = async () => {
    if (!documentId) {
      toast({
        title: "No Document ID",
        description: "Please enter a document ID",
        variant: "destructive",
      });
      return;
    }

    try {
      // Test updating processing status
      const statusResult = await oncologyAPI.updateDocumentProcessingStatus(parseInt(documentId), 'processing');
      setProcessingStatus(statusResult);
      
      toast({
        title: "Document Storage Test",
        description: "Processing status updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Document Storage Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const testExtractedDataUpdate = async () => {
    if (!documentId || !processingResult?.fields) {
      toast({
        title: "Missing Data",
        description: "Please process a document first and enter a document ID",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await oncologyAPI.updateDocumentExtractedData(parseInt(documentId), processingResult.fields, 0.85);
      setExtractedData(result);
      
      toast({
        title: "Extracted Data Update",
        description: "Document extracted data updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Extracted Data Update Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">API Integration Test - Phase 2</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Health Check */}
        <Card>
          <CardHeader>
            <CardTitle>Health Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testHealthCheck}>Test Health Check</Button>
            {healthStatus && (
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(healthStatus, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Vector Store Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Vector Store Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testVectorStats}>Get Vector Stats</Button>
            {vectorStats && (
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(vectorStats, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>File Upload Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient-id">Patient ID</Label>
              <Input
                id="patient-id"
                type="number"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Enter patient ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select File</Label>
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.tiff,.bmp"
              />
            </div>
            <Button onClick={testUpload} disabled={!selectedFile}>
              Upload File
            </Button>
            {uploadResult && (
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(uploadResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Document Processing */}
        <Card>
          <CardHeader>
            <CardTitle>Document Processing Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testProcessing} 
              disabled={!uploadResult?.document_id}
            >
              Process Document
            </Button>
            {processingResult && (
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(processingResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Document Storage Test */}
        <Card>
          <CardHeader>
            <CardTitle>Document Storage Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-id">Document ID (Frontend)</Label>
              <Input
                id="document-id"
                type="number"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="Enter document ID"
              />
            </div>
            <Button onClick={testDocumentStorage} disabled={!documentId}>
              Test Processing Status Update
            </Button>
            {processingStatus && (
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(processingStatus, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Extracted Data Update Test */}
        <Card>
          <CardHeader>
            <CardTitle>Extracted Data Update Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testExtractedDataUpdate} 
              disabled={!documentId || !processingResult?.fields}
            >
              Test Extracted Data Update
            </Button>
            {extractedData && (
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(extractedData, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Field Mapping Results */}
      {mappedData && (
        <Card>
          <CardHeader>
            <CardTitle>Field Mapping Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Mapped Fields:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(mappedData.mapped, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Validation Results:</h3>
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(mappedData.validation, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 2 Features Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Phase 2 Features Tested</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Document Storage</h4>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">Processing Status Tracking</Badge>
                <Badge variant="outline" className="text-xs">Extracted Data Storage</Badge>
                <Badge variant="outline" className="text-xs">Confidence Scoring</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Enhanced Viewer</h4>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">Source Text Highlighting</Badge>
                <Badge variant="outline" className="text-xs">Extracted Data Display</Badge>
                <Badge variant="outline" className="text-xs">Processing Status Indicators</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Integration</h4>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">Real-time Status Updates</Badge>
                <Badge variant="outline" className="text-xs">Error Handling</Badge>
                <Badge variant="outline" className="text-xs">Form Auto-fill</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 