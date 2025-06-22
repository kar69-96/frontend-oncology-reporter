import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/layout/navigation";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import PatientDetail from "@/pages/patient-detail";
import References from "@/pages/references";
import APITest from "@/pages/api-test";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 overflow-y-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/patients" component={Patients} />
          <Route path="/patients/:id" component={PatientDetail} />
          <Route path="/references" component={References} />
          <Route path="/api-test" component={APITest} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
