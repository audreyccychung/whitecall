// Authentication types

export interface SignUpData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface CreateProfileData {
  username: string;
  display_name?: string;
  avatar_type: string;
  avatar_color: string;
}

export interface AuthError {
  message: string;
  code?: string;
}
