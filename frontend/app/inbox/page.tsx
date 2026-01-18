'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

export default function InboxPage() {
  const router = useRouter();
  const { user } = useUserStore();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      // Redirect to dashboard - all email features work in Gmail Add-on
      router.push('/dashboard');
    }
  }, [user, router]);

  return null;
}
