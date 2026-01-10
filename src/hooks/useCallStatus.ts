// Call status management hook
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';

export function useCallStatus(userId: string | undefined) {
  const [updating, setUpdating] = useState(false);
  const { updateCallStatus } = useStore();

  const toggleCallStatus = async (isOnCall: boolean): Promise<boolean> => {
    if (!userId) return false;

    try {
      setUpdating(true);

      // Get current date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('profiles')
        .update({
          is_on_call: isOnCall,
          call_date: isOnCall ? today : null // Set call_date when turning on, clear when turning off
        })
        .eq('id', userId);

      if (error) throw error;

      // Update store
      updateCallStatus(isOnCall, isOnCall ? today : null);

      return true;
    } catch (err) {
      console.error('Error updating call status:', err);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    updating,
    toggleCallStatus,
  };
}
