import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Search,
  Trash2,
  AlertTriangle,
  Info
} from "lucide-react";
import type { Document } from "@/lib/types";
import { DOCUMENT_TYPES } from "@/lib/constants";
import type { DocumentNameMapping } from '@/lib/document-name-resolver';

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
    metadata?: {
      fieldName?: string;
      confidence?: number;
      reasoning?: string;
      sourceDocument?: string;
      extractionTimestamp?: string;
      isPreIdentified?: boolean;
      documentMapping?: DocumentNameMapping;
    };
  } | null;
  onHighlightClear?: () => void;
  onFieldSourceClick?: (documentId: number, textContent: string) => void;
  onDocumentDelete?: (documentId: number) => void;
}

export function EnhancedDocumentViewer({ 
  documents, 
  highlightText, 
  onHighlightClear,
  onFieldSourceClick,
  onDocumentDelete 
}: DocumentViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [showExtractedData, setShowExtractedData] = useState<boolean>(false);
  const [documentError, setDocumentError] = useState<string | null>(null);

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
    setDocumentError(null);
    
    try {
      if (!document.filename || typeof document.filename !== 'string') {
        console.warn('Invalid document filename:', document);
        setDocumentError('Invalid document filename');
        setDocumentContent('<p>Invalid document filename</p>');
        setLoadingContent(false);
        return;
      }

      // Check if this is a PDF and we have highlighting text
      const isPDF = document.filename.toLowerCase().endsWith('.pdf');
      
      if (isPDF && highlightText && highlightText.documentId === document.id) {
        // For PDFs with highlighting, show enhanced information panel
        const metadata = highlightText.metadata;
        const documentMapping = metadata?.documentMapping;
        
        let mappingInfo = '';
        if (documentMapping && documentMapping.mappingType !== 'exact') {
          mappingInfo = `
            <div style="background: #f3f4f6; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">
                <strong>Document Resolution:</strong> ${documentMapping.mappingType} match (${Math.round(documentMapping.confidence * 100)}% confidence)
              </div>
              <div style="font-size: 12px; color: #6b7280;">
                "${metadata?.sourceDocument}" → "${documentMapping.actualFilename}"
              </div>
            </div>
          `;
        }
        
        const pdfViewerUrl = `/api/pdf-viewer/${encodeURIComponent(document.filename)}?highlight=${encodeURIComponent(highlightText.textContent)}&field=${encodeURIComponent(metadata?.fieldName || 'unknown')}&confidence=${metadata?.confidence || 0}`;
        
        setDocumentContent(`
          <div style="padding: 20px; text-align: center; background: #f8f9fa; border-radius: 8px; border: 2px solid #28a745;">
            <div style="font-size: 18px; font-weight: bold; color: #28a745; margin-bottom: 10px;">
              ✅ Pre-identified Source Located
            </div>
            ${mappingInfo}
            <div style="font-size: 14px; color: #666; margin-bottom: 15px;">
              <strong>Field:</strong> ${metadata?.fieldName || 'Unknown'}<br/>
              <strong>Confidence:</strong> ${Math.round((metadata?.confidence || 0) * 100)}%<br/>
              <strong>Text to Find:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${highlightText.textContent}</code>
              ${metadata?.reasoning ? `<br/><strong>Reasoning:</strong> ${metadata.reasoning}` : ''}
            </div>
            <button 
              onclick="window.open('${pdfViewerUrl}', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')"
              style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: bold;"
              onmouseover="this.style.background='#218838'"
              onmouseout="this.style.background='#28a745'"
            >
              🔍 Open PDF with Auto-Highlighting
            </button>
            <div style="font-size: 12px; color: #666; margin-top: 10px;">
              The PDF will open in a new window with the text automatically highlighted and scrolled to.
            </div>
          </div>
        `);
        setSelectedDocument(document);
        setIsCollapsed(true);
        setLoadingContent(false);
        return;
      }

      // For regular PDFs without highlighting, show standard PDF viewer
      if (isPDF) {
        const pdfUrl = `/api/pdf/${encodeURIComponent(document.filename)}`;
        setDocumentContent(`
          <div style="padding: 20px; text-align: center; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;">
            <div style="font-size: 16px; font-weight: bold; color: #495057; margin-bottom: 10px;">
              📄 PDF Document
            </div>
            <div style="font-size: 14px; color: #666; margin-bottom: 15px;">
              <strong>File:</strong> ${document.filename}
            </div>
            <button 
              onclick="window.open('${pdfUrl}', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes')"
              style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: bold;"
              onmouseover="this.style.background='#0056b3'"
              onmouseout="this.style.background='#007bff'"
            >
              📖 Open PDF
            </button>
            <div style="font-size: 12px; color: #666; margin-top: 10px;">
              The PDF will open in a new window for better viewing.
            </div>
          </div>
        `);
        setSelectedDocument(document);
        setIsCollapsed(true);
        setLoadingContent(false);
        return;
      }

      // For non-PDF files, use the regular document endpoint
      const response = await fetch(`/api/documents/${document.filename}`);
      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          setDocumentContent(data.content || text);
        } catch (jsonError) {
          console.warn('Response is not valid JSON, treating as plain text:', jsonError);
          setDocumentContent(text);
        }
        setSelectedDocument(document);
        setIsCollapsed(true);
      } else {
        const errorText = `Failed to load document content (${response.status}: ${response.statusText})`;
        console.error(errorText);
        setDocumentError(errorText);
        setDocumentContent(`<div style="padding: 20px; text-align: center; color: #dc3545;">
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">⚠️ Document Load Error</div>
          <div style="font-size: 14px; margin-bottom: 15px;">${errorText}</div>
          <div style="font-size: 12px; color: #6c757d;">
            Document: ${document.filename}<br/>
            Please check if the document exists and is accessible.
          </div>
        </div>`);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDocumentError(errorMessage);
      setDocumentContent(`<div style="padding: 20px; text-align: center; color: #dc3545;">
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">⚠️ Document Load Error</div>
        <div style="font-size: 14px; margin-bottom: 15px;">Error loading document: ${errorMessage}</div>
        <div style="font-size: 12px; color: #6c757d;">
          Document: ${document.filename}<br/>
          Please try refreshing the page or contact support if the issue persists.
        </div>
      </div>`);
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

  // Text highlighting function
  const highlightTextInContent = (content: string, searchText: string): string => {
    if (!searchText || !content) return content;
    
    try {
      const isPreIdentified = highlightText?.metadata?.isPreIdentified || false;
      const documentMapping = highlightText?.metadata?.documentMapping;
      
      // Clean and prepare search text
      const cleanSearchText = searchText.trim();
      let highlightedContent = content;
      let matchFound = false;
      
      // Strategy 1: Try exact phrase match first (highest priority)
      const exactPhraseRegex = new RegExp(`(${cleanSearchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      if (exactPhraseRegex.test(content)) {
        const highlightColor = isPreIdentified ? '#dcfce7' : '#fef3c7';
        const borderColor = isPreIdentified ? '#16a34a' : '#f59e0b';
        
        highlightedContent = content.replace(exactPhraseRegex, 
          `<mark style="background-color: ${highlightColor}; border: 1px solid ${borderColor}; padding: 2px 4px; border-radius: 3px; font-weight: bold;" id="highlight-exact-${Date.now()}">$1</mark>`
        );
        matchFound = true;
        console.log('✅ Exact phrase match found:', cleanSearchText);
      }
      
      // Strategy 2: If no exact match, try case-insensitive phrase match
      if (!matchFound) {
        const caseInsensitiveRegex = new RegExp(`(${cleanSearchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        if (caseInsensitiveRegex.test(content)) {
          const highlightColor = isPreIdentified ? '#dcfce7' : '#fef3c7';
          const borderColor = isPreIdentified ? '#16a34a' : '#f59e0b';
          
          highlightedContent = content.replace(caseInsensitiveRegex, 
            `<mark style="background-color: ${highlightColor}; border: 1px solid ${borderColor}; padding: 2px 4px; border-radius: 3px; font-weight: bold;" id="highlight-case-${Date.now()}">$1</mark>`
          );
          matchFound = true;
          console.log('✅ Case-insensitive phrase match found:', cleanSearchText);
        }
      }
      
      // Strategy 3: Try partial phrase matching (for long phrases)
      if (!matchFound && cleanSearchText.length > 20) {
        // Split into meaningful chunks and try to match larger portions
        const words = cleanSearchText.split(/\s+/);
        if (words.length >= 3) {
          // Try matching 3+ consecutive words
          for (let i = 0; i <= words.length - 3; i++) {
            const phrase = words.slice(i, i + 3).join('\\s+');
            const phraseRegex = new RegExp(`(${phrase})`, 'gi');
            
            if (phraseRegex.test(content)) {
              const highlightColor = isPreIdentified ? '#dcfce7' : '#fef3c7';
              const borderColor = isPreIdentified ? '#16a34a' : '#f59e0b';
              
              highlightedContent = content.replace(phraseRegex, 
                `<mark style="background-color: ${highlightColor}; border: 1px solid ${borderColor}; padding: 2px 4px; border-radius: 3px; font-weight: bold;" id="highlight-partial-${Date.now()}">$1</mark>`
              );
              matchFound = true;
              console.log('✅ Partial phrase match found:', words.slice(i, i + 3).join(' '));
              break;
            }
          }
        }
      }
      
      // Strategy 4: Try key terms matching (only if phrase matching fails)
      if (!matchFound) {
        // Extract meaningful terms (longer than 3 characters, not common words)
        const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);
        const meaningfulTerms = cleanSearchText
          .split(/\s+/)
          .filter(word => word.length > 3 && !stopWords.has(word.toLowerCase()))
          .slice(0, 3); // Limit to first 3 meaningful terms
        
        if (meaningfulTerms.length > 0) {
          // Create a regex that matches any of the meaningful terms
          const termsPattern = meaningfulTerms.map(term => 
            term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          ).join('|');
          
          const termsRegex = new RegExp(`\\b(${termsPattern})\\b`, 'gi');
          const matches = content.match(termsRegex);
          
          if (matches && matches.length > 0) {
            const highlightColor = isPreIdentified ? '#e8f5e8' : '#fff9e6'; // Lighter colors for partial matches
            const borderColor = isPreIdentified ? '#22c55e' : '#eab308';
            
            highlightedContent = content.replace(termsRegex, 
              `<mark style="background-color: ${highlightColor}; border: 1px solid ${borderColor}; padding: 1px 3px; border-radius: 3px;" id="highlight-terms-${Date.now()}">$1</mark>`
            );
            matchFound = true;
            console.log('✅ Key terms match found:', matches.join(', '));
          }
        }
      }
      
      // Add status indicator
      if (!matchFound) {
        console.warn('⚠️ No matches found for:', cleanSearchText);
        const indicatorColor = isPreIdentified ? '#dcfce7' : '#fef3c7';
        const borderColor = isPreIdentified ? '#16a34a' : '#f59e0b';
        const statusText = isPreIdentified ? '📍 Pre-identified source location' : '🔍 Searching for text';
        
        let mappingInfo = '';
        if (documentMapping && documentMapping.mappingType !== 'exact') {
          mappingInfo = `<br><small style="color: #6b7280;">Document resolved via ${documentMapping.mappingType} match (${Math.round(documentMapping.confidence * 100)}% confidence)</small>`;
        }
        
        highlightedContent = `<div style="background-color: ${indicatorColor}; border: 1px solid ${borderColor}; padding: 8px; margin-bottom: 16px; border-radius: 6px;">
          <strong>${statusText}:</strong> "${cleanSearchText}"<br>
          <small style="color: #92400e;">Text may appear differently in the original document. Use Ctrl+F to search manually.</small>
          ${mappingInfo}
        </div>` + highlightedContent;
      } else {
        console.log('✅ Successfully highlighted text in document');
        
        // Add document mapping info if available
        if (documentMapping && documentMapping.mappingType !== 'exact') {
          const mappingColor = documentMapping.confidence > 0.7 ? '#e0f2fe' : '#fff3e0';
          const mappingBorder = documentMapping.confidence > 0.7 ? '#0288d1' : '#f57c00';
          
          highlightedContent = `<div style="background-color: ${mappingColor}; border: 1px solid ${mappingBorder}; padding: 8px; margin-bottom: 16px; border-radius: 6px;">
            <strong>📍 Document Resolution:</strong> ${documentMapping.mappingType} match (${Math.round(documentMapping.confidence * 100)}% confidence)<br>
            <small style="color: #455a64;">Original: "${highlightText?.metadata?.sourceDocument}" → Actual: "${documentMapping.actualFilename}"</small>
          </div>` + highlightedContent;
        }
        
        // Auto-scroll to highlighted text
        setTimeout(() => {
          const highlightElements = document.querySelectorAll('[id^="highlight-"]');
          if (highlightElements.length > 0) {
            const firstHighlight = highlightElements[0];
            firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Also flash the highlight briefly to draw attention
            const originalStyle = firstHighlight.style.cssText;
            firstHighlight.style.cssText += '; animation: flash 1s ease-in-out;';
            
            // Add flash animation if not already present
            if (!document.querySelector('#flash-animation-style')) {
              const style = document.createElement('style');
              style.id = 'flash-animation-style';
              style.textContent = `
                @keyframes flash {
                  0% { transform: scale(1); }
                  50% { transform: scale(1.05); box-shadow: 0 0 10px rgba(34, 197, 94, 0.5); }
                  100% { transform: scale(1); }
                }
              `;
              document.head.appendChild(style);
            }
            
            console.log(`✅ Auto-scrolled to first highlight (${highlightElements.length} total matches)`);
          }
        }, 200);
      }
      
      return highlightedContent;
    } catch (error) {
      console.warn('Error highlighting text, returning original content:', error);
      return content;
    }
  };

  const parseExtractedData = (extractedData: string | null): Record<string, ExtractedField> | null => {
    if (!extractedData) return null;
    if (typeof extractedData !== 'string') return null;
    
    try {
      const cleanedData = extractedData.trim();
      if (!cleanedData.startsWith('{') && !cleanedData.startsWith('[')) {
        return null;
      }
      return JSON.parse(cleanedData);
    } catch (error) {
      console.warn('Failed to parse extracted data, skipping:', error);
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
                className={`border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors group ${
                  selectedDocument?.id === document.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => loadDocumentContent(document)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
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
                        <p className="text-xs text-gray-500">
                          {new Date(document.uploadDate).toLocaleDateString()} • {formatFileSize(document.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={`text-xs ${DOCUMENT_TYPES[document.type as keyof typeof DOCUMENT_TYPES]?.color || 'bg-gray-100 text-gray-800'}`}
                        variant="secondary"
                      >
                        {DOCUMENT_TYPES[document.type as keyof typeof DOCUMENT_TYPES]?.label || document.type}
                      </Badge>
                      {onDocumentDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDocumentDelete(document.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredDocuments.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No documents available for this filter.
              </div>
            )}
          </div>
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
        {selectedDocument ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Document Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 truncate">
                    {selectedDocument.filename}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      {DOCUMENT_TYPES[selectedDocument.type as keyof typeof DOCUMENT_TYPES]?.label || selectedDocument.type}
                    </Badge>
                    {highlightText && selectedDocument.id === highlightText.documentId && (
                      <Badge 
                        variant="default" 
                        className={
                          highlightText.metadata?.isPreIdentified 
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-yellow-100 text-yellow-800 border-yellow-300"
                        }
                      >
                        {highlightText.metadata?.isPreIdentified ? (
                          <>
                            ✅ Located: {highlightText.metadata.fieldName}
                            {highlightText.metadata.confidence && (
                              <span className="ml-1 text-xs">
                                ({Math.round(highlightText.metadata.confidence * 100)}% confidence)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            🔍 Highlighting: "{highlightText.textContent.length > 30 ? highlightText.textContent.substring(0, 30) + '...' : highlightText.textContent}"
                          </>
                        )}
                      </Badge>
                    )}
                    {documentError && (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Load Error
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
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {loadingContent ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading document...</p>
                  </div>
                </div>
              ) : documentContent ? (
                <div className="prose prose-sm max-w-none">
                  {documentContent.includes('<iframe') ? (
                    // Render iframe content (for PDF viewer) directly
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: documentContent
                      }}
                    />
                  ) : documentContent.includes('<') ? (
                    // Render HTML content with highlighting
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: highlightText && selectedDocument?.id === highlightText.documentId
                          ? highlightTextInContent(documentContent, highlightText.textContent)
                          : documentContent 
                      }}
                    />
                  ) : (
                    // Render plain text content with highlighting
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {highlightText && selectedDocument?.id === highlightText.documentId
                        ? highlightTextInContent(documentContent, highlightText.textContent)
                        : documentContent}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4" />
                    <p>Failed to load document content</p>
                    {documentError && (
                      <p className="text-sm text-red-600 mt-2">{documentError}</p>
                    )}
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
  );
} 