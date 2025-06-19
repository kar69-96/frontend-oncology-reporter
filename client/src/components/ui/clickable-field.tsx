import { ReactNode } from "react";
import { FileText } from "lucide-react";
import { hasFieldSource, getFieldSource } from "@/lib/field-source-mapping";

interface ClickableFieldProps {
  fieldName: string;
  patientId: number;
  children: ReactNode;
  onFieldSourceClick?: (documentId: number, startIndex: number, endIndex: number) => void;
  className?: string;
}

export function ClickableField({ 
  fieldName, 
  patientId, 
  children, 
  onFieldSourceClick, 
  className = "" 
}: ClickableFieldProps) {
  const hasSource = hasFieldSource(fieldName, patientId);

  if (!hasSource || !onFieldSourceClick) {
    return <div className={className}>{children}</div>;
  }

  const handleClick = () => {
    const fieldSource = getFieldSource(fieldName, patientId);
    if (fieldSource && onFieldSourceClick) {
      onFieldSourceClick(fieldSource.documentId, fieldSource.startIndex, fieldSource.endIndex);
    }
  };

  return (
    <div 
      className={`relative group cursor-pointer hover:bg-blue-50 rounded transition-colors ${className}`}
      onClick={handleClick}
      title="Click to view source in document"
    >
      {children}
      <FileText 
        className="absolute top-2 right-2 w-3 h-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" 
      />
    </div>
  );
}