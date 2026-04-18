'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ActivityTracker({ userId }: { userId: string | undefined }) {
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    const updateStatus = async () => {
      // Note: This requires an RLS policy allowing users to update their own last_seen
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId);
    };

    // Initial update when they open the app
    updateStatus();

    // Heartbeat: Update every 5 minutes while the tab is active
    const interval = setInterval(updateStatus, 1000 * 60 * 5);

    return () => clearInterval(interval);
  }, [userId, supabase]);

  return null; // This component doesn't render anything UI-wise
}
