import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Download, Plus, Search, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { IcdCode } from "@/lib/types";
import { ICD_CATEGORIES } from "@/lib/constants";

const icdCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["Breast", "Lung", "Prostate", "Colorectal", "Pancreas", "Endocrine", "Urological", "Gynecological", "Skin", "Hepatobiliary", "Gastrointestinal", "Head and Neck"]),
});

type IcdCodeForm = z.infer<typeof icdCodeSchema>;

export default function References() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [codeTypeFilter, setCodeTypeFilter] = useState<string>("all");
  const [editingCode, setEditingCode] = useState<IcdCode | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: codes = [], isLoading } = useQuery<IcdCode[]>({
    queryKey: ["/api/icd-codes", { search: searchTerm, category: categoryFilter, codeType: codeTypeFilter }],
  });

  const form = useForm<IcdCodeForm>({
    resolver: zodResolver(icdCodeSchema),
    defaultValues: {
      code: "",
      description: "",
      category: "Breast",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: IcdCodeForm) => 
      fetch("/api/icd-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icd-codes"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Success", description: "ICD code created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create ICD code", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IcdCodeForm }) =>
      fetch(`/api/icd-codes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icd-codes"] });
      setIsDialogOpen(false);
      setEditingCode(null);
      form.reset();
      toast({ title: "Success", description: "ICD code updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update ICD code", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/icd-codes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/icd-codes"] });
      toast({ title: "Success", description: "ICD code deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete ICD code", variant: "destructive" });
    },
  });

  const handleEdit = (code: IcdCode) => {
    setEditingCode(code);
    form.reset({
      code: code.code,
      description: code.description,
      category: code.category as "Breast" | "Lung" | "Prostate" | "Colorectal" | "Pancreas" | "Endocrine" | "Urological" | "Gynecological" | "Skin" | "Hepatobiliary" | "Gastrointestinal" | "Head and Neck",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this ICD code?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: IcdCodeForm) => {
    if (editingCode) {
      updateMutation.mutate({ id: editingCode.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredCodes = codes.filter((code) => {
    const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         code.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || code.category === categoryFilter;
    const matchesCodeType = codeTypeFilter === "all" || (code.codeType && code.codeType === codeTypeFilter);
    return matchesSearch && matchesCategory && matchesCodeType;
  });

  if (isLoading) {
    return <ReferencesSkeleton />;
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">References</h1>
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            {codes.length} codes
          </Badge>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="inline-flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="inline-flex items-center"
                onClick={() => {
                  setEditingCode(null);
                  form.reset();
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCode ? "Edit ICD Code" : "Add New ICD Code"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., C50.9" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Breast, unspecified" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Breast">Breast</SelectItem>
                            <SelectItem value="Lung">Lung</SelectItem>
                            <SelectItem value="Prostate">Prostate</SelectItem>
                            <SelectItem value="Colorectal">Colorectal</SelectItem>
                            <SelectItem value="Pancreas">Pancreas</SelectItem>
                            <SelectItem value="Endocrine">Endocrine</SelectItem>
                            <SelectItem value="Urological">Urological</SelectItem>
                            <SelectItem value="Gynecological">Gynecological</SelectItem>
                            <SelectItem value="Skin">Skin</SelectItem>
                            <SelectItem value="Hepatobiliary">Hepatobiliary</SelectItem>
                            <SelectItem value="Gastrointestinal">Gastrointestinal</SelectItem>
                            <SelectItem value="Head and Neck">Head and Neck</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingCode ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search codes or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Breast">Breast</SelectItem>
                  <SelectItem value="Lung">Lung</SelectItem>
                  <SelectItem value="Prostate">Prostate</SelectItem>
                  <SelectItem value="Colorectal">Colorectal</SelectItem>
                  <SelectItem value="Pancreas">Pancreas</SelectItem>
                  <SelectItem value="Demographics">Demographics</SelectItem>
                  <SelectItem value="Tumor">Tumor</SelectItem>
                  <SelectItem value="Staging">Staging</SelectItem>
                  <SelectItem value="Treatment">Treatment</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Administrative">Administrative</SelectItem>
                </SelectContent>
              </Select>
              <Select value={codeTypeFilter} onValueChange={setCodeTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ICD-O-3">ICD-O-3</SelectItem>
                  <SelectItem value="NAACCR">NAACCR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.map((code) => (
                  <TableRow key={code.id} className="hover:bg-gray-50">
                    <TableCell>
                      <code className="text-sm font-mono font-medium text-gray-900">
                        {code.code}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      {code.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={ICD_CATEGORIES[code.category as keyof typeof ICD_CATEGORIES]?.color || "bg-gray-100 text-gray-800"}
                      >
                        {ICD_CATEGORIES[code.category as keyof typeof ICD_CATEGORIES]?.label || code.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={code.codeType === "NAACCR" ? "border-blue-500 text-blue-700" : "border-green-500 text-green-700"}
                      >
                        {code.codeType || "ICD-O-3"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(code.lastUpdated).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(code)}
                          className="text-primary hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(code.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredCodes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No ICD codes found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReferencesSkeleton() {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex space-x-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4 mb-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
