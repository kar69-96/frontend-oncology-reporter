import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Save } from "lucide-react";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ClickableField, ClickableFieldLabel } from "@/components/ui/clickable-field";
import type { Patient, TumorRegistryForm } from "@/lib/types";

// Utility function to get field confidence level and corresponding border class
const getFieldConfidence = (fieldName: string, form?: TumorRegistryForm) => {
  // Simulate confidence levels based on field type and data source
  const confidenceLevels: Record<string, 'high' | 'medium' | 'low'> = {
    // Demographics from patient records (high confidence)
    patientName: 'high',
    dateOfBirth: 'high',
    sex: 'high',
    race: 'high',
    ethnicity: 'high',
    addressAtDiagnosis: 'high',
    countyAtDiagnosis: 'high',
    
    // Data extracted from documents - only truly uncertain fields are medium/low
    primarySite: 'high', // Clear from documents
    histologicType: 'low', // Complex medical terminology
    behaviorCode: 'high',
    laterality: 'high',
    gradeDifferentiation: 'low',
    dateOfDiagnosis: 'high',
    diagnosticConfirmation: 'high',
    classOfCase: 'high',
    sequenceNumber: 'high',
    
    // Staging - only complex staging is medium confidence
    clinicalT: 'high',
    clinicalN: 'medium', // Can be harder to extract
    clinicalM: 'low',
    pathologicT: 'high',
    pathologicN: 'low',
    pathologicM: 'high',
    ajccStageGroupClinical: 'high',
    ajccStageGroupPathologic: 'high',
    seerSummaryStage2018: 'high',
    
    // Treatment fields - mostly clear from treatment notes
    surgeryOfPrimarySite: 'high',
    dateOfSurgery: 'high',
    radiationTherapy: 'low',
    dateRadiationStarted: 'high',
    chemotherapy: 'high',
    hormoneTherapy: 'high',
    immunotherapy: 'high',
    
    // Follow-up (high confidence)
    dateOfLastContact: 'high',
    vitalStatus: 'high',
    cancerStatus: 'high',
    
    // Administrative fields (high confidence)
    accessionNumber: 'high',
    abstractorId: 'high',
    reportingFacilityId: 'high',
    dateCaseAbstracted: 'high',
    editChecksPassed: 'high',
    recordType: 'high',
  };
  
  const confidence = confidenceLevels[fieldName] || 'high';
  
  switch (confidence) {
    case 'medium':
      return 'border-yellow-400 focus:border-yellow-500 focus:ring-yellow-500';
    case 'low':
      return 'border-red-400 focus:border-red-500 focus:ring-red-500';
    default:
      return '';
  }
};

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

interface ComprehensivePatientFormProps {
  patient: Patient;
  form?: TumorRegistryForm;
  showCodes: boolean;
  onFieldSourceClick?: (documentId: number, startIndex: number, endIndex: number) => void;
}

export function ComprehensivePatientForm({ patient, form, showCodes, onFieldSourceClick }: ComprehensivePatientFormProps) {
  const { toast } = useToast();

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

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      fetch(`/api/patients/${patient.id}/form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "completed" }),
      }).then(res => {
        if (!res.ok) throw new Error("Failed to save form");
        return res.json();
      }),
    onSuccess: () => {
      toast({
        title: "Form saved successfully",
        description: "The tumor registry form has been completed and saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patient.id, "form"] });
    },
    onError: (error) => {
      toast({
        title: "Error saving form",
        description: "There was an error saving the tumor registry form.",
        variant: "destructive",
      });
    },
  });

  const draftMutation = useMutation({
    mutationFn: (data: FormData) =>
      fetch(`/api/patients/${patient.id}/form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "draft" }),
      }).then(res => {
        if (!res.ok) throw new Error("Failed to save draft");
        return res.json();
      }),
    onSuccess: () => {
      toast({
        title: "Draft saved",
        description: "Your progress has been saved as a draft.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patient.id, "form"] });
    },
    onError: (error) => {
      toast({
        title: "Error saving draft",
        description: "There was an error saving the draft.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const onSaveDraft = () => {
    const data = reactForm.getValues();
    draftMutation.mutate(data);
  };

  // Reset form when form data changes
  useEffect(() => {
    if (form) {
      const formData = {
        // I. PATIENT & DEMOGRAPHIC INFORMATION
        patientName: form.patientName || patient?.name || "",
        dateOfBirth: form.dateOfBirth || patient?.dateOfBirth || "",
        sex: form.sex || "",
        race: form.race || "",
        ethnicity: form.ethnicity || "",
        addressAtDiagnosis: form.addressAtDiagnosis || "",
        countyAtDiagnosis: form.countyAtDiagnosis || "",
        socialSecurityNumber: form.socialSecurityNumber || "",
        
        // II. TUMOR IDENTIFICATION
        primarySite: form.primarySite || "",
        histologicType: form.histologicType || "",
        behaviorCode: form.behaviorCode || "",
        laterality: form.laterality || "",
        gradeDifferentiation: form.gradeDifferentiation || "",
        dateOfDiagnosis: form.dateOfDiagnosis || "",
        diagnosticConfirmation: form.diagnosticConfirmation || "",
        classOfCase: form.classOfCase || "",
        sequenceNumber: form.sequenceNumber || "",
        
        // III. STAGING
        clinicalT: form.clinicalT || "",
        clinicalN: form.clinicalN || "",
        clinicalM: form.clinicalM || "",
        pathologicT: form.pathologicT || "",
        pathologicN: form.pathologicN || "",
        pathologicM: form.pathologicM || "",
        ajccStageGroupClinical: form.ajccStageGroupClinical || "",
        ajccStageGroupPathologic: form.ajccStageGroupPathologic || "",
        seerSummaryStage2018: form.seerSummaryStage2018 || "",
        
        // IV. FIRST COURSE OF TREATMENT
        surgeryOfPrimarySite: form.surgeryOfPrimarySite || "",
        dateOfSurgery: form.dateOfSurgery || "",
        radiationTherapy: form.radiationTherapy || "",
        dateRadiationStarted: form.dateRadiationStarted || "",
        chemotherapy: form.chemotherapy || "",
        hormoneTherapy: form.hormoneTherapy || "",
        immunotherapy: form.immunotherapy || "",
        
        // V. FOLLOW-UP & OUTCOME
        dateOfLastContact: form.dateOfLastContact || "",
        vitalStatus: form.vitalStatus || "",
        dateOfDeath: form.dateOfDeath || "",
        causeOfDeath: form.causeOfDeath || "",
        cancerStatus: form.cancerStatus || "",
        
        // VI. ADMINISTRATIVE & QUALITY
        accessionNumber: form.accessionNumber || "",
        reportingFacilityId: form.reportingFacilityId || "",
        abstractorId: form.abstractorId || "",
        dateCaseAbstracted: form.dateCaseAbstracted || "",
        editChecksPassed: form.editChecksPassed || "",
        recordType: form.recordType || "",
      };
      reactForm.reset(formData);
    }
  }, [form, patient, reactForm]);

  if (!patient) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500">Patient data not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/patients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Patients
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{patient.name}</h2>
            <p className="text-sm text-gray-500">MRN: {patient.mrn}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {form?.lastUpdated && (
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              Last updated: {new Date(form.lastUpdated).toLocaleDateString()}
            </div>
          )}
          <Button 
            onClick={reactForm.handleSubmit(onSubmit)} 
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {mutation.isPending ? "Saving..." : "Save Form"}
          </Button>
        </div>
      </div>

      <Form {...reactForm}>
        <form onSubmit={reactForm.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* I. PATIENT & DEMOGRAPHIC INFORMATION */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">🏷️ Patient & Demographic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={reactForm.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="patientName"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Patient Name {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className={getFieldConfidence("patientName", form)} />
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
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="dateOfBirth"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Date of Birth {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
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
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="sex"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Sex {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">{showCodes ? "1 - Male" : "Male"}</SelectItem>
                        <SelectItem value="2">{showCodes ? "2 - Female" : "Female"}</SelectItem>
                        <SelectItem value="3">{showCodes ? "3 - Other" : "Other"}</SelectItem>
                        <SelectItem value="9">{showCodes ? "9 - Unknown" : "Unknown"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="race"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="race"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Race {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select race" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="01">{showCodes ? "01 - White" : "White"}</SelectItem>
                        <SelectItem value="02">{showCodes ? "02 - Black" : "Black"}</SelectItem>
                        <SelectItem value="96">{showCodes ? "96 - Asian" : "Asian"}</SelectItem>
                        <SelectItem value="03">{showCodes ? "03 - Native American" : "Native American"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="ethnicity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="ethnicity"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Ethnicity (Hispanic Origin) {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ethnicity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">{showCodes ? "0 - Non-Hispanic" : "Non-Hispanic"}</SelectItem>
                        <SelectItem value="1">{showCodes ? "1 - Mexican" : "Mexican"}</SelectItem>
                        <SelectItem value="2">{showCodes ? "2 - Puerto Rican" : "Puerto Rican"}</SelectItem>
                        <SelectItem value="3">{showCodes ? "3 - Cuban" : "Cuban"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="addressAtDiagnosis"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="addressAtDiagnosis"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Address at Diagnosis {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Street, City, State, ZIP" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="countyAtDiagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="countyAtDiagnosis"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        County at Diagnosis {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
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
                name="socialSecurityNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="socialSecurityNumber"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Social Security Number {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="XXX-XX-XXXX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* II. TUMOR IDENTIFICATION */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">📍 Tumor Identification</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={reactForm.control}
                name="primarySite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="primarySite"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Primary Site (ICD-O-3) {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className={getFieldConfidence("primarySite", form)} placeholder="e.g., Breast, Lung, Colon" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="histologicType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="histologicType"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Histologic Type (ICD-O-3) {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className={getFieldConfidence("histologicType", form)} placeholder="e.g., Adenocarcinoma, Squamous cell" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="behaviorCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="behaviorCode"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Behavior Code {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select behavior" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">{showCodes ? "0 - Benign" : "Benign"}</SelectItem>
                        <SelectItem value="1">{showCodes ? "1 - Uncertain" : "Uncertain"}</SelectItem>
                        <SelectItem value="2">{showCodes ? "2 - In Situ" : "In Situ"}</SelectItem>
                        <SelectItem value="3">{showCodes ? "3 - Malignant" : "Malignant"}</SelectItem>
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
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="laterality"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Laterality {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select laterality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">{showCodes ? "1 - Right" : "Right"}</SelectItem>
                        <SelectItem value="2">{showCodes ? "2 - Left" : "Left"}</SelectItem>
                        <SelectItem value="3">{showCodes ? "3 - Only One Side" : "Only One Side"}</SelectItem>
                        <SelectItem value="8">{showCodes ? "8 - Not Applicable" : "Not Applicable"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="gradeDifferentiation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="gradeDifferentiation"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Grade / Differentiation {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={getFieldConfidence("gradeDifferentiation", form)}>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">{showCodes ? "1 - Well Differentiated" : "Well Differentiated"}</SelectItem>
                        <SelectItem value="2">{showCodes ? "2 - Moderately Differentiated" : "Moderately Differentiated"}</SelectItem>
                        <SelectItem value="3">{showCodes ? "3 - Poorly Differentiated" : "Poorly Differentiated"}</SelectItem>
                        <SelectItem value="4">{showCodes ? "4 - Undifferentiated" : "Undifferentiated"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="dateOfDiagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="dateOfDiagnosis"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Date of Diagnosis {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="diagnosticConfirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="diagnosticConfirmation"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Diagnostic Confirmation {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select confirmation method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">{showCodes ? "1 - Histology" : "Histology"}</SelectItem>
                        <SelectItem value="2">{showCodes ? "2 - Clinical" : "Clinical"}</SelectItem>
                        <SelectItem value="4">{showCodes ? "4 - Physician Statement" : "Physician Statement"}</SelectItem>
                        <SelectItem value="8">{showCodes ? "8 - Radiology" : "Radiology"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="classOfCase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="classOfCase"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Class of Case {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class of case" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="00">{showCodes ? "00 - Dx & Tx Elsewhere" : "Diagnosed & Treated Elsewhere"}</SelectItem>
                        <SelectItem value="10">{showCodes ? "10 - Dx Only at Your Site" : "Diagnosed Only at Your Site"}</SelectItem>
                        <SelectItem value="11">{showCodes ? "11 - Dx + Tx at Your Site" : "Diagnosed + Treated at Your Site"}</SelectItem>
                        <SelectItem value="13">{showCodes ? "13 - Tx Only at Your Site" : "Treated Only at Your Site"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="sequenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="sequenceNumber"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Sequence Number {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="00, 01, 02..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* III. STAGING */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">🎯 Staging</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={reactForm.control}
                name="clinicalT"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="clinicalT"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Clinical T {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className={getFieldConfidence("clinicalT", form)} placeholder="T1, T2, T3, T4, TX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="clinicalN"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="clinicalN"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Clinical N {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className={getFieldConfidence("clinicalN", form)} placeholder="N0, N1, N2, N3, NX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="clinicalM"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="clinicalM"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Clinical M {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className={getFieldConfidence("clinicalM", form)} placeholder="M0, M1, MX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="pathologicT"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="pathologicT"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Pathologic T {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className={getFieldConfidence("pathologicT", form)} placeholder="pT1, pT2, pT3, pT4, pTX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="pathologicN"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="pathologicN"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Pathologic N {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className={getFieldConfidence("pathologicN", form)} placeholder="pN0, pN1, pN2, pN3, pNX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="pathologicM"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="pathologicM"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Pathologic M {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="pM0, pM1, pMX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="ajccStageGroupClinical"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="ajccStageGroupClinical"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        AJCC Stage Group - Clinical {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="I, II, III, IV..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="ajccStageGroupPathologic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="ajccStageGroupPathologic"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        AJCC Stage Group - Pathologic {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="I, II, III, IV..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="seerSummaryStage2018"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="seerSummaryStage2018"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        SEER Summary Stage 2018 {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select SEER stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">{showCodes ? "0 - In Situ" : "In Situ"}</SelectItem>
                        <SelectItem value="1">{showCodes ? "1 - Localized" : "Localized"}</SelectItem>
                        <SelectItem value="2">{showCodes ? "2 - Regional" : "Regional"}</SelectItem>
                        <SelectItem value="3">{showCodes ? "3 - Distant" : "Distant"}</SelectItem>
                        <SelectItem value="9">{showCodes ? "9 - Unknown" : "Unknown"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* IV. FIRST COURSE OF TREATMENT */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">💊 First Course of Treatment</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={reactForm.control}
                name="surgeryOfPrimarySite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="surgeryOfPrimarySite"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Surgery of Primary Site {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className={getFieldConfidence("surgeryOfPrimarySite", form)} placeholder="Surgery code or description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="dateOfSurgery"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="dateOfSurgery"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Date of Surgery {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="radiationTherapy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="radiationTherapy"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Radiation Therapy {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={getFieldConfidence("radiationTherapy", form)}>
                          <SelectValue placeholder="Select radiation status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">{showCodes ? "0 - None" : "None"}</SelectItem>
                        <SelectItem value="1">{showCodes ? "1 - Yes" : "Yes"}</SelectItem>
                        <SelectItem value="9">{showCodes ? "9 - Unknown" : "Unknown"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="dateRadiationStarted"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="dateRadiationStarted"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Date Radiation Started {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="chemotherapy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="chemotherapy"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Chemotherapy {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={getFieldConfidence("chemotherapy", form)}>
                          <SelectValue placeholder="Select chemotherapy status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="00">{showCodes ? "00 - None" : "None"}</SelectItem>
                        <SelectItem value="01">{showCodes ? "01 - Yes" : "Yes"}</SelectItem>
                        <SelectItem value="99">{showCodes ? "99 - Unknown" : "Unknown"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="hormoneTherapy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="hormoneTherapy"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Hormone Therapy {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select hormone therapy status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="00">{showCodes ? "00 - None" : "None"}</SelectItem>
                        <SelectItem value="01">{showCodes ? "01 - Yes" : "Yes"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="immunotherapy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="immunotherapy"  
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Immunotherapy {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select immunotherapy status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="00">{showCodes ? "00 - None" : "None"}</SelectItem>
                        <SelectItem value="01">{showCodes ? "01 - Yes" : "Yes"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* V. FOLLOW-UP & OUTCOME */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">🔁 Follow-up & Outcome</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={reactForm.control}
                name="dateOfLastContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="dateOfLastContact"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Date of Last Contact {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="vitalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="vitalStatus"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Vital Status {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vital status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">{showCodes ? "1 - Alive" : "Alive"}</SelectItem>
                        <SelectItem value="2">{showCodes ? "2 - Dead" : "Dead"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="dateOfDeath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Death {showCodes && <Badge variant="secondary">Optional</Badge>}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="causeOfDeath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="causeOfDeath"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Cause of Death {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ICD-10 code or description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="cancerStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="cancerStatus"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Cancer Status {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cancer status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">{showCodes ? "0 - No Evidence" : "No Evidence"}</SelectItem>
                        <SelectItem value="1">{showCodes ? "1 - Present" : "Present"}</SelectItem>
                        <SelectItem value="9">{showCodes ? "9 - Unknown" : "Unknown"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* VI. ADMINISTRATIVE & QUALITY */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">🧾 Administrative & Quality</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={reactForm.control}
                name="accessionNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="accessionNumber"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Accession Number {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Unique accession number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="reportingFacilityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="reportingFacilityId"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Reporting Facility ID {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Facility identifier" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="abstractorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="abstractorId"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Abstractor ID {showCodes && <Badge variant="secondary">Optional</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Abstractor identifier" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="dateCaseAbstracted"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="dateCaseAbstracted"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Date Case Abstracted {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="editChecksPassed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="editChecksPassed"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Edit Checks Passed {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select edit check status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">{showCodes ? "1 - Pass" : "Pass"}</SelectItem>
                        <SelectItem value="0">{showCodes ? "0 - Fail" : "Fail"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reactForm.control}
                name="recordType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ClickableFieldLabel
                        fieldName="recordType"
                        patientId={patient.id}
                        onFieldSourceClick={onFieldSourceClick}
                      >
                        Record Type {showCodes && <Badge variant="outline">Required</Badge>}
                      </ClickableFieldLabel>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select record type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">{showCodes ? "A - Abstract" : "Abstract"}</SelectItem>
                        <SelectItem value="I">{showCodes ? "I - Incidence" : "Incidence"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Save Buttons */}
          <div className="flex justify-end space-x-3">
            <Button 
              type="button"
              onClick={onSaveDraft}
              disabled={draftMutation.isPending}
              variant="outline"
            >
              <Save className="w-4 h-4 mr-2" />
              {draftMutation.isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Complete & Save"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}