import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ArrowUp, ArrowDown, Minus } from 'lucide-react';
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

  const priorities = [
    {
      key: 'high',
      label: 'High Priority',
      value: displayBreakdown.high,
      percentage: getPercentage(displayBreakdown.high),
      icon: ArrowUp,
      bgColor: 'bg-red-500',
      lightBg: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      description: 'Urgent emails requiring immediate attention',
    },
    {
      key: 'medium',
      label: 'Medium Priority',
      value: displayBreakdown.medium,
      percentage: getPercentage(displayBreakdown.medium),
      icon: Minus,
      bgColor: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      description: 'Standard emails with normal importance',
    },
    {
      key: 'low',
      label: 'Low Priority',
      value: displayBreakdown.low,
      percentage: getPercentage(displayBreakdown.low),
      icon: ArrowDown,
      bgColor: 'bg-green-500',
      lightBg: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      description: 'Newsletters, promotions, and updates',
    },
  ];

  return (
    <Card className="border border-gray-200 bg-white">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gray-600" />
          Priority Breakdown
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          Distribution of {total} emails by priority level
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        {/* Visual Priority Bar */}
        <div className="mb-6">
          <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
            {displayBreakdown.high > 0 && (
              <div 
                className="bg-red-500 transition-all duration-500"
                style={{ width: `${getPercentage(displayBreakdown.high)}%` }}
              />
            )}
            {displayBreakdown.medium > 0 && (
              <div 
                className="bg-amber-500 transition-all duration-500"
                style={{ width: `${getPercentage(displayBreakdown.medium)}%` }}
              />
            )}
            {displayBreakdown.low > 0 && (
              <div 
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${getPercentage(displayBreakdown.low)}%` }}
              />
            )}
          </div>
        </div>

        {/* Priority Items */}
        <div className="space-y-3">
          {priorities.map((priority) => {
            const Icon = priority.icon;
            return (
              <div 
                key={priority.key}
                className={`flex items-center justify-between p-3 rounded-xl border ${priority.lightBg} ${priority.borderColor} transition-all hover:shadow-sm`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${priority.bgColor} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${priority.textColor}`}>
                      {priority.label}
                    </p>
                    <p className="text-xs text-gray-500 hidden sm:block">
                      {priority.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${priority.textColor}`}>
                    {priority.value}
                  </p>
                  <p className="text-xs text-gray-500">
                    {priority.percentage.toFixed(0)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Total analyzed: <span className="font-medium text-gray-700">{total} emails</span>
            </span>
            {displayBreakdown.high > 0 && (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <ArrowUp className="w-3 h-3" />
                {displayBreakdown.high} need attention
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
