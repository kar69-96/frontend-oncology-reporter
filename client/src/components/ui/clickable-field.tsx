import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasFieldSource, getFieldSource } from "@/lib/field-source-mapping";

interface ClickableFieldProps {
  fieldName: string;
  patientId: number;
  value: string;
  onChange: (value: string) => void;
  onSourceClick?: (documentId: number, startIndex: number, endIndex: number) => void;
  type?: "input" | "textarea" | "select";
  placeholder?: string;
  selectOptions?: Array<{ value: string; label: string }>;
  className?: string;
  disabled?: boolean;
}

export function ClickableField({
  fieldName,
  patientId,
  value,
  onChange,
  onSourceClick,
  type = "input",
  placeholder,
  selectOptions = [],
  className,
  disabled = false
}: ClickableFieldProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hasSource = hasFieldSource(fieldName, patientId);
  const source = getFieldSource(fieldName, patientId);
  
  const handleSourceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasSource && source && onSourceClick) {
      onSourceClick(source.documentId, source.startIndex, source.endIndex);
    }
  };

  const fieldClasses = cn(
    className,
    hasSource && value ? "cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all" : "",
    isHovered && hasSource && value ? "ring-1 ring-blue-200" : ""
  );

  const SourceIndicator = () => {
    if (!hasSource || !value) return null;
    
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleSourceClick}
        title={`Click to view source in ${source?.documentType || 'document'}`}
      >
        <ExternalLink className="h-3 w-3" />
      </Button>
    );
  };

  const fieldProps = {
    value,
    onChange: (newValue: string) => onChange(newValue),
    placeholder,
    disabled,
    className: fieldClasses,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    onClick: hasSource && value ? handleSourceClick : undefined
  };

  return (
    <div className="relative group">
      {type === "input" && (
        <Input
          {...fieldProps}
          onChange={(e) => fieldProps.onChange(e.target.value)}
        />
      )}
      
      {type === "textarea" && (
        <Textarea
          {...fieldProps}
          onChange={(e) => fieldProps.onChange(e.target.value)}
        />
      )}
      
      {type === "select" && (
        <Select 
          value={value} 
          onValueChange={fieldProps.onChange}
          disabled={disabled}
        >
          <SelectTrigger 
            className={cn(fieldClasses, "group")}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={hasSource && value ? handleSourceClick : undefined}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {hasSource && value && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <FileText className="h-3 w-3 text-blue-500" />
        </div>
      )}
    </div>
  );
}