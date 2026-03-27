// Modal for editing user avatar — Photo (with crop) or Emoji tabs
import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AvatarSelector } from './AvatarSelector';
import type { AvatarType, AvatarColor } from '../types/avatar';

interface EditAvatarModalProps {
  currentType: string;
  currentColor: string;
  currentAvatarUrl?: string | null;
  onClose: () => void;
}

// Crop the image using canvas, output as 400x400 JPEG blob
function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d')!;

      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        400,
        400
      );

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to crop image'))),
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
  });
}

export function EditAvatarModal({
  currentType,
  currentColor,
  currentAvatarUrl,
  onClose,
}: EditAvatarModalProps) {
  const { user, refreshProfile } = useAuth();
  const [tab, setTab] = useState<'photo' | 'emoji'>(currentAvatarUrl ? 'photo' : 'emoji');
  const [selectedType, setSelectedType] = useState<AvatarType>(currentType as AvatarType);
  const [selectedColor, setSelectedColor] = useState<AvatarColor>(currentColor as AvatarColor);

  // Photo states
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentAvatarUrl || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Crop states
  const [cropSrc, setCropSrc] = useState<string | null>(null); // image being cropped
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emojiChanged = selectedType !== currentType || selectedColor !== currentColor;
  const photoChanged = tab === 'photo' && (photoFile !== null || (currentAvatarUrl && !photoPreview));
  const switchedToEmoji = tab === 'emoji' && !!currentAvatarUrl;
  const hasChanges = emojiChanged || photoChanged || switchedToEmoji;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    // Revoke previous object URL to prevent memory leak
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    // Open crop view instead of setting preview directly
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    // Store file ref for later (we'll use the cropped blob, not this directly)
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedArea) return;
    try {
      const blob = await getCroppedBlob(cropSrc, croppedArea);
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      setPhotoFile(file);
      // Revoke previous preview URL
      if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(URL.createObjectURL(blob));
      // Revoke crop source URL
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
    } catch {
      setError('Failed to crop image. Try a different photo.');
    }
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const handleRemovePhoto = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!hasChanges || !user) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let avatarUrl: string | null = null;

      if (tab === 'photo' && photoFile) {
        // Upload cropped photo (with 1 auto-retry)
        const filePath = `${user.id}/avatar.jpg`;

        let uploadError = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          const result = await supabase.storage
            .from('avatars')
            .upload(filePath, photoFile, {
              contentType: 'image/jpeg',
              upsert: true,
            });
          uploadError = result.error;
          if (!uploadError) break;
          if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
        }

        if (uploadError) {
          setError('Upload failed. Please try again.');
          setSaving(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      }

      // Build update params
      const updateParams: Record<string, string | null> = {
        p_avatar_type: tab === 'emoji' ? selectedType : null,
        p_avatar_color: tab === 'emoji' ? selectedColor : null,
        p_username: null,
        p_display_name: null,
        p_avatar_url: null,
      };

      if (tab === 'photo' && avatarUrl) {
        updateParams.p_avatar_url = avatarUrl;
      } else if (tab === 'photo' && !photoPreview && currentAvatarUrl) {
        updateParams.p_avatar_url = '';
      } else if (tab === 'emoji' && currentAvatarUrl) {
        updateParams.p_avatar_url = '';
        updateParams.p_avatar_type = selectedType;
        updateParams.p_avatar_color = selectedColor;
      } else if (tab === 'emoji') {
        updateParams.p_avatar_type = selectedType;
        updateParams.p_avatar_color = selectedColor;
      }

      const { data, error: rpcError } = await supabase.rpc('update_profile', updateParams);

      if (rpcError) throw rpcError;

      const result = data as { code: string };

      if (result.code !== 'SUCCESS') {
        const errorMessages: Record<string, string> = {
          UNAUTHORIZED: 'You are not authorized to make this change.',
          UNKNOWN_ERROR: 'Something went wrong. Please try again.',
        };
        setError(errorMessages[result.code] || 'Update failed.');
        setSaving(false);
        return;
      }

      await refreshProfile();
      onClose();
    } catch {
      setError('Failed to save changes.');
      setSaving(false);
    }
  };

  // Crop view — shown when user selects a new photo
  if (cropSrc) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full sm:w-auto sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 modal-safe-bottom sm:pb-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4">Position your photo</h2>

          {/* Crop area */}
          <div className="relative w-full rounded-xl overflow-hidden bg-gray-900" style={{ height: 300 }}>
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3 mt-4 px-2">
            <span className="text-xs text-gray-400">-</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-sky-soft-500"
            />
            <span className="text-xs text-gray-400">+</span>
          </div>

          {/* Actions */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={handleCropCancel}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleCropConfirm}
              className="flex-1 py-3 bg-sky-soft-500 text-white rounded-xl font-medium hover:bg-sky-soft-600 transition-colors"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full sm:w-auto sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto modal-safe-bottom sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Change Avatar</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5">
          <button
            onClick={() => setTab('photo')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'photo'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Photo
          </button>
          <button
            onClick={() => setTab('emoji')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'emoji'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Emoji
          </button>
        </div>

        {/* Photo tab */}
        {tab === 'photo' && (
          <div className="flex flex-col items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {photoPreview ? (
              <>
                <div className="w-24 h-24 rounded-full overflow-hidden">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm text-sky-soft-600 border border-sky-soft-300 rounded-lg hover:bg-sky-soft-50 transition-colors"
                  >
                    Change
                  </button>
                  <button
                    onClick={handleRemovePhoto}
                    className="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-sky-soft-400 hover:text-sky-soft-500 transition-colors"
              >
                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs">Upload</span>
              </button>
            )}

            {!photoPreview && (
              <p className="text-xs text-gray-400 text-center">
                Your emoji avatar will show if no photo is set
              </p>
            )}
          </div>
        )}

        {/* Emoji tab */}
        {tab === 'emoji' && (
          <div>
            <AvatarSelector
              selectedType={selectedType}
              selectedColor={selectedColor}
              onTypeChange={setSelectedType}
              onColorChange={setSelectedColor}
            />
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex-1 py-3 bg-sky-soft-500 text-white rounded-xl font-medium hover:bg-sky-soft-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
