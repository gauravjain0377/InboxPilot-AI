import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, Settings } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

export default function DashboardHeader() {
  const { user, logout } = useUserStore();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">InboxPilot AI</h1>
            <p className="text-xs text-slate-500 hidden sm:block">Executive Email Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 hidden sm:block">{user?.email}</span>
          <Link href="/settings">
            <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 bg-white">
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={logout} className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 bg-white">
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}

