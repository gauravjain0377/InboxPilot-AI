import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { DashboardStats } from './types';

interface PriorityBreakdownProps {
  stats: DashboardStats;
}

export default function PriorityBreakdown({ stats }: PriorityBreakdownProps) {
  // Calculate the total from priority breakdown
  const totalPriority = stats.priorityBreakdown.high + stats.priorityBreakdown.medium + stats.priorityBreakdown.low;
  
  // If no priority data but we have emails, treat them all as medium
  const displayBreakdown = totalPriority > 0 
    ? stats.priorityBreakdown 
    : { high: 0, medium: stats.totalEmails, low: 0 };
  
  const total = totalPriority > 0 ? totalPriority : stats.totalEmails;
  
  if (stats.totalEmails === 0) return null;

  const getPercentage = (value: number) => {
    if (total === 0) return 0;
    return (value / total) * 100;
  };

  return (
    <Card className="border border-gray-200 bg-white">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gray-600" />
          Priority Breakdown
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          Distribution of emails by priority level
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="space-y-4">
          {/* High Priority */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-900"></div>
                <span className="text-sm text-gray-700">High Priority</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{displayBreakdown.high}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-gray-900 h-1.5 rounded-full transition-all"
                style={{ width: `${getPercentage(displayBreakdown.high)}%` }}
              ></div>
            </div>
          </div>

          {/* Medium Priority */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>
                <span className="text-sm text-gray-700">Medium Priority</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{displayBreakdown.medium}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-gray-500 h-1.5 rounded-full transition-all"
                style={{ width: `${getPercentage(displayBreakdown.medium)}%` }}
              ></div>
            </div>
          </div>

          {/* Low Priority */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                <span className="text-sm text-gray-700">Low Priority</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{displayBreakdown.low}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-gray-300 h-1.5 rounded-full transition-all"
                style={{ width: `${getPercentage(displayBreakdown.low)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Total: <span className="font-medium text-gray-700">{total} emails</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
