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
  // I. PATIENT & DEMOGRAPHIC INFORMATION
  patientName: z.string().min(1, "Patient name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  sex: z.string().min(1, "Sex is required"),
  race: z.string().min(1, "Race is required"),
  ethnicity: z.string().min(1, "Ethnicity is required"),
  addressAtDiagnosis: z.string().min(1, "Address at diagnosis is required"),
  countyAtDiagnosis: z.string().min(1, "County at diagnosis is required"),
  socialSecurityNumber: z.string().optional(),
  
  // II. TUMOR IDENTIFICATION
  primarySite: z.string().min(1, "Primary site is required"),
  histologicType: z.string().min(1, "Histologic type is required"),
  behaviorCode: z.string().min(1, "Behavior code is required"),
  laterality: z.string().min(1, "Laterality is required"),
  gradeDifferentiation: z.string().optional(),
  dateOfDiagnosis: z.string().min(1, "Date of diagnosis is required"),
  diagnosticConfirmation: z.string().min(1, "Diagnostic confirmation is required"),
  classOfCase: z.string().min(1, "Class of case is required"),
  sequenceNumber: z.string().min(1, "Sequence number is required"),
  
  // III. STAGING
  clinicalT: z.string().optional(),
  clinicalN: z.string().optional(),
  clinicalM: z.string().optional(),
  pathologicT: z.string().optional(),
  pathologicN: z.string().optional(),
  pathologicM: z.string().optional(),
  ajccStageGroupClinical: z.string().optional(),
  ajccStageGroupPathologic: z.string().optional(),
  seerSummaryStage2018: z.string().min(1, "SEER summary stage is required"),
  
  // IV. FIRST COURSE OF TREATMENT
  surgeryOfPrimarySite: z.string().optional(),
  dateOfSurgery: z.string().optional(),
  radiationTherapy: z.string().optional(),
  dateRadiationStarted: z.string().optional(),
  chemotherapy: z.string().optional(),
  hormoneTherapy: z.string().optional(),
  immunotherapy: z.string().optional(),
  
  // V. FOLLOW-UP & OUTCOME
  dateOfLastContact: z.string().min(1, "Date of last contact is required"),
  vitalStatus: z.string().min(1, "Vital status is required"),
  dateOfDeath: z.string().optional(),
  causeOfDeath: z.string().optional(),
  cancerStatus: z.string().optional(),
  
  // VI. ADMINISTRATIVE & QUALITY
  accessionNumber: z.string().min(1, "Accession number is required"),
  reportingFacilityId: z.string().min(1, "Reporting facility ID is required"),
  abstractorId: z.string().optional(),
  dateCaseAbstracted: z.string().min(1, "Date case abstracted is required"),
  editChecksPassed: z.string().min(1, "Edit checks status is required"),
  recordType: z.string().min(1, "Record type is required"),
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
      // I. PATIENT & DEMOGRAPHIC INFORMATION
      patientName: form?.patientName || patient?.name || "",
      dateOfBirth: form?.dateOfBirth || patient?.dateOfBirth || "",
      sex: form?.sex || "",
      race: form?.race || "",
      ethnicity: form?.ethnicity || "",
      addressAtDiagnosis: form?.addressAtDiagnosis || "",
      countyAtDiagnosis: form?.countyAtDiagnosis || "",
      socialSecurityNumber: form?.socialSecurityNumber || "",
      
      // II. TUMOR IDENTIFICATION
      primarySite: form?.primarySite || "",
      histologicType: form?.histologicType || "",
      behaviorCode: form?.behaviorCode || "",
      laterality: form?.laterality || "",
      gradeDifferentiation: form?.gradeDifferentiation || "",
      dateOfDiagnosis: form?.dateOfDiagnosis || "",
      diagnosticConfirmation: form?.diagnosticConfirmation || "",
      classOfCase: form?.classOfCase || "",
      sequenceNumber: form?.sequenceNumber || "",
      
      // III. STAGING
      clinicalT: form?.clinicalT || "",
      clinicalN: form?.clinicalN || "",
      clinicalM: form?.clinicalM || "",
      pathologicT: form?.pathologicT || "",
      pathologicN: form?.pathologicN || "",
      pathologicM: form?.pathologicM || "",
      ajccStageGroupClinical: form?.ajccStageGroupClinical || "",
      ajccStageGroupPathologic: form?.ajccStageGroupPathologic || "",
      seerSummaryStage2018: form?.seerSummaryStage2018 || "",
      
      // IV. FIRST COURSE OF TREATMENT
      surgeryOfPrimarySite: form?.surgeryOfPrimarySite || "",
      dateOfSurgery: form?.dateOfSurgery || "",
      radiationTherapy: form?.radiationTherapy || "",
      dateRadiationStarted: form?.dateRadiationStarted || "",
      chemotherapy: form?.chemotherapy || "",
      hormoneTherapy: form?.hormoneTherapy || "",
      immunotherapy: form?.immunotherapy || "",
      
      // V. FOLLOW-UP & OUTCOME
      dateOfLastContact: form?.dateOfLastContact || "",
      vitalStatus: form?.vitalStatus || "",
      dateOfDeath: form?.dateOfDeath || "",
      causeOfDeath: form?.causeOfDeath || "",
      cancerStatus: form?.cancerStatus || "",
      
      // VI. ADMINISTRATIVE & QUALITY
      accessionNumber: form?.accessionNumber || "",
      reportingFacilityId: form?.reportingFacilityId || "",
      abstractorId: form?.abstractorId || "",
      dateCaseAbstracted: form?.dateCaseAbstracted || "",
      editChecksPassed: form?.editChecksPassed || "",
      recordType: form?.recordType || "",
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
