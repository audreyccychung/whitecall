// Avatar selection component for profile creation
import { AVATAR_TYPES, AVATAR_COLORS, getAvatarEmoji } from '../types/avatar';
import type { AvatarType, AvatarColor } from '../types/avatar';

interface AvatarSelectorProps {
  selectedType: AvatarType;
  selectedColor: AvatarColor;
  onTypeChange: (type: AvatarType) => void;
  onColorChange: (color: AvatarColor) => void;
}

const colorValues: Record<AvatarColor, string> = {
  pink: '#FFB6C1',
  blue: '#87CEEB',
  purple: '#DDA0DD',
  green: '#98FB98',
  yellow: '#FFFACD',
  peach: '#FFDAB9',
};

export function AvatarSelector({
  selectedType,
  selectedColor,
  onTypeChange,
  onColorChange,
}: AvatarSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="text-center">
        <div
          className="w-32 h-32 rounded-full mx-auto flex items-center justify-center text-8xl mb-2 transition-all duration-300"
          style={{ backgroundColor: colorValues[selectedColor] }}
        >
          {getAvatarEmoji(selectedType)}
        </div>
        <p className="text-sm text-gray-600">Your Avatar</p>
      </div>

      {/* Animal Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose Your Animal
        </label>
        <div className="grid grid-cols-4 gap-3">
          {AVATAR_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className={`p-4 rounded-xl border-2 transition-all text-4xl hover:scale-105 ${
                selectedType === type
                  ? 'border-sky-soft-500 bg-sky-soft-50 shadow-md'
                  : 'border-gray-200 hover:border-sky-soft-300'
              }`}
            >
              {getAvatarEmoji(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Choose Your Color</label>
        <div className="grid grid-cols-6 gap-3">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-12 h-12 rounded-full border-4 transition-all hover:scale-110 ${
                selectedColor === color
                  ? 'border-gray-800 shadow-lg scale-110'
                  : 'border-gray-300'
              }`}
              style={{ backgroundColor: colorValues[color] }}
              aria-label={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
