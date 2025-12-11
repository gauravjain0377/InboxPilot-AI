import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

interface WelcomeSectionProps {
  userName?: string;
  onSync: () => void;
  syncing: boolean;
}

export default function WelcomeSection({ userName, onSync, syncing }: WelcomeSectionProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {userName || 'User'}
        </h2>
        <p className="text-slate-600">
          Here's your email analytics and account overview
        </p>
      </div>
      <Button
        onClick={onSync}
        disabled={syncing}
        variant="outline"
        className="border-slate-300 text-slate-700 hover:bg-slate-50"
      >
        {syncing ? (
          <>
            <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            Syncing...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4 mr-2" />
            Sync Emails
          </>
        )}
      </Button>
    </div>
  );
}

