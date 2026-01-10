// Avatar type definitions for WhiteCall

export type AvatarType =
  | 'penguin'
  | 'bear'
  | 'cat'
  | 'dog'
  | 'rabbit'
  | 'fox'
  | 'owl'
  | 'panda';

export type AvatarColor =
  | 'pink'
  | 'blue'
  | 'purple'
  | 'green'
  | 'yellow'
  | 'peach';

export type AvatarSize = 'small' | 'medium' | 'large';

export interface Avatar {
  type: AvatarType;
  color: AvatarColor;
}

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_type: AvatarType;
  avatar_color: AvatarColor;
  created_at: Date;
  updated_at?: Date;
}

// Helper to get emoji for avatar type
export const getAvatarEmoji = (type: AvatarType): string => {
  const emojiMap: Record<AvatarType, string> = {
    penguin: '🐧',
    bear: '🐻',
    cat: '🐱',
    dog: '🐶',
    rabbit: '🐰',
    fox: '🦊',
    owl: '🦉',
    panda: '🐼',
  };
  return emojiMap[type];
};

// Helper to get color value
export const getAvatarColorValue = (color: AvatarColor): string => {
  const colorMap: Record<AvatarColor, string> = {
    pink: 'var(--color-pastel-pink)',
    blue: 'var(--color-pastel-blue)',
    purple: 'var(--color-pastel-purple)',
    green: 'var(--color-pastel-green)',
    yellow: 'var(--color-pastel-yellow)',
    peach: 'var(--color-pastel-peach)',
  };
  return colorMap[color];
};

// All available avatar types
export const AVATAR_TYPES: AvatarType[] = [
  'penguin',
  'bear',
  'cat',
  'dog',
  'rabbit',
  'fox',
  'owl',
  'panda',
];

// All available colors
export const AVATAR_COLORS: AvatarColor[] = [
  'pink',
  'blue',
  'purple',
  'green',
  'yellow',
  'peach',
];
