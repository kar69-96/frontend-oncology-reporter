import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FileImage, File, ChevronRight } from "lucide-react";
import type { Document } from "@/lib/types";
import { DOCUMENT_TYPES } from "@/lib/constants";

interface DocumentViewerProps {
  documents: Document[];
}

export function DocumentViewer({ documents }: DocumentViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);

  const filteredDocuments = documents.filter(doc => 
    activeFilter === "all" || doc.type === activeFilter
  );

  const getDocumentIcon = (type: string) => {
    const config = DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES];
    if (config) {
      switch (config.icon) {
        case "fas fa-file-pdf":
          return <FileText className={`w-5 h-5 ${config.color}`} />;
        case "fas fa-file-medical":
          return <File className={`w-5 h-5 ${config.color}`} />;
        case "fas fa-x-ray":
          return <FileImage className={`w-5 h-5 ${config.color}`} />;
        default:
          return <FileText className="w-5 h-5 text-gray-500" />;
      }
    }
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const loadDocumentContent = async (document: Document) => {
    setLoadingContent(true);
    try {
      const response = await fetch(`/api/documents/${document.filename}`);
      if (response.ok) {
        const data = await response.json();
        setDocumentContent(data.content);
        setSelectedDocument(document);
      } else {
        console.error('Failed to load document content');
        setDocumentContent('<p>Failed to load document content</p>');
      }
    } catch (error) {
      console.error('Error loading document:', error);
      setDocumentContent('<p>Error loading document</p>');
    } finally {
      setLoadingContent(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Filter Tabs */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-2">
          <Button
            variant={activeFilter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("all")}
            className="text-xs font-medium rounded-full"
          >
            All
          </Button>
          <Button
            variant={activeFilter === "clinical_notes" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("clinical_notes")}
            className="text-xs font-medium rounded-full"
          >
            Notes
          </Button>
          <Button
            variant={activeFilter === "pathology" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("pathology")}
            className="text-xs font-medium rounded-full"
          >
            Pathology
          </Button>
          <Button
            variant={activeFilter === "imaging" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("imaging")}
            className="text-xs font-medium rounded-full"
          >
            Imaging
          </Button>
        </div>
      </div>

      {/* Document List */}
      <div className="p-4 space-y-3">
        {filteredDocuments.map((document) => (
          <Card 
            key={document.id}
            className={`border hover:bg-gray-50 cursor-pointer transition-colors ${
              selectedDocument?.id === document.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => loadDocumentContent(document)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getDocumentIcon(document.type)}
                  <div>
                    <button
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadDocumentContent(document);
                      }}
                    >
                      {document.filename}
                    </button>
                    <p className="text-xs text-gray-500">
                      {new Date(document.uploadDate).toLocaleDateString()} • {formatFileSize(document.size)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          No documents available for this filter.
        </div>
      )}

      {/* Document Content Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="bg-white rounded-lg border min-h-96">
          {loadingContent ? (
            <div className="text-center text-gray-400 py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 animate-pulse" />
              <p>Loading document...</p>
            </div>
          ) : selectedDocument ? (
            <div className="h-full">
              <div className="border-b border-gray-200 p-4">
                <h3 className="font-medium text-gray-900">{selectedDocument.filename}</h3>
                <Badge variant="secondary" className="mt-1">
                  {DOCUMENT_TYPES[selectedDocument.type as keyof typeof DOCUMENT_TYPES]?.label || selectedDocument.type}
                </Badge>
              </div>
              <div className="p-4 overflow-y-auto max-h-96">
                {documentContent ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: documentContent }}
                  />
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4" />
                    <p>Failed to load document content</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <FileText className="w-12 h-12 mx-auto mb-4" />
              <p>Select a document to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
