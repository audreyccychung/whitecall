// User settings management hook
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';
import type { UserSettings } from '../types/database';

export function useSettings(userId: string | undefined) {
  const [updating, setUpdating] = useState(false);
  const { settings, setSettings } = useStore();

  const updateSettings = async (
    updates: Partial<Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      setUpdating(true);

      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Update store
      if (data) {
        setSettings(data);
      }

      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const toggleSound = async () => {
    if (!settings) return false;
    return updateSettings({ sound_enabled: !settings.sound_enabled });
  };

  const toggleHaptic = async () => {
    if (!settings) return false;
    return updateSettings({ haptic_enabled: !settings.haptic_enabled });
  };

  const toggleNotifications = async () => {
    if (!settings) return false;
    return updateSettings({ notifications_enabled: !settings.notifications_enabled });
  };

  return {
    settings,
    updating,
    updateSettings,
    toggleSound,
    toggleHaptic,
    toggleNotifications,
  };
}
