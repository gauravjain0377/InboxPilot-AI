import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { DailyDigestItem } from './types';

interface DailyDigestProps {
  digest: DailyDigestItem[];
}

export default function DailyDigest({ digest }: DailyDigestProps) {
  if (digest.length === 0) return null;

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-slate-700" />
          <CardTitle className="text-base font-semibold text-slate-900">Today&apos;s Briefing</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm text-slate-500">
          Top emails that deserve your attention
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {digest.map((item) => (
            <div key={item.id} className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.subject}</p>
                  <p className="text-xs text-slate-500 truncate">{item.from}</p>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(item.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                {item.priority && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} priority
                  </span>
                )}
                {item.category && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{item.category}</span>
                )}
                {item.hasAiSuggestion && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white">AI draft ready</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-500 line-clamp-1">{item.snippet}</p>
                <Link
                  href={`https://mail.google.com/mail/u/0/#all/${item.gmailId}`}
                  target="_blank"
                  className="text-xs text-slate-900 font-medium ml-2 whitespace-nowrap"
                >
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

