import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { DashboardStats } from './types';

interface CategoryStatsProps {
  stats: DashboardStats;
}

export default function CategoryStats({ stats }: CategoryStatsProps) {
  if (stats.categoryStats.length === 0) return null;

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-700" />
          Top Categories
        </CardTitle>
        <CardDescription className="text-sm text-slate-500">
          Most common email categories
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {stats.categoryStats.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">{category.name}</span>
              <span className="text-sm font-semibold text-slate-900">{category.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

