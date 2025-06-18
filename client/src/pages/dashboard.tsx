import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle, Clock, AlertTriangle, ArrowRight, Search } from "lucide-react";
import { DashboardCharts } from "@/components/charts/dashboard-charts";
import { Link } from "wouter";
import type { DashboardMetrics, Patient } from "@/lib/types";
import { PATIENT_STATUSES } from "@/lib/constants";

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: patients = [], isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const recentPatients = patients.slice(0, 10);

  if (metricsLoading || patientsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Patient Overview Pane */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Recent Patients</h2>
            <Link href="/patients">
              <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700 text-sm font-medium">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search patients..."
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {recentPatients.map((patient) => (
            <Link key={patient.id} href={`/patients/${patient.id}`}>
              <div className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className={`status-dot ${patient.status}`} />
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {patient.name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">MRN: {patient.mrn}</p>
                    <p className="text-xs text-gray-400">
                      Updated {new Date(patient.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={PATIENT_STATUSES[patient.status as keyof typeof PATIENT_STATUSES].color}
                  >
                    {PATIENT_STATUSES[patient.status as keyof typeof PATIENT_STATUSES].label}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Dashboard Metrics */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {metrics?.totalPatients || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-primary text-xl" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-600 text-sm font-medium">+12%</span>
                <span className="text-gray-500 text-sm ml-2">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Reports</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {metrics?.completedReports || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-600 text-xl" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-600 text-sm font-medium">+8%</span>
                <span className="text-gray-500 text-sm ml-2">completion rate</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {metrics?.pendingReviews || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-yellow-600 text-xl" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-yellow-600 text-sm font-medium">-5%</span>
                <span className="text-gray-500 text-sm ml-2">from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Error Flags</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {metrics?.errorFlags || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-red-600 text-xl" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-red-600 text-sm font-medium">+3</span>
                <span className="text-gray-500 text-sm ml-2">new this week</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        {metrics && <DashboardCharts metrics={metrics} />}

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              <div className="py-4 flex items-center space-x-4">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    Report completed for <span className="font-medium">Sarah Johnson</span>
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="py-4 flex items-center space-x-4">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    New document uploaded for <span className="font-medium">Michael Chen</span>
                  </p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
              <div className="py-4 flex items-center space-x-4">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    Review requested for <span className="font-medium">Emma Rodriguez</span>
                  </p>
                  <p className="text-xs text-gray-500">6 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-80 bg-white border-r border-gray-200 p-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    </div>
  );
}
