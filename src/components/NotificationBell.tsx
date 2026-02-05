// Notification bell - header icon with unread count badge
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarDisplay } from './AvatarDisplay';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';
import type { Notification, CallRatingValue } from '../types/database';
import { RATING_LABEL } from '../types/database';

// Bell icon
function BellIcon({ hasUnread }: { hasUnread: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={hasUnread ? 'text-sky-soft-600' : 'text-gray-500'}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

// Get notification message
function getNotificationMessage(notif: Notification): string {
  const actorName = notif.actor_display_name || notif.actor_username;
  const ratingLabel = notif.rating ? RATING_LABEL[notif.rating as CallRatingValue] : '';

  if (notif.type === 'like') {
    return `${actorName} liked your ${ratingLabel} call`;
  } else if (notif.type === 'comment') {
    return `${actorName} commented on your ${ratingLabel} call`;
  }
  return `${actorName} interacted with your post`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, isLoading, markAsRead, refetch } = useNotifications(user?.id);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Mark all as read when opening dropdown
  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Refetch to get latest, then mark as read
      await refetch();
      await markAsRead();
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <BellIcon hasUnread={unreadCount > 0} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={() => markAsRead()}
                  className="text-xs text-sky-soft-600 hover:text-sky-soft-700"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="w-6 h-6 border-2 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No notifications yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    When friends interact with your posts, you'll see it here
                  </p>
                </div>
              ) : (
                <div>
                  {notifications.map((notif) => (
                    <NotificationItem key={notif.id} notification={notif} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Individual notification item
function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <div
      className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
        !notification.read ? 'bg-sky-soft-50/50' : ''
      }`}
    >
      {/* Actor avatar */}
      <AvatarDisplay
        avatarType={notification.actor_avatar_type}
        avatarColor={notification.actor_avatar_color}
        size="small"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800">
          {getNotificationMessage(notification)}
        </p>
        {notification.type === 'comment' && notification.comment_preview && (
          <p className="text-xs text-gray-500 mt-0.5 truncate italic">
            "{notification.comment_preview}"
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="w-2 h-2 bg-sky-soft-500 rounded-full flex-shrink-0 mt-2" />
      )}
    </div>
  );
}
