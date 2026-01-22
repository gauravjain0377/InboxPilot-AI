import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Briefcase, Calendar, MessageSquare, Tag, Mail, DollarSign, Users, Package, Bell, Megaphone, FileText } from 'lucide-react';
import { DashboardStats } from './types';

interface CategoryStatsProps {
  stats: DashboardStats;
}

// Category styling configuration matching EmailList
const CATEGORY_STYLES: Record<string, { bg: string; text: string; icon: any; lightBg: string }> = {
  'Work': { bg: 'bg-blue-500', lightBg: 'bg-blue-50', text: 'text-blue-700', icon: Briefcase },
  'Task': { bg: 'bg-purple-500', lightBg: 'bg-purple-50', text: 'text-purple-700', icon: FileText },
  'Meeting': { bg: 'bg-indigo-500', lightBg: 'bg-indigo-50', text: 'text-indigo-700', icon: Calendar },
  'Reply Needed': { bg: 'bg-orange-500', lightBg: 'bg-orange-50', text: 'text-orange-700', icon: MessageSquare },
  'Newsletter': { bg: 'bg-cyan-500', lightBg: 'bg-cyan-50', text: 'text-cyan-700', icon: Mail },
  'Promotion': { bg: 'bg-pink-500', lightBg: 'bg-pink-50', text: 'text-pink-700', icon: Megaphone },
  'Finance': { bg: 'bg-emerald-500', lightBg: 'bg-emerald-50', text: 'text-emerald-700', icon: DollarSign },
  'Social': { bg: 'bg-violet-500', lightBg: 'bg-violet-50', text: 'text-violet-700', icon: Users },
  'Update': { bg: 'bg-gray-500', lightBg: 'bg-gray-50', text: 'text-gray-700', icon: Bell },
  'Shipping': { bg: 'bg-amber-500', lightBg: 'bg-amber-50', text: 'text-amber-700', icon: Package },
};

const getStyle = (name: string) => {
  return CATEGORY_STYLES[name] || { bg: 'bg-gray-500', lightBg: 'bg-gray-50', text: 'text-gray-700', icon: Tag };
};

export default function CategoryStats({ stats }: CategoryStatsProps) {
  if (stats.categoryStats.length === 0) return null;

  const total = stats.categoryStats.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <Card className="border border-gray-200 bg-white">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="h-4 w-4 text-gray-600" />
          Email Categories
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          Distribution of {total} categorized emails
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        {/* Visual Category Bar */}
        {total > 0 && (
          <div className="mb-5">
            <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
              {stats.categoryStats.map((category, index) => {
                const style = getStyle(category.name);
                const width = (category.count / total) * 100;
                return (
                  <div 
                    key={index}
                    className={`${style.bg} transition-all duration-500`}
                    style={{ width: `${width}%` }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Category List */}
        <div className="space-y-2">
          {stats.categoryStats.slice(0, 6).map((category, index) => {
            const style = getStyle(category.name);
            const Icon = style.icon;
            const percentage = total > 0 ? ((category.count / total) * 100).toFixed(0) : 0;
            
            return (
              <div 
                key={index} 
                className={`flex items-center justify-between p-2.5 rounded-lg ${style.lightBg} transition-all hover:shadow-sm`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-md ${style.bg} flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className={`text-sm font-medium ${style.text}`}>{category.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{percentage}%</span>
                  <span className={`text-sm font-bold ${style.text} min-w-[24px] text-right`}>
                    {category.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show more indicator */}
        {stats.categoryStats.length > 6 && (
          <p className="mt-3 text-xs text-gray-400 text-center">
            +{stats.categoryStats.length - 6} more categories
          </p>
        )}
      </CardContent>
    </Card>
  );
}
