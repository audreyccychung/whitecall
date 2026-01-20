// Join group page - handles invite link redemption
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useGroupInvite } from '../hooks/useGroupInvite';
import type { InviteCodeInfo } from '../types/group';

export default function JoinGroupPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { getInviteCodeInfo, joinGroupByCode, isLoadingInfo, isJoining } = useGroupInvite();

  const [inviteInfo, setInviteInfo] = useState<InviteCodeInfo | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<{ groupId: string; groupName: string } | null>(null);

  // Load invite code info on mount
  useEffect(() => {
    if (!code) return;

    const loadInfo = async () => {
      const info = await getInviteCodeInfo(code);
      setInviteInfo(info);
    };

    loadInfo();
  }, [code, getInviteCodeInfo]);

  // Handle join button
  const handleJoin = async () => {
    if (!code) return;

    setJoinError(null);

    const result = await joinGroupByCode(code);

    if (result.success) {
      setJoinSuccess({
        groupId: result.groupId!,
        groupName: result.groupName!,
      });
    } else {
      // Handle ALREADY_MEMBER specially - navigate to the group
      if (result.code === 'ALREADY_MEMBER' && result.groupId) {
        navigate(`/groups/${result.groupId}`);
        return;
      }
      setJoinError(result.message);
    }
  };

  // Render error states for invalid codes
  const renderInvalidState = () => {
    const reason = inviteInfo?.reason;
    let emoji = '❌';
    let title = 'Invalid Link';
    let message = 'This invite link is not valid.';

    if (reason === 'CODE_EXPIRED') {
      emoji = '⏰';
      title = 'Link Expired';
      message = 'This invite link has expired. Ask the group owner for a new one.';
    } else if (reason === 'GROUP_FULL') {
      emoji = '👥';
      title = 'Group Full';
      message = `${inviteInfo?.group_name || 'This group'} has reached the maximum of 20 members.`;
    }

    return (
      <div className="text-center py-8">
        <p className="text-6xl mb-4">{emoji}</p>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <Link
          to="/groups"
          className="inline-block px-6 py-2 bg-sky-soft-500 text-white rounded-lg font-medium hover:bg-sky-soft-600 transition-colors"
        >
          Go to Groups
        </Link>
      </div>
    );
  };

  // Show loading state
  if (authLoading || isLoadingInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-soft-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading invite...</p>
        </div>
      </div>
    );
  }

  // Show success state after joining
  if (joinSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-soft-lg p-8 max-w-md w-full text-center"
        >
          <p className="text-6xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">You're in!</h2>
          <p className="text-gray-600 mb-6">
            You joined <span className="font-medium">{joinSuccess.groupName}</span>
          </p>
          <button
            onClick={() => navigate(`/groups/${joinSuccess.groupId}`)}
            className="w-full py-3 bg-sky-soft-500 text-white rounded-xl font-medium hover:bg-sky-soft-600 transition-colors"
          >
            View Group
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-soft-lg p-8 max-w-md w-full"
      >
        {/* Invalid or expired code */}
        {inviteInfo && !inviteInfo.valid && renderInvalidState()}

        {/* Valid code - show join prompt */}
        {inviteInfo?.valid && (
          <div className="text-center">
            <p className="text-6xl mb-4">👋</p>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Join {inviteInfo.group_name}
            </h2>
            <p className="text-gray-600 mb-2">
              You've been invited to join this group
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {inviteInfo.member_count} member{inviteInfo.member_count !== 1 ? 's' : ''}
            </p>

            {joinError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {joinError}
              </div>
            )}

            {/* Not logged in - show sign in prompt */}
            {!user && (
              <div className="space-y-3">
                <Link
                  to={`/login?redirect=/join/${code}`}
                  className="block w-full py-3 bg-sky-soft-500 text-white rounded-xl font-medium hover:bg-sky-soft-600 transition-colors"
                >
                  Sign in to join
                </Link>
                <p className="text-sm text-gray-500">
                  Don't have an account?{' '}
                  <Link to={`/signup?redirect=/join/${code}`} className="text-sky-soft-600 font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            )}

            {/* Logged in - show join button */}
            {user && (
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full py-3 bg-sky-soft-500 text-white rounded-xl font-medium hover:bg-sky-soft-600 disabled:opacity-50 transition-colors"
              >
                {isJoining ? 'Joining...' : 'Join Group'}
              </button>
            )}
          </div>
        )}

        {/* No invite info yet (shouldn't happen if loading handled correctly) */}
        {!inviteInfo && (
          <div className="text-center py-8">
            <p className="text-6xl mb-4">🔍</p>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Link</h2>
            <p className="text-gray-600 mb-6">This invite link is not valid.</p>
            <Link
              to="/groups"
              className="inline-block px-6 py-2 bg-sky-soft-500 text-white rounded-lg font-medium hover:bg-sky-soft-600 transition-colors"
            >
              Go to Groups
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
