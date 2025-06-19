import { ReactNode } from "react";
import { FileText } from "lucide-react";
import { hasFieldSource, getFieldSource } from "@/lib/field-source-mapping";

interface ClickableFieldProps {
  fieldName: string;
  patientId: number;
  children: ReactNode;
  onFieldSourceClick?: (documentId: number, textContent: string) => void;
  className?: string;
  showIcon?: boolean;
}

export function ClickableField({ 
  fieldName, 
  patientId, 
  children, 
  onFieldSourceClick, 
  className = "",
  showIcon = false
}: ClickableFieldProps) {
  const hasSource = hasFieldSource(fieldName, patientId);

  if (!hasSource || !onFieldSourceClick) {
    return <div className={className}>{children}</div>;
  }

  const handleSourceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fieldSource = getFieldSource(fieldName, patientId);
    if (fieldSource && onFieldSourceClick) {
      onFieldSourceClick(fieldSource.documentId, fieldSource.textContent);
    }
  };

  if (showIcon) {
    return (
      <div className="flex items-center gap-2">
        <div title="Click to view source in document">
          <FileText 
            className="w-4 h-4 text-blue-600 cursor-pointer hover:text-blue-800 transition-colors" 
            onClick={handleSourceClick}
          />
        </div>
        <div className={className}>{children}</div>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

// Helper component for clickable field labels
export function ClickableFieldLabel({ 
  fieldName, 
  patientId, 
  children, 
  onFieldSourceClick 
}: {
  fieldName: string;
  patientId: number;
  children: ReactNode;
  onFieldSourceClick?: (documentId: number, textContent: string) => void;
}) {
  const hasSource = hasFieldSource(fieldName, patientId);

  const handleSourceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fieldSource = getFieldSource(fieldName, patientId);
    if (fieldSource && onFieldSourceClick) {
      onFieldSourceClick(fieldSource.documentId, fieldSource.textContent);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {children}
      {hasSource && onFieldSourceClick && (
        <div title="Click to view source in document">
          <FileText 
            className="w-4 h-4 text-blue-600 cursor-pointer hover:text-blue-800 transition-colors" 
            onClick={handleSourceClick}
          />
        </div>
      )}
    </div>
  );
}