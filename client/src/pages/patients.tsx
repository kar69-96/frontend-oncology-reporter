import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Send, Search, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { PatientCard } from "@/components/patient/patient-card";
import { NewPatientDialog } from "@/components/patient/new-patient-dialog";
import { toast } from "@/hooks/use-toast";
import type { Patient } from "@/lib/types";
import { PATIENT_STATUSES } from "@/lib/constants";

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPatients, setSelectedPatients] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const deletePatientsMutation = useMutation({
    mutationFn: async (patientIds: number[]) => {
      const deletePromises = patientIds.map(id =>
        fetch(`/api/patients/${id}`, {
          method: "DELETE",
        })
      );
      
      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter(result => !result.ok);
      
      if (failedDeletes.length > 0) {
        throw new Error(`Failed to delete ${failedDeletes.length} patient(s)`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setSelectedPatients(new Set());
      setSelectAll(false);
      toast({
        title: "Success",
        description: `Successfully deleted ${selectedPatients.size} patient(s)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.mrn.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedPatients(new Set(filteredPatients.map(p => p.id)));
    } else {
      setSelectedPatients(new Set());
    }
  };

  const handleSelectPatient = (patientId: number, checked: boolean) => {
    const newSelected = new Set(selectedPatients);
    if (checked) {
      newSelected.add(patientId);
    } else {
      newSelected.delete(patientId);
    }
    setSelectedPatients(newSelected);
    setSelectAll(newSelected.size === filteredPatients.length);
  };

  const handleDeleteSelected = () => {
    if (selectedPatients.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedPatients.size} selected patient(s)? This action cannot be undone.`
    );
    
    if (confirmed) {
      deletePatientsMutation.mutate(Array.from(selectedPatients));
    }
  };

  if (isLoading) {
    return <PatientsSkeleton />;
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            {patients.length} total
          </Badge>
        </div>
        <div className="flex items-center space-x-3">
          {selectedPatients.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={deletePatientsMutation.isPending}
              onClick={handleDeleteSelected}
              className="inline-flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
            >
              <Trash2 className="w-7 h-7" />
            </Button>
          )}
          <NewPatientDialog />
          <Button
            variant="outline"
            disabled={selectedPatients.size === 0}
            className="inline-flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download as XML
          </Button>
          <Button
            disabled={selectedPatients.size === 0}
            className="inline-flex items-center bg-secondary hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit to Registry
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="needs_review">Needs Review</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="selectAll"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="selectAll" className="text-sm text-gray-700">
                Select All ({selectedPatients.size} selected)
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            selected={selectedPatients.has(patient.id)}
            onSelect={(checked) => handleSelectPatient(patient.id, checked)}
          />
        ))}
      </div>

      {filteredPatients.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No patients found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

function PatientsSkeleton() {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex space-x-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <Skeleton className="h-16 w-full mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}
