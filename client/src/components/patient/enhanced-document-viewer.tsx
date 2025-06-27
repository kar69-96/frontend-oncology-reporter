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
      
      console.log('🔍 Enhanced highlighting with exact source text:', cleanSearchText);
      console.log('📄 Content preview:', content.substring(0, 200) + '...');
      
      // Strategy 1: Exact phrase matching (highest priority) - Enhanced for medical precision
      const exactPhraseRegex = new RegExp(`(${cleanSearchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      if (exactPhraseRegex.test(content)) {
        const highlightColor = isPreIdentified ? '#dcfce7' : '#fef3c7';
        const borderColor = isPreIdentified ? '#16a34a' : '#f59e0b';
        
        highlightedContent = content.replace(exactPhraseRegex, 
          `<mark style="background-color: ${highlightColor}; border: 2px solid ${borderColor}; padding: 3px 6px; border-radius: 4px; font-weight: bold; box-shadow: 0 0 8px ${borderColor}50;" id="highlight-exact-${Date.now()}">$1</mark>`
        );
        matchFound = true;
        console.log('✅ EXACT phrase match found (highest confidence):', cleanSearchText);
      }
      
      // Strategy 2: Medical context-aware exact matching
      if (!matchFound) {
        // Look for medical patterns with colons (common in medical reports)
        const medicalPatterns = [
          // "Primary site: Right upper lobe" pattern
          cleanSearchText.replace(/([a-zA-Z\s]+):\s*([a-zA-Z0-9\s,.-]+)/g, '$1:\\s*$2'),
          // "Stage IIA (T2N0M0)" pattern  
          cleanSearchText.replace(/Stage\s+([IVX]+[ABC]?)\s*\(([T]\d[N]\d[M]\d)\)/gi, 'Stage\\s+$1\\s*\\($2\\)'),
          // Measurement patterns "4.2 cm"
          cleanSearchText.replace(/(\d+\.?\d*)\s*(cm|mm|kg|%)/gi, '$1\\s*$2'),
        ];
        
        for (const pattern of medicalPatterns) {
          if (pattern !== cleanSearchText) {
            try {
              const medicalRegex = new RegExp(`(${pattern})`, 'gi');
              if (medicalRegex.test(content)) {
                const highlightColor = isPreIdentified ? '#dcfce7' : '#e0f2fe';
                const borderColor = isPreIdentified ? '#16a34a' : '#0ea5e9';
                
                highlightedContent = content.replace(medicalRegex, 
                  `<mark style="background-color: ${highlightColor}; border: 2px dotted ${borderColor}; padding: 3px 6px; border-radius: 4px; font-weight: bold;" id="highlight-medical-${Date.now()}">$1</mark>`
                );
                matchFound = true;
                console.log('✅ Medical pattern match found:', pattern);
                break;
              }
            } catch (regexError) {
              console.warn('Medical pattern regex error:', regexError);
            }
          }
        }
      }
      
      // Strategy 3: Enhanced fuzzy phrase matching with medical intelligence
      if (!matchFound) {
        const words = cleanSearchText.split(/\s+/);
        if (words.length >= 2) {
          // Try to match 70% of the words in sequence with medical context
          const minWordsRequired = Math.max(2, Math.ceil(words.length * 0.7));
          
          for (let i = 0; i <= words.length - minWordsRequired; i++) {
            const wordSequence = words.slice(i, i + minWordsRequired);
            // Allow medical terms and punctuation between words
            const pattern = wordSequence.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s,:;.-]{1,10}');
            
            try {
              const fuzzyRegex = new RegExp(`(${pattern})`, 'gi');
              if (fuzzyRegex.test(content)) {
                const highlightColor = isPreIdentified ? '#f0f9ff' : '#fef7cd';
                const borderColor = isPreIdentified ? '#3b82f6' : '#eab308';
                
                highlightedContent = content.replace(fuzzyRegex, 
                  `<mark style="background-color: ${highlightColor}; border: 1px dashed ${borderColor}; padding: 2px 4px; border-radius: 3px; font-weight: 600;" id="highlight-fuzzy-${Date.now()}">$1</mark>`
                );
                matchFound = true;
                console.log('✅ Enhanced fuzzy match found:', wordSequence.join(' '));
                break;
              }
            } catch (regexError) {
              console.warn('Fuzzy matching regex error:', regexError);
            }
          }
        }
      }
      
      // Strategy 4: Medical synonym and abbreviation matching (expanded)
      if (!matchFound) {
        const enhancedMedicalSynonyms = {
          'tumor': ['mass', 'lesion', 'neoplasm', 'growth', 'nodule', 'malignancy'],
          'carcinoma': ['cancer', 'malignancy', 'tumor', 'neoplasm', 'adenocarcinoma'],
          'primary': ['main', 'principal', 'initial', 'original', '1st', 'first'],
          'site': ['location', 'position', 'area', 'region', 'anatomic site'],
          'lobe': ['segment', 'section', 'part', 'division'],
          'upper': ['superior', 'top', 'cranial'],
          'lower': ['inferior', 'bottom', 'caudal'],
          'right': ['rt', 'r', 'dextro'],
          'left': ['lt', 'l', 'sinistro'],
          'breast': ['mammary', 'chest', 'pectoral'],
          'lung': ['pulmonary', 'respiratory', 'bronchial'],
          'stage': ['staging', 'staged', 'clinical stage', 'pathologic stage'],
          'grade': ['grading', 'differentiation', 'histologic grade'],
          'metastasis': ['mets', 'metastatic', 'spread', 'secondary'],
          'lymph node': ['ln', 'lymphatic', 'nodal'],
          'positive': ['pos', '+', 'present'],
          'negative': ['neg', '-', 'absent', 'not detected']
        };
        
        const words = cleanSearchText.toLowerCase().split(/\s+/);
        
        for (const word of words) {
          if (word.length < 3) continue;
          
          // Check direct synonyms
          const synonyms = enhancedMedicalSynonyms[word as keyof typeof enhancedMedicalSynonyms] || [];
          for (const synonym of synonyms) {
            const synonymRegex = new RegExp(`\\b(${synonym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
            if (synonymRegex.test(content)) {
              highlightedContent = content.replace(synonymRegex, 
                `<mark style="background-color: #fef3c7; border: 1px dotted #f59e0b; padding: 2px 4px; border-radius: 3px; font-weight: 600;" id="highlight-synonym-${Date.now()}">$1</mark>`
              );
              matchFound = true;
              console.log(`✅ Enhanced medical synonym match: "${word}" → "${synonym}"`);
              break;
            }
          }
          
          if (matchFound) break;
          
          // Check reverse synonyms
          for (const [key, synonymList] of Object.entries(enhancedMedicalSynonyms)) {
            if (synonymList.includes(word)) {
              const keyRegex = new RegExp(`\\b(${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
              if (keyRegex.test(content)) {
                highlightedContent = content.replace(keyRegex, 
                  `<mark style="background-color: #fef3c7; border: 1px dotted #f59e0b; padding: 2px 4px; border-radius: 3px; font-weight: 600;" id="highlight-reverse-synonym-${Date.now()}">$1</mark>`
                );
                matchFound = true;
                console.log(`✅ Reverse synonym match: "${word}" ← "${key}"`);
                break;
              }
            }
          }
          
          if (matchFound) break;
        }
      }
      
      if (!matchFound) {
        console.warn('⚠️ No matches found for enhanced search:', cleanSearchText);
        // Enhanced visual indicator with better guidance
        const indicatorColor = isPreIdentified ? '#dcfce7' : '#fef3c7';
        const borderColor = isPreIdentified ? '#16a34a' : '#f59e0b';
        const statusText = isPreIdentified ? '📍 Pre-identified Source (Exact Text Expected)' : '🔍 Searching for Text';
        
        highlightedContent = `<div style="background-color: ${indicatorColor}; border: 2px solid ${borderColor}; padding: 12px; margin-bottom: 16px; border-radius: 8px; box-shadow: 0 2px 4px ${borderColor}30;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${statusText}</div>
          <div style="font-size: 14px; margin-bottom: 8px;"><strong>Searching for:</strong> "${cleanSearchText}"</div>
          <div style="font-size: 12px; color: #666; line-height: 1.4;">
            The AI extracted this text, but it may appear differently in the original document.<br/>
            • Try using Ctrl+F to search manually<br/>
            • The text might be paraphrased or abbreviated<br/>
            • Check for medical synonyms (tumor/mass, carcinoma/cancer, etc.)
          </div>
        </div>` + highlightedContent;
      } else {
        console.log('✅ Successfully highlighted text with enhanced medical intelligence');
      }
      
      return highlightedContent;
    } catch (error) {
      console.warn('Error in enhanced highlighting, returning original content:', error);
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