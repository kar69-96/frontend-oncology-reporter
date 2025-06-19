import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FileImage, File, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import type { Document } from "@/lib/types";
import { DOCUMENT_TYPES } from "@/lib/constants";

interface DocumentViewerProps {
  documents: Document[];
  highlightText?: {
    documentId: number;
    textContent: string;
  } | null;
  onHighlightClear?: () => void;
}

export function DocumentViewer({ documents, highlightText, onHighlightClear }: DocumentViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

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
        setIsCollapsed(true); // Collapse the selector when document is loaded
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

  // Effect to handle highlighting when field is clicked
  useEffect(() => {
    if (highlightText && documents.length > 0) {
      const targetDocument = documents.find(doc => doc.id === highlightText.documentId);
      if (targetDocument && (!selectedDocument || selectedDocument.id !== targetDocument.id)) {
        loadDocumentContent(targetDocument);
      }
    }
  }, [highlightText, documents, selectedDocument]);

  // Function to highlight text in document content using pattern matching
  const highlightTextInContent = (content: string, searchText: string) => {
    if (!content || !searchText) return content;
    
    // Create multiple search patterns to improve matching accuracy
    const patterns = [
      searchText, // Exact match
      searchText.toLowerCase(), // Lowercase
      searchText.toUpperCase(), // Uppercase
      // Handle common medical abbreviations and variations
      searchText.replace(/([A-Z])(\d+)/g, '$1 $2'), // "T2" -> "T 2"
      searchText.replace(/([a-z])([A-Z])/g, '$1 $2'), // "adenocarcinoma" variations
    ];
    
    let highlightedContent = content;
    
    patterns.forEach(pattern => {
      if (pattern && pattern !== searchText) {
        const regex = new RegExp(`\\b(${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
        highlightedContent = highlightedContent.replace(regex, '<mark class="bg-yellow-200 px-1 py-0.5 rounded font-medium">$1</mark>');
      }
    });
    
    // Primary search with word boundaries for better accuracy
    const mainRegex = new RegExp(`\\b(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
    highlightedContent = highlightedContent.replace(mainRegex, '<mark class="bg-yellow-200 px-1 py-0.5 rounded font-medium">$1</mark>');
    
    return highlightedContent;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Document Selector - Collapsible */}
      {!isCollapsed && (
        <div className="flex-shrink-0">
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
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
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
        </div>
      )}

      {/* Expand/Collapse Button */}
      {isCollapsed && selectedDocument && (
        <div className="flex-shrink-0 p-2 border-b border-gray-200 bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="w-full justify-center"
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            Show Documents
          </Button>
        </div>
      )}

      {/* Document Content Area */}
      <div className={`flex-1 flex flex-col overflow-hidden ${!isCollapsed ? 'border-t border-gray-200' : ''}`}>
        <div className="flex-1 bg-white rounded-lg border m-4 flex flex-col overflow-hidden">
          {loadingContent ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                <p>Loading document...</p>
              </div>
            </div>
          ) : selectedDocument ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-medium text-gray-900">{selectedDocument.filename}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {DOCUMENT_TYPES[selectedDocument.type as keyof typeof DOCUMENT_TYPES]?.label || selectedDocument.type}
                  </Badge>
                </div>
                {!isCollapsed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(true)}
                    className="ml-4"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Hide Documents
                  </Button>
                )}
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                {documentContent ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightText && selectedDocument?.id === highlightText.documentId
                        ? highlightTextInContent(documentContent, highlightText.textContent)
                        : documentContent 
                    }}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4" />
                      <p>Failed to load document content</p>
                    </div>
                  </div>
                )}
                {highlightText && onHighlightClear && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onHighlightClear}
                      className="text-gray-600"
                    >
                      Clear Highlight
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <p>Select a document to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
