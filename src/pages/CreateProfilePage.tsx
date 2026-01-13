// Profile creation page (post-signup)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AvatarSelector } from '../components/AvatarSelector';
import type { AvatarType, AvatarColor } from '../types/avatar';

export default function CreateProfilePage() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarType, setAvatarType] = useState<AvatarType>('penguin');
  const [avatarColor, setAvatarColor] = useState<AvatarColor>('blue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // If still loading auth, show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, redirect to login
  if (!authLoading && !user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!', { user, username });

    if (!user) {
      console.error('No user found!');
      setError('You must be logged in to create a profile');
      return;
    }

    // Validate username
    const trimmedUsername = username.trim().toLowerCase();
    console.log('Validating username:', trimmedUsername);

    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      setError('Username must be 3-20 characters long');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      setError('Username can only contain lowercase letters, numbers, and underscores');
      return;
    }

    setError(null);
    setLoading(true);

    // Debug: Check auth state before profile creation
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Debug - Creating profile:', {
      userId: user.id,
      sessionExists: !!sessionData.session,
      sessionUserId: sessionData.session?.user?.id,
      accessToken: sessionData.session?.access_token ? 'present' : 'missing',
    });

    try {
      // Check if user already has a profile (redirect if so)
      // Note: Ignore errors here - if SELECT fails, we'll catch it on INSERT
      const { data: myProfile, error: myProfileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      console.log('Profile check:', { myProfile, myProfileError });

      if (myProfile) {
        console.log('Profile already exists, redirecting to home');
        await refreshProfile();
        navigate('/home');
        return;
      }

      // Check if username is available
      // Note: Ignore errors - if this fails, INSERT will catch duplicates
      const { data: existingProfile, error: usernameCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', trimmedUsername)
        .maybeSingle();

      console.log('Username check:', { existingProfile, usernameCheckError });

      if (existingProfile) {
        setError('Username already taken. Please choose another.');
        setLoading(false);
        return;
      }

      // Create profile
      const colorHex = {
        pink: '#FFB6C1',
        blue: '#87CEEB',
        purple: '#DDA0DD',
        green: '#98FB98',
        yellow: '#FFFACD',
        peach: '#FFDAB9',
      }[avatarColor];

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        username: trimmedUsername,
        display_name: displayName.trim() || null,
        avatar_type: avatarType,
        avatar_color: colorHex,
      });

      if (insertError) {
        // Handle specific error codes
        if (insertError.code === '23505') {
          // Unique violation - either id or username already exists
          if (insertError.message.includes('username')) {
            setError('Username already taken. Please choose another.');
          } else {
            // Profile with this id exists - refresh and redirect
            console.log('Profile already exists (conflict), redirecting');
            await refreshProfile();
            navigate('/home');
            return;
          }
          setLoading(false);
          return;
        }
        throw insertError;
      }

      // Refresh profile in AuthContext so HomePage has it immediately
      await refreshProfile();

      // Navigate to home
      navigate('/home');
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to create profile');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-soft-50 to-white-call-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-soft-lg p-8 w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Your Profile</h1>
          <p className="text-gray-600">Choose your avatar and set up your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Selection */}
          <AvatarSelector
            selectedType={avatarType}
            selectedColor={avatarColor}
            onTypeChange={setAvatarType}
            onColorChange={setAvatarColor}
          />

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              minLength={3}
              maxLength={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-soft-500 focus:border-transparent outline-none"
              placeholder="johndoe (3-20 characters, lowercase, numbers, underscore)"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              This is how friends will find you. Only lowercase letters, numbers, and underscores.
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Display Name (Optional)
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-soft-500 focus:border-transparent outline-none"
              placeholder="Dr. John Doe"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Your display name can include capitals and spaces.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading || username.trim().length < 3}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg"
          >
            {loading ? 'Creating profile...' : 'Complete Setup'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
