import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock } from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Patient, TumorRegistryForm } from "@/lib/types";

const formSchema = z.object({
  patientName: z.string().min(1, "Patient name is required"),
  medicalRecordNumber: z.string().min(1, "MRN is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  sex: z.string().min(1, "Sex is required"),
  primarySite: z.string().optional(),
  primarySiteCode: z.string().optional(),
  histology: z.string().optional(),
  histologyCode: z.string().optional(),
  grade: z.string().optional(),
  laterality: z.string().optional(),
  behavior: z.string().optional(),
  clinicalT: z.string().optional(),
  clinicalN: z.string().optional(),
  clinicalM: z.string().optional(),
  dateOfFirstContact: z.string().optional(),
  dateOfDiagnosis: z.string().optional(),
  surgeryPerformed: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PatientFormProps {
  patient: Patient;
  form?: TumorRegistryForm;
  showCodes: boolean;
}

export function PatientForm({ patient, form, showCodes }: PatientFormProps) {
  const { toast } = useToast();

  console.log("PatientForm - patient:", patient);
  console.log("PatientForm - form:", form);
  console.log("PatientForm - showCodes:", showCodes);

  const reactForm = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: form?.patientName || patient?.name || "",
      medicalRecordNumber: form?.medicalRecordNumber || patient?.mrn || "",
      dateOfBirth: form?.dateOfBirth || patient?.dateOfBirth || "",
      sex: form?.sex || patient?.sex || "",
      primarySite: form?.primarySite || "",
      primarySiteCode: form?.primarySiteCode || "",
      histology: form?.histology || "",
      histologyCode: form?.histologyCode || "",
      grade: form?.grade || "",
      laterality: form?.laterality || "",
      behavior: form?.behavior || "",
      clinicalT: form?.clinicalT || "",
      clinicalN: form?.clinicalN || "",
      clinicalM: form?.clinicalM || "",
      dateOfFirstContact: form?.dateOfFirstContact || "",
      dateOfDiagnosis: form?.dateOfDiagnosis || "",
      surgeryPerformed: form?.surgeryPerformed || "",
    },
  });

  if (!patient) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500">Patient data not available</p>
        </div>
      </div>
    );
  }

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      fetch(`/api/patients/${patient.id}/form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patient.id}/form`] });
      toast({ title: "Success", description: "Registry form saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save registry form", variant: "destructive" });
    },
  });

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data);
  };

  const isHighConfidence = (field: string) => {
    if (!form) return false;
    const confidence = field === "primarySite" ? form.primarySiteConfidence : form.histologyConfidence;
    return confidence && parseFloat(confidence) >= 0.97;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 h-full">
      <Form {...reactForm}>
        <form onSubmit={reactForm.handleSubmit(onSubmit)} className="space-y-6 pb-20">
          {/* Patient Demographics */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Demographics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={reactForm.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Patient Name
                        <span className="text-gray-400 ml-1">ℹ️</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reactForm.control}
                  name="medicalRecordNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Record Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reactForm.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reactForm.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sex</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sex" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tumor Information */}
          <Card>
            <CardHeader>
              <CardTitle>Tumor Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={reactForm.control}
                    name="primarySite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Primary Site
                          <span className="text-gray-400 ml-1">ℹ️</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              className={isHighConfidence("primarySite") ? "confidence-field" : ""}
                            />
                            {isHighConfidence("primarySite") && (
                              <span className="confidence-badge">97% Conf</span>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {showCodes && (
                    <FormField
                      control={reactForm.control}
                      name="primarySiteCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ICD-O-3 Site Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={reactForm.control}
                    name="histology"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Histology</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              className={isHighConfidence("histology") ? "confidence-field" : ""}
                            />
                            {isHighConfidence("histology") && (
                              <span className="confidence-badge">98% Conf</span>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {showCodes && (
                    <FormField
                      control={reactForm.control}
                      name="histologyCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ICD-O-3 Morphology Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={reactForm.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Grade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Grade 1">Grade 1</SelectItem>
                            <SelectItem value="Grade 2">Grade 2</SelectItem>
                            <SelectItem value="Grade 3">Grade 3</SelectItem>
                            <SelectItem value="Grade 4">Grade 4</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={reactForm.control}
                    name="laterality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Laterality</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Right">Right</SelectItem>
                            <SelectItem value="Left">Left</SelectItem>
                            <SelectItem value="Bilateral">Bilateral</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={reactForm.control}
                    name="behavior"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Behavior</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Malignant">Malignant</SelectItem>
                            <SelectItem value="In Situ">In Situ</SelectItem>
                            <SelectItem value="Benign">Benign</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staging Information */}
          <Card>
            <CardHeader>
              <CardTitle>Staging Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={reactForm.control}
                  name="clinicalT"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinical T</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="T1">T1</SelectItem>
                          <SelectItem value="T2">T2</SelectItem>
                          <SelectItem value="T3">T3</SelectItem>
                          <SelectItem value="T4">T4</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reactForm.control}
                  name="clinicalN"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinical N</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="N0">N0</SelectItem>
                          <SelectItem value="N1">N1</SelectItem>
                          <SelectItem value="N2">N2</SelectItem>
                          <SelectItem value="N3">N3</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reactForm.control}
                  name="clinicalM"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinical M</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M0">M0</SelectItem>
                          <SelectItem value="M1">M1</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Treatment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Treatment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={reactForm.control}
                    name="dateOfFirstContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of First Contact</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={reactForm.control}
                    name="dateOfDiagnosis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Diagnosis</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={reactForm.control}
                  name="surgeryPerformed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surgery Performed</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4">
            <Link href="/patients">
              <Button type="button" variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Patients
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onSubmit(reactForm.getValues())}
                disabled={saveMutation.isPending}
              >
                Save Draft
              </Button>
              <Button
                type="submit"
                className="bg-secondary hover:bg-green-700"
                disabled={saveMutation.isPending}
              >
                Complete & Submit
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
