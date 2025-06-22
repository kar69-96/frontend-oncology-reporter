import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  FileImage, 
  File, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Search
} from "lucide-react";
import type { Document } from "@/lib/types";
import { DOCUMENT_TYPES } from "@/lib/constants";

interface ExtractedField {
  value: string;
  confidence: number;
  sourceSnippet: string;
  sourceLocation: string;
  reasoning: string;
  timestamp?: string;
}

interface DocumentViewerProps {
  documents: Document[];
  highlightText?: {
    documentId: number;
    textContent: string;
  } | null;
  onHighlightClear?: () => void;
  onFieldSourceClick?: (documentId: number, textContent: string) => void;
}

export function EnhancedDocumentViewer({ 
  documents, 
  highlightText, 
  onHighlightClear,
  onFieldSourceClick 
}: DocumentViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [showExtractedData, setShowExtractedData] = useState<boolean>(false);

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

  const getProcessingStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "processing":
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getProcessingStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
        setIsCollapsed(true);
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

  const parseExtractedData = (extractedData: string | null): Record<string, ExtractedField> | null => {
    if (!extractedData) return null;
    try {
      return JSON.parse(extractedData);
    } catch (error) {
      console.error('Failed to parse extracted data:', error);
      return null;
    }
  };

  const handleFieldClick = (fieldName: string, fieldData: ExtractedField) => {
    if (onFieldSourceClick && selectedDocument) {
      onFieldSourceClick(selectedDocument.id, fieldData.sourceSnippet);
    }
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
                      <div className="flex-1">
                        <button
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadDocumentContent(document);
                          }}
                        >
                          {document.filename}
                        </button>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {new Date(document.uploadDate).toLocaleDateString()} • {formatFileSize(document.size)}
                          </p>
                          {document.processingStatus && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getProcessingStatusColor(document.processingStatus)}`}
                            >
                              {getProcessingStatusIcon(document.processingStatus)}
                              <span className="ml-1">{document.processingStatus}</span>
                            </Badge>
                          )}
                        </div>
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
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{selectedDocument.filename}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {DOCUMENT_TYPES[selectedDocument.type as keyof typeof DOCUMENT_TYPES]?.label || selectedDocument.type}
                    </Badge>
                    {selectedDocument.processingStatus && (
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getProcessingStatusColor(selectedDocument.processingStatus)}`}
                      >
                        {getProcessingStatusIcon(selectedDocument.processingStatus)}
                        <span className="ml-1">{selectedDocument.processingStatus}</span>
                      </Badge>
                    )}
                    {selectedDocument.confidence && (
                      <Badge variant="outline" className="text-xs">
                        Confidence: {Math.round(parseFloat(selectedDocument.confidence) * 100)}%
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedDocument.extractedData && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExtractedData(!showExtractedData)}
                      className="text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      {showExtractedData ? "Hide" : "Show"} Extracted Data
                    </Button>
                  )}
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
              </div>

              {/* Extracted Data Panel */}
              {showExtractedData && selectedDocument.extractedData && (
                <div className="border-b border-gray-200 p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">Extracted Data</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(parseExtractedData(selectedDocument.extractedData) || {}).map(([fieldName, fieldData]) => (
                      <Card key={fieldName} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">{fieldName}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(fieldData.confidence * 100)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">{fieldData.value}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFieldClick(fieldName, fieldData)}
                          className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
                        >
                          <Search className="w-3 h-3 mr-1" />
                          View Source
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

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