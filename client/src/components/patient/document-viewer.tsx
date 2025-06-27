import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FileImage, File, ChevronRight, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { Document } from "@/lib/types";
import { DOCUMENT_TYPES } from "@/lib/constants";

interface DocumentViewerProps {
  documents: Document[];
  highlightText?: {
    documentId: number;
    textContent: string;
    metadata?: {
      fieldName: string;
      confidence: number;
      reasoning: string;
      sourceDocument: string;
      extractionTimestamp?: string;
      isPreIdentified?: boolean;
    };
  } | null;
  onHighlightClear?: () => void;
  onDocumentDelete?: (documentId: number) => void;
}

export function DocumentViewer({ documents, highlightText, onHighlightClear, onDocumentDelete }: DocumentViewerProps) {
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
      const response = await fetch(`http://localhost:8001/api/documents/${document.filename}`);
      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          setDocumentContent(data.content || text);
        } catch (jsonError) {
          setDocumentContent(text);
        }
        setSelectedDocument(document);
        setIsCollapsed(true);
      } else {
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

  // Effect to scroll to highlighted text after content is loaded
  useEffect(() => {
    if (highlightText && documentContent && selectedDocument?.id === highlightText.documentId) {
      // Wait a bit for the content to render
      setTimeout(() => {
        // For non-iframe content, try to scroll to the highlighted element
        if (!documentContent.includes('<html>') && !documentContent.includes('<!DOCTYPE html>')) {
          // Try multiple approaches to find and scroll to highlighted text
          const scrollToHighlight = () => {
            console.log('🎯 Starting scroll to highlight process...');
            console.log('📋 Search text:', highlightText?.textContent);
            console.log('📄 Document content length:', documentContent?.length || 0);
            
            // Strategy 1: Try to find the element with ID
            const firstHighlight = document.getElementById('first-highlight');
            console.log('🔍 First highlight element:', firstHighlight ? 'Found' : 'Not found');
            if (firstHighlight) {
              console.log('✅ Found first highlight element, scrolling...');
              firstHighlight.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
              });
              return true;
            }
            
            // Strategy 2: Try to find the search indicator (when no matches found)
            const searchIndicator = document.getElementById('search-indicator');
            console.log('🔍 Search indicator element:', searchIndicator ? 'Found' : 'Not found');
            if (searchIndicator) {
              console.log('✅ Found search indicator, scrolling to top...');
              searchIndicator.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
              });
              return true;
            }
            
            // Strategy 3: Try to find any mark elements
            const markElements = document.querySelectorAll('mark');
            console.log('🔍 Mark elements found:', markElements.length);
            if (markElements.length > 0) {
              console.log('✅ Found mark elements, scrolling to first...');
              markElements[0].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
              });
              return true;
            }
            
            // Strategy 4: Try fuzzy text-based scrolling with multiple search strategies
            const documentContainer = document.querySelector('[dangerouslySetInnerHTML]') || 
                                    document.querySelector('.document-content') ||
                                    document.querySelector('[data-document-content]');
            
            console.log('🔍 Document container:', documentContainer ? 'Found' : 'Not found');
            console.log('🔍 Container type:', documentContainer?.tagName || 'None');
            console.log('🔍 Container text length:', documentContainer?.textContent?.length || 0);
                                    
            if (documentContainer && highlightText?.textContent) {
              console.log('🎯 Trying enhanced text-based scrolling...');
              const searchText = highlightText.textContent.toLowerCase().trim();
              const containerText = documentContainer.textContent?.toLowerCase() || '';
              
              console.log('🔍 Search text length:', searchText.length);
              console.log('🔍 Container text preview:', containerText.substring(0, 100) + '...');
              
              // Try multiple search approaches
              const searchVariations = [
                searchText, // Original text
                searchText.replace(/[.,;:!?]/g, ''), // Remove punctuation
                searchText.split(' ').slice(0, 3).join(' '), // First 3 words
                searchText.split(' ').slice(-3).join(' '), // Last 3 words
                ...searchText.split(' ').filter(word => word.length > 3) // Individual significant words
              ];
              
              console.log('🔍 Search variations:', searchVariations.length);
              
              for (const variation of searchVariations) {
                if (variation.length < 3) continue;
                
                const textIndex = containerText.indexOf(variation);
                console.log(`🔍 Checking variation "${variation}":`, textIndex !== -1 ? `Found at ${textIndex}` : 'Not found');
                
                if (textIndex !== -1) {
                  // Calculate scroll position
                  const scrollPercentage = textIndex / containerText.length;
                  const containerHeight = documentContainer.scrollHeight;
                  const scrollPosition = scrollPercentage * containerHeight;
                  
                  console.log(`✅ Found text variation "${variation}" at position:`, scrollPosition, 'of', containerHeight);
                  documentContainer.scrollTo({
                    top: Math.max(0, scrollPosition - 200), // Offset to center better
                    behavior: 'smooth'
                  });
                  return true;
                }
              }
              
              console.log('⚠️ Text not found, but document container exists - showing at top');
              documentContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
              });
              return true;
            }
            
            console.warn('❌ Could not find text to scroll to - no suitable container or content found');
            console.log('🔍 Debug info:');
            console.log('  - highlightText exists:', !!highlightText);
            console.log('  - highlightText.textContent:', highlightText?.textContent);
            console.log('  - documentContent exists:', !!documentContent);
            console.log('  - documentContent length:', documentContent?.length || 0);
            console.log('  - DOM elements with dangerouslySetInnerHTML:', document.querySelectorAll('[dangerouslySetInnerHTML]').length);
            console.log('  - DOM elements with class document-content:', document.querySelectorAll('.document-content').length);
            console.log('  - All mark elements:', document.querySelectorAll('mark').length);
            console.log('  - All elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            
            return false;
          };
          
          // Try scrolling immediately and then retry after a short delay
          if (!scrollToHighlight()) {
            setTimeout(scrollToHighlight, 500);
          }
        }
        // For iframe content, we'll add a visual indicator instead since we can't access iframe content
      }, 1000);
    }
  }, [highlightText, documentContent, selectedDocument]);

  // Enhanced function to highlight text in document content
  const highlightTextInContent = (content: string, searchText: string) => {
    if (!content || !searchText) return content;
    
    try {
      // Clean up the search text
      const cleanSearchText = searchText.trim();
      if (cleanSearchText.length < 2) return content;
      
      // Determine if this is pre-identified source or search-based
      const isPreIdentified = highlightText?.metadata?.isPreIdentified || false;
      const highlightColor = isPreIdentified ? '#bbf7d0' : '#fef08a'; // Green for pre-identified, yellow for search
      const textColor = isPreIdentified ? '#166534' : '#854d0e'; // Dark green for pre-identified, dark yellow for search
      
      console.log('🔍 Highlighting search text:', cleanSearchText);
      console.log('📄 Content preview:', content.substring(0, 200) + '...');
      console.log('🎯 Pre-identified source:', isPreIdentified);
      
      let highlightedContent = content;
      let matchFound = false;
      
      // Strategy 1: Exact phrase matching (highest priority)
      const exactRegex = new RegExp(`(${cleanSearchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      if (exactRegex.test(content)) {
        highlightedContent = highlightedContent.replace(exactRegex, (match) => {
          if (!matchFound) {
            matchFound = true;
            return `<mark id="first-highlight" style="background-color: ${highlightColor}; padding: 2px 4px; border-radius: 3px; font-weight: 600; color: ${textColor};">${match}</mark>`;
          }
          return `<mark style="background-color: ${highlightColor}; padding: 2px 4px; border-radius: 3px; font-weight: 600; color: ${textColor};">${match}</mark>`;
        });
        console.log('✅ Exact phrase match found:', cleanSearchText);
      }
      
      // Strategy 2: Fuzzy phrase matching (allow some flexibility)
      if (!matchFound) {
        const words = cleanSearchText.split(/\s+/);
        if (words.length >= 2) {
          // Try to match 70% of the words in sequence
          const minWordsRequired = Math.max(2, Math.ceil(words.length * 0.7));
          
          for (let i = 0; i <= words.length - minWordsRequired; i++) {
            const wordSequence = words.slice(i, i + minWordsRequired);
            const pattern = wordSequence.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+[\\w\\s]{0,20}?\\s*');
            
            try {
              const fuzzyRegex = new RegExp(`(${pattern})`, 'gi');
              if (fuzzyRegex.test(content)) {
                highlightedContent = highlightedContent.replace(fuzzyRegex, (match) => {
                  if (!matchFound) {
                    matchFound = true;
                    return `<mark id="first-highlight" style="background-color: ${highlightColor}; padding: 2px 4px; border-radius: 3px; font-weight: 600; color: ${textColor}; border: 2px dotted #0ea5e9;">${match}</mark>`;
                  }
                  return `<mark style="background-color: ${highlightColor}; padding: 2px 4px; border-radius: 3px; font-weight: 600; color: ${textColor}; border: 2px dotted #0ea5e9;">${match}</mark>`;
                });
                console.log('✅ Fuzzy phrase match found:', wordSequence.join(' '));
                break;
              }
            } catch (regexError) {
              console.warn('Regex error in fuzzy matching:', regexError);
            }
          }
        }
      }
      
      // Strategy 3: Medical term and key word matching
      if (!matchFound) {
        const medicalSynonyms = {
          'tumor': ['mass', 'lesion', 'neoplasm', 'growth', 'nodule'],
          'carcinoma': ['cancer', 'malignancy', 'tumor', 'neoplasm'],
          'primary': ['main', 'principal', 'initial', 'original'],
          'site': ['location', 'position', 'area', 'region'],
          'lobe': ['segment', 'section', 'part'],
          'upper': ['superior', 'top'],
          'lower': ['inferior', 'bottom'],
          'right': ['rt', 'r'],
          'left': ['lt', 'l'],
          'breast': ['mammary', 'chest'],
          'lung': ['pulmonary', 'respiratory']
        };
        
        const words = cleanSearchText.toLowerCase().split(/\s+/);
        
        // Look for medical synonyms
        for (const word of words) {
          if (word.length < 3) continue;
          
          // Check direct synonyms
          const synonyms = medicalSynonyms[word as keyof typeof medicalSynonyms] || [];
          for (const synonym of synonyms) {
            const synonymRegex = new RegExp(`\\b(${synonym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
            if (synonymRegex.test(content)) {
              highlightedContent = highlightedContent.replace(synonymRegex, (match) => {
                if (!matchFound) {
                  matchFound = true;
                  return `<mark id="first-highlight" style="background-color: #fde68a; padding: 2px 4px; border-radius: 3px; font-weight: 600; color: #92400e; border: 1px dotted #f59e0b;">${match}</mark>`;
                }
                return `<mark style="background-color: #fde68a; padding: 2px 4px; border-radius: 3px; font-weight: 600; color: #92400e; border: 1px dotted #f59e0b;">${match}</mark>`;
              });
              console.log(`✅ Medical synonym match: "${word}" → "${synonym}"`);
              break;
            }
          }
          
          if (matchFound) break;
          
          // Check reverse synonyms (if content word has search word as synonym)
          for (const [key, synonymList] of Object.entries(medicalSynonyms)) {
            if (synonymList.includes(word)) {
              const keyRegex = new RegExp(`\\b(${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
              if (keyRegex.test(content)) {
                highlightedContent = highlightedContent.replace(keyRegex, (match) => {
                  if (!matchFound) {
                    matchFound = true;
                    return `<mark id="first-highlight" style="background-color: #fde68a; padding: 2px 4px; border-radius: 3px; font-weight: 600; color: #92400e; border: 1px dotted #f59e0b;">${match}</mark>`;
                  }
                  return `<mark style="background-color: #fde68a; padding: 2px 4px; border-radius: 3px; font-weight: 600; color: #92400e; border: 1px dotted #f59e0b;">${match}</mark>`;
                });
                console.log(`✅ Reverse synonym match: "${word}" ← "${key}"`);
                break;
              }
            }
          }
          
          if (matchFound) break;
        }
      }
      
      // Strategy 4: Individual significant word matching (fallback)
      if (!matchFound) {
        const significantWords = cleanSearchText.split(/\s+/).filter(word => 
          word.length >= 4 && 
          !['the', 'and', 'of', 'in', 'to', 'for', 'with', 'by', 'from', 'this', 'that', 'was', 'were', 'been', 'have', 'has'].includes(word.toLowerCase())
        );
        
        for (const word of significantWords) {
          const wordRegex = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
          if (wordRegex.test(content)) {
            highlightedContent = highlightedContent.replace(wordRegex, (match) => {
              if (!matchFound) {
                matchFound = true;
                return `<mark id="first-highlight" style="background-color: #fed7d7; padding: 2px 4px; border-radius: 3px; font-weight: 600; color: #c53030; border: 1px solid #fc8181;">${match}</mark>`;
              }
              return `<mark style="background-color: #fed7d7; padding: 2px 4px; border-radius: 3px; font-weight: 600; color: #c53030; border: 1px solid #fc8181;">${match}</mark>`;
            });
            console.log(`✅ Individual word match: "${word}"`);
            break;
          }
        }
      }
      
      if (!matchFound) {
        console.warn('⚠️ No matches found for:', cleanSearchText);
        // Add a visual indicator that we're searching
        const indicatorColor = isPreIdentified ? '#dcfce7' : '#fef3c7';
        const borderColor = isPreIdentified ? '#16a34a' : '#f59e0b';
        const statusText = isPreIdentified ? '📍 Pre-identified source location' : '🔍 Searching for text';
        
        highlightedContent = `<div id="search-indicator" style="background-color: ${indicatorColor}; border: 1px solid ${borderColor}; padding: 8px; margin-bottom: 16px; border-radius: 6px;">
          <strong>${statusText}:</strong> "${cleanSearchText}"<br>
          <small style="color: #92400e;">Text may appear differently in the original document. Use Ctrl+F to search manually.</small>
        </div>` + highlightedContent;
      } else {
        console.log('✅ Successfully highlighted text in document');
      }
      
      return highlightedContent;
    } catch (error) {
      console.warn('Error highlighting text, returning original content:', error);
      return content;
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
                      {/* Delete Button - Only visible on hover */}
                      {onDocumentDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDocumentDelete(document.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-800 hover:bg-red-50 p-1 h-6 w-6"
                          title="Delete document"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
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
        <div className="flex-1 bg-white rounded-lg border border-gray-200 m-4 flex flex-col overflow-hidden">
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
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      {DOCUMENT_TYPES[selectedDocument.type as keyof typeof DOCUMENT_TYPES]?.label || selectedDocument.type}
                    </Badge>
                    {highlightText && selectedDocument.id === highlightText.documentId && (
                      <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
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
                  </div>
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
                  <div className="bg-white rounded border">
                    {documentContent.includes('<html>') || documentContent.includes('<!DOCTYPE html>') ? (
                      <div className="relative">
                        {highlightText && selectedDocument.id === highlightText.documentId && (
                          <div className="absolute top-2 left-2 z-10 bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-lg max-w-md">
                            <div className="flex items-center gap-2">
                              {highlightText.metadata?.isPreIdentified ? (
                                <>
                                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                  <span className="text-sm font-medium text-green-800">
                                    Located: {highlightText.metadata.fieldName}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                                  <span className="text-sm font-medium text-yellow-800">
                                    Searching for: "{highlightText.textContent}"
                                  </span>
                                </>
                              )}
                            </div>
                            {highlightText.metadata?.isPreIdentified ? (
                              <div className="text-xs text-green-700 mt-1">
                                <div><strong>Confidence:</strong> {Math.round((highlightText.metadata.confidence || 0) * 100)}%</div>
                                {highlightText.metadata.reasoning && (
                                  <div className="mt-1"><strong>Reasoning:</strong> "{highlightText.metadata.reasoning}"</div>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-yellow-700 mt-1">
                                Use Ctrl+F to find this text in the document below
                              </p>
                            )}
                          </div>
                        )}
                        <iframe
                          srcDoc={highlightText ? highlightTextInContent(documentContent, highlightText.textContent) : documentContent}
                          className="w-full h-full min-h-[800px] border-0"
                          title="Document Content"
                        />
                      </div>
                    ) : documentContent.includes('PDF Document:') ? (
                      <div className="relative bg-white rounded border h-full">
                        {highlightText && selectedDocument.id === highlightText.documentId && (
                          <div className="absolute top-2 left-2 z-10 bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-lg max-w-md">
                            <div className="flex items-center gap-2">
                              {highlightText.metadata?.isPreIdentified ? (
                                <>
                                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                  <span className="text-sm font-medium text-green-800">
                                    Located: {highlightText.metadata.fieldName}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                                  <span className="text-sm font-medium text-yellow-800">
                                    Searching for: "{highlightText.textContent}"
                                  </span>
                                </>
                              )}
                            </div>
                            {highlightText.metadata?.isPreIdentified ? (
                              <div className="text-xs text-green-700 mt-1">
                                <div><strong>Confidence:</strong> {Math.round((highlightText.metadata.confidence || 0) * 100)}%</div>
                                {highlightText.metadata.reasoning && (
                                  <div className="mt-1"><strong>Reasoning:</strong> "{highlightText.metadata.reasoning}"</div>
                                )}
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                  <div className="font-medium text-green-800">📍 To find this text in the PDF:</div>
                                  <div className="text-xs mt-1">
                                    1. Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+F</kbd> (or <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Cmd+F</kbd> on Mac)
                                  </div>
                                  <div className="text-xs">
                                    2. Search for: <span className="font-mono bg-white px-1 border rounded">"{highlightText.textContent}"</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-yellow-700 mt-1">
                                Use Ctrl+F to find this text in the PDF below
                              </p>
                            )}
                          </div>
                        )}
                        <iframe
                          src={`http://localhost:8001/api/pdf/${encodeURIComponent(selectedDocument?.filename || '')}${
                            highlightText && selectedDocument.id === highlightText.documentId 
                              ? `#search="${encodeURIComponent(highlightText.textContent)}"`
                              : ''
                          }`}
                          className="w-full h-full min-h-[800px] border-0"
                          title={`PDF Viewer - ${selectedDocument?.filename}`}
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        {highlightText && selectedDocument.id === highlightText.documentId && (
                          <div className="mb-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              {highlightText.metadata?.isPreIdentified ? (
                                <>
                                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                  <span className="text-sm font-medium text-green-800">
                                    Located: {highlightText.metadata.fieldName}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                                  <span className="text-sm font-medium text-yellow-800">
                                    Highlighted: "{highlightText.textContent}"
                                  </span>
                                </>
                              )}
                            </div>
                            {highlightText.metadata?.isPreIdentified && (
                              <div className="text-xs text-green-700 mt-2">
                                <div><strong>Confidence:</strong> {Math.round((highlightText.metadata.confidence || 0) * 100)}%</div>
                                {highlightText.metadata.reasoning && (
                                  <div className="mt-1"><strong>Reasoning:</strong> "{highlightText.metadata.reasoning}"</div>
                                )}
                                {highlightText.metadata.extractionTimestamp && (
                                  <div className="mt-1"><strong>Extracted:</strong> {new Date(highlightText.metadata.extractionTimestamp).toLocaleString()}</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <div 
                          className="whitespace-pre-wrap font-sans text-sm leading-relaxed p-4 min-h-[800px] max-h-[1200px] overflow-y-auto border rounded"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightText ? highlightTextInContent(documentContent, highlightText.textContent) : documentContent 
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400 min-h-[600px]">
                    <div className="text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4" />
                      <p>Select a document to view</p>
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
