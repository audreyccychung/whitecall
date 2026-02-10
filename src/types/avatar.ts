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

// Profile type is defined in database.ts

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
