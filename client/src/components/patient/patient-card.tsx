import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Patient } from "@/lib/types";
import { PATIENT_STATUSES } from "@/lib/constants";

interface PatientCardProps {
  patient: Patient;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}

export function PatientCard({ patient, selected, onSelect }: PatientCardProps) {
  const statusConfig = PATIENT_STATUSES[patient.status as keyof typeof PATIENT_STATUSES];

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              onClick={(e) => e.stopPropagation()}
            />
            <div className={`status-dot ${patient.status}`} />
          </div>
          <Badge variant="secondary" className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
        </div>
        
        <Link href={`/patients/${patient.id}`}>
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors">
              {patient.name}
            </h3>
            <p className="text-sm text-gray-600">MRN: {patient.mrn}</p>
            {patient.diagnosis && (
              <p className="text-xs text-gray-500 mt-1">
                {patient.diagnosis}
              </p>
            )}
          </div>
        </Link>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Updated {new Date(patient.lastUpdated).toLocaleDateString()}</span>
          <span>DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
