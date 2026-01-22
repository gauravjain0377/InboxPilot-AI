import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { DashboardStats } from './types';

interface EmailActivityProps {
  stats: DashboardStats;
}

export default function EmailActivity({ stats }: EmailActivityProps) {
  if (stats.emailsOverTime.length === 0) return null;

  return (
    <Card className="border border-gray-200 bg-white">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          Recent Activity
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          Emails processed in the last 7 days
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="space-y-3">
          {stats.emailsOverTime.slice(-7).map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-sm font-semibold text-gray-900">{item.count} emails</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
