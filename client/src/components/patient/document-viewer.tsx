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
            onClick={() => setSelectedDocument(document)}
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
                        window.open(`/api/documents/${document.filename}`, '_blank');
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
        <div className="bg-gray-50 rounded-lg p-4 min-h-96">
          {selectedDocument ? (
            <div>
              <div className="mb-4">
                <h3 className="font-medium text-gray-900">{selectedDocument.filename}</h3>
                <Badge variant="secondary" className="mt-1">
                  {DOCUMENT_TYPES[selectedDocument.type as keyof typeof DOCUMENT_TYPES]?.label || selectedDocument.type}
                </Badge>
              </div>
              {selectedDocument.content ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {selectedDocument.content}
                  </pre>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4" />
                  <p>Document content not available</p>
                  <p className="text-xs">PDF rendering would be implemented here using PDF.js</p>
                </div>
              )}
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
