import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { DashboardStats } from './types';

interface CategoryStatsProps {
  stats: DashboardStats;
}

export default function CategoryStats({ stats }: CategoryStatsProps) {
  if (stats.categoryStats.length === 0) return null;

  return (
    <Card className="border border-gray-200 bg-white">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="h-4 w-4 text-gray-600" />
          Top Categories
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          Most common email categories
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="space-y-3">
          {stats.categoryStats.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{category.name}</span>
              <span className="text-sm font-semibold text-gray-900">{category.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
