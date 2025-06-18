import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { DashboardMetrics } from "@/lib/types";

interface DashboardChartsProps {
  metrics: DashboardMetrics;
}

export function DashboardCharts({ metrics }: DashboardChartsProps) {
  const maxSubmissionCount = Math.max(...metrics.monthlySubmissions.map(m => m.count));

  const totalPatients = metrics.statusDistribution.reduce((sum, status) => sum + status.count, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Submissions Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monthly Submissions</CardTitle>
            <Select defaultValue="6months">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">Last 6 months</SelectItem>
                <SelectItem value="1year">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.monthlySubmissions.map((submission) => (
              <div key={submission.month} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-8">{submission.month}</span>
                <div className="flex-1 mx-4">
                  <Progress 
                    value={(submission.count / maxSubmissionCount) * 100} 
                    className="h-2"
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-8 text-right">
                  {submission.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.statusDistribution.map((status) => {
              const percentage = totalPatients > 0 ? (status.count / totalPatients) * 100 : 0;
              
              let statusConfig = {
                label: status.status,
                color: "bg-gray-500"
              };

              switch (status.status) {
                case "completed":
                  statusConfig = { label: "Completed", color: "bg-green-500" };
                  break;
                case "in_progress":
                  statusConfig = { label: "In Progress", color: "bg-yellow-500" };
                  break;
                case "needs_review":
                  statusConfig = { label: "Needs Review", color: "bg-red-500" };
                  break;
                case "submitted":
                  statusConfig = { label: "Submitted", color: "bg-blue-500" };
                  break;
              }

              return (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${statusConfig.color}`} />
                    <span className="text-sm text-gray-600">{statusConfig.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={percentage} className="w-24 h-2" />
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
