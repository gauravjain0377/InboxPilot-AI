'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import api from '@/lib/axios';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import WelcomeSection from '@/components/dashboard/WelcomeSection';
import StatsGrid from '@/components/dashboard/StatsGrid';
import PriorityBreakdown from '@/components/dashboard/PriorityBreakdown';
import AccountInfo from '@/components/dashboard/AccountInfo';
import CategoryStats from '@/components/dashboard/CategoryStats';
import EmailActivity from '@/components/dashboard/EmailActivity';
import AIActivity from '@/components/dashboard/AIActivity';
import AttentionBudget from '@/components/dashboard/AttentionBudget';
import DailyDigest from '@/components/dashboard/DailyDigest';
import RelationshipRadar from '@/components/dashboard/RelationshipRadar';
import CommunicationCoach from '@/components/dashboard/CommunicationCoach';
import GmailIntegrationStatus from '@/components/dashboard/GmailIntegrationStatus';
import type {
  DashboardStats,
  AttentionOverview,
  DailyDigestItem,
  RelationshipSummary,
  CommunicationInsights,
} from '@/components/dashboard/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attention, setAttention] = useState<AttentionOverview | null>(null);
  const [digest, setDigest] = useState<DailyDigestItem[]>([]);
  const [relationships, setRelationships] = useState<RelationshipSummary[]>([]);
  const [communication, setCommunication] = useState<CommunicationInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [dashboardRes, attentionRes, digestRes, relationshipsRes, communicationRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/attention'),
        api.get('/analytics/daily-digest'),
        api.get('/analytics/relationships'),
        api.get('/analytics/communication'),
      ]);

      setStats(dashboardRes.data.stats);
      setAttention(attentionRes.data.attention ?? null);
      setDigest(digestRes.data.items ?? []);
      setRelationships(relationshipsRes.data?.relationships?.topContacts ?? []);
      setCommunication(communicationRes.data?.communication ?? null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncEmails = async () => {
    try {
      setSyncing(true);
      await api.get('/gmail/messages?maxResults=100');
      await fetchStats();
    } catch (error) {
      console.error('Error syncing emails:', error);
      alert('Failed to sync emails. Please check your Gmail connection.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const autoSyncOnLoad = async () => {
      try {
        const dashboardRes = await api.get('/analytics/dashboard');
        const totalEmails = dashboardRes.data.stats?.totalEmails || 0;

        if (totalEmails === 0) {
          try {
            setSyncing(true);
            await api.get('/gmail/messages?maxResults=100');
          } catch (syncError) {
            console.error('Error syncing emails on load:', syncError);
          } finally {
            setSyncing(false);
          }
        }

        fetchStats();
      } catch (error) {
        console.error('Error in auto-sync:', error);
        fetchStats();
      }
    };

    autoSyncOnLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchStats();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
        <WelcomeSection
          userName={stats?.userInfo?.name?.split(' ')[0] || user.name?.split(' ')[0]}
          onSync={syncEmails}
          syncing={syncing}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-600">Loading analytics...</div>
          </div>
        ) : stats ? (
          <>
            <StatsGrid stats={stats} />

            <div className="grid gap-6 lg:grid-cols-3 mb-8">
              <PriorityBreakdown stats={stats} />
              <AccountInfo stats={stats} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <CategoryStats stats={stats} />
              <EmailActivity stats={stats} />
            </div>

            <AIActivity stats={stats} />

            {(attention && attention.today.total > 0) || digest.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
                {attention && attention.today.total > 0 && <AttentionBudget attention={attention} />}
                {digest.length > 0 && <DailyDigest digest={digest} />}
                </div>
            ) : null}

            {(relationships.length > 0 || (communication && communication.totalSent + communication.totalReceived > 0)) ? (
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
                {relationships.length > 0 && <RelationshipRadar relationships={relationships} />}
                {communication && communication.totalSent + communication.totalReceived > 0 && (
                  <CommunicationCoach communication={communication} />
                            )}
                          </div>
            ) : null}

            <GmailIntegrationStatus stats={stats} />
          </>
        ) : (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-600">No data available</div>
          </div>
        )}
      </div>
    </div>
  );
}
