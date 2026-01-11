// Heart management hook - refetch on focus/action (no realtime)
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { HeartWithSender, SendHeartResult, HeartStats } from '../types/heart';
import { getTodayDate } from '../utils/date';

export function useHearts(userId: string | undefined) {
  const [heartsReceived, setHeartsReceived] = useState<HeartWithSender[]>([]);
  const [heartsSent, setHeartsSent] = useState<HeartWithSender[]>([]);
  const [stats, setStats] = useState<HeartStats>({
    total_received: 0,
    total_sent: 0,
    received_today: 0,
    sent_today: 0,
  });
  const [loading, setLoading] = useState(true);

  // Load hearts
  const loadHearts = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const today = getTodayDate();

      // Load hearts received
      const { data: receivedData, error: receivedError } = await supabase
        .from('hearts')
        .select(
          `
          *,
          sender:profiles!hearts_sender_id_fkey(username, display_name, avatar_type, avatar_color)
        `
        )
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      const received: HeartWithSender[] =
        receivedData?.map((h: any) => ({
          ...h,
          sender_username: h.sender.username,
          sender_display_name: h.sender.display_name,
          sender_avatar_type: h.sender.avatar_type,
          sender_avatar_color: h.sender.avatar_color,
        })) || [];

      setHeartsReceived(received);

      // Load hearts sent
      const { data: sentData, error: sentError } = await supabase
        .from('hearts')
        .select(
          `
          *,
          sender:profiles!hearts_sender_id_fkey(username, display_name, avatar_type, avatar_color)
        `
        )
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      const sent: HeartWithSender[] =
        sentData?.map((h: any) => ({
          ...h,
          sender_username: h.sender.username,
          sender_display_name: h.sender.display_name,
          sender_avatar_type: h.sender.avatar_type,
          sender_avatar_color: h.sender.avatar_color,
        })) || [];

      setHeartsSent(sent);

      // Calculate stats
      const receivedToday = received.filter((h) => h.shift_date === today).length;
      const sentToday = sent.filter((h) => h.shift_date === today).length;

      setStats({
        total_received: received.length,
        total_sent: sent.length,
        received_today: receivedToday,
        sent_today: sentToday,
      });
    } catch (err) {
      console.error('Error loading hearts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHearts();
  }, [userId]);

  // Refetch on window focus (instead of realtime subscriptions)
  useEffect(() => {
    const handleFocus = () => {
      loadHearts();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userId]);

  // Send heart to friend
  const sendHeart = async (
    recipientId: string,
    message: string = 'wishes you a white call!'
  ): Promise<SendHeartResult> => {
    if (!userId) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      const today = getTodayDate();

      // Check if already sent today (database will also enforce this)
      const { data: existing } = await supabase
        .from('hearts')
        .select('id')
        .eq('sender_id', userId)
        .eq('recipient_id', recipientId)
        .eq('shift_date', today)
        .single();

      if (existing) {
        return { success: false, error: 'Already sent a heart to this friend today' };
      }

      // Insert heart
      const { data, error } = await supabase
        .from('hearts')
        .insert({
          sender_id: userId,
          recipient_id: recipientId,
          message,
          shift_date: today,
        })
        .select()
        .single();

      if (error) throw error;

      // Reload hearts to update counts
      await loadHearts();

      return { success: true, heart: data };
    } catch (err) {
      console.error('Error sending heart:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to send heart',
      };
    }
  };

  return {
    heartsReceived,
    heartsSent,
    stats,
    loading,
    sendHeart,
    refreshHearts: loadHearts,
  };
}
