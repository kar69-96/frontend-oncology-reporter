import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Edit3 } from "lucide-react";

interface EditableCodeBadgeProps {
  code: string;
  onCodeChange?: (newCode: string) => void;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function EditableCodeBadge({ 
  code, 
  onCodeChange, 
  variant = "outline",
  className = "" 
}: EditableCodeBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(code);

  const handleSave = () => {
    if (onCodeChange && editValue !== code) {
      onCodeChange(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(code);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-6 w-24 text-xs px-2"
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={handleSave}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={handleCancel}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Badge 
      variant={variant} 
      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <span className="flex items-center gap-1">
        {code}
        <Edit3 className="h-3 w-3 opacity-50" />
      </span>
    </Badge>
  );
}