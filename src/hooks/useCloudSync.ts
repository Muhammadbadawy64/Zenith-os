"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/store";

const SYNC_PREFIXES = ["brainhance-", "zenith-"];

export function useCloudSync() {
  const { user } = useAuthStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Sync to Cloud
  const syncToCloud = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsSyncing(true);
      const stateToSync: Record<string, any> = {};

      // Gather all local storage keys that match our prefixes
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && SYNC_PREFIXES.some((p) => key.startsWith(p))) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              stateToSync[key] = JSON.parse(value);
            } catch (e) {
              // If not JSON, skip or save as string
              stateToSync[key] = value;
            }
          }
        }
      }

      const { error } = await supabase
        .from("user_state")
        .upsert(
          { 
            user_id: user.id, 
            state: stateToSync,
            updated_at: new Date().toISOString()
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Cloud sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // Sync from Cloud
  const syncFromCloud = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsSyncing(true);
      const { data, error } = await supabase
        .from("user_state")
        .select("state")
        .eq("user_id", user.id)
        .single();

      if (error) {
         if (error.code === 'PGRST116') {
             // No data found, nothing to sync down.
             return;
         }
         throw error;
      }

      if (data?.state) {
        // Restore each key
        Object.entries(data.state).forEach(([key, value]) => {
          localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        });
        
        setLastSyncTime(new Date());
        
        // Dispatch storage event to force Zustand to rehydrate across the app
        window.dispatchEvent(new Event('storage'));
        
        // Force reload to apply all states cleanly
        window.location.reload();
      }
    } catch (err) {
      console.error("Cloud restore failed:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // Setup periodic sync (e.g., every 5 minutes if there are changes)
  // For now, we rely on manual sync or explicit triggers.

  return {
    syncToCloud,
    syncFromCloud,
    isSyncing,
    lastSyncTime
  };
}
