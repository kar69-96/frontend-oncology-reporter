import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface NewPatientData {
  name: string;
  mrn: string;
  dateOfBirth?: string;
  sex?: string;
}

export function NewPatientDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<NewPatientData>({
    name: "",
    mrn: "",
    dateOfBirth: "",
    sex: "",
  });

  const queryClient = useQueryClient();

  const createPatientMutation = useMutation({
    mutationFn: async (data: NewPatientData) => {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          status: "in_progress",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create patient");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setFormData({
        name: "",
        mrn: "",
        dateOfBirth: "",
        sex: "",
      });
      setOpen(false);
      toast({
        title: "Success",
        description: "Patient created successfully",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mrn) {
      toast({
        title: "Error",
        description: "Please fill in name and MRN",
        variant: "destructive",
      });
      return;
    }
    createPatientMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof NewPatientData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add New Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter patient's full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mrn">Medical Record Number (MRN) *</Label>
            <Input
              id="mrn"
              value={formData.mrn}
              onChange={(e) => handleInputChange("mrn", e.target.value)}
              placeholder="Enter MRN"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sex">Sex (Optional)</Label>
            <select
              id="sex"
              value={formData.sex}
              onChange={(e) => handleInputChange("sex", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createPatientMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPatientMutation.isPending}
            >
              {createPatientMutation.isPending ? "Creating..." : "Create Patient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 