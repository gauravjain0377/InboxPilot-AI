import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { RelationshipSummary } from './types';

interface RelationshipRadarProps {
  relationships: RelationshipSummary[];
}

export default function RelationshipRadar({ relationships }: RelationshipRadarProps) {
  if (relationships.length === 0) return null;

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-700" />
          <CardTitle className="text-base font-semibold text-slate-900">Relationship Radar</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm text-slate-500">
          People you&apos;re talking to the most
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {relationships.slice(0, 10).map((rel) => (
            <div key={rel.contact} className="flex items-center justify-between text-sm">
              <div className="flex flex-col">
                <span className="font-medium text-slate-900 truncate max-w-[180px]">{rel.contact}</span>
                {rel.lastSubject && (
                  <span className="text-xs text-slate-500 truncate max-w-[220px]">{rel.lastSubject}</span>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">
                  {new Date(rel.lastInteractionAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-slate-500">{rel.totalEmails} emails</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

