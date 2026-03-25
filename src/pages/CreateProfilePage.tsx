// Profile creation page (post-signup)
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AvatarSelector } from '../components/AvatarSelector';
import type { AvatarType, AvatarColor } from '../types/avatar';

// Resize image to max 400x400 JPEG before upload
function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSize = 400;
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; }
      } else {
        if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create image'))),
        'image/jpeg',
        0.8
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export default function CreateProfilePage() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarType, setAvatarType] = useState<AvatarType>('penguin');
  const [avatarColor, setAvatarColor] = useState<AvatarColor>('blue');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, profile, authStatus, profileStatus, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Wait for auth and profile status to resolve
  if (authStatus === 'initializing' || profileStatus === 'idle' || profileStatus === 'loading') {
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
  if (authStatus === 'signed_out' || !user) {
    navigate('/login');
    return null;
  }

  // If user already has a profile, redirect to home
  if (profileStatus === 'exists' || profile) {
    navigate('/home');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to create a profile');
      return;
    }

    // Validate username
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedDisplayName = displayName.trim();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      setError('Username must be 3-20 characters long');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      setError('Username can only contain lowercase letters, numbers, and underscores');
      return;
    }

    // Validate display name (required)
    if (trimmedDisplayName.length < 1) {
      setError('Display name is required');
      return;
    }
    if (trimmedDisplayName.length > 50) {
      setError('Display name must be 50 characters or less');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Check if user already has a profile (redirect if so)
      // Note: Ignore errors here - if SELECT fails, we'll catch it on INSERT
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (myProfile) {
        await refreshProfile();
        navigate('/home');
        return;
      }

      // Check if username is available
      // Note: Ignore errors - if this fails, INSERT will catch duplicates
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', trimmedUsername)
        .maybeSingle();

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

      // Detect user's timezone automatically
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        username: trimmedUsername,
        display_name: trimmedDisplayName,
        avatar_type: avatarType,
        avatar_color: colorHex,
        timezone: userTimezone,
      });

      if (insertError) {
        // Handle specific error codes
        if (insertError.code === '23505') {
          // Unique violation - either id or username already exists
          if (insertError.message.includes('username')) {
            setError('Username already taken. Please choose another.');
          } else {
            // Profile with this id exists - refresh and redirect
            await refreshProfile();
            navigate('/home');
            return;
          }
          setLoading(false);
          return;
        }
        throw insertError;
      }

      // Upload profile photo if selected
      if (photoFile) {
        try {
          const resized = await resizeImage(photoFile);
          const filePath = `${user.id}/avatar.jpg`;

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, resized, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);

            // Save the URL to profile
            await supabase.rpc('update_profile', {
              p_avatar_type: null,
              p_avatar_color: null,
              p_username: null,
              p_display_name: null,
              p_avatar_url: `${urlData.publicUrl}?t=${Date.now()}`,
            });
          }
          // Photo upload failure is non-critical — emoji avatar is the fallback
        } catch {
          // Silent fail — photo upload is optional
        }
      }

      // Refresh profile in AuthContext so HomePage has it immediately
      await refreshProfile();

      // Navigate to home
      navigate('/home');
    } catch (err) {
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
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setPhotoFile(file);
                  setPhotoPreview(URL.createObjectURL(file));
                }
              }}
              className="hidden"
            />
            {photoPreview ? (
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-400 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-500"
                >
                  &times;
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-sky-soft-400 hover:text-sky-soft-500 transition-colors"
              >
                <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[10px]">Photo</span>
              </button>
            )}
            <p className="text-xs text-gray-400">Optional — or choose an avatar below</p>
          </div>

          {/* Emoji Avatar Selection */}
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
              Display Name *
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={50}
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
            disabled={loading || username.trim().length < 3 || displayName.trim().length < 1}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg"
          >
            {loading ? 'Creating profile...' : 'Complete Setup'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
