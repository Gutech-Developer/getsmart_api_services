import { SystemRoleEnum, AuthProviderEnum } from "./enums";

export interface JwtPayload {
  userId: string;
  email: string;
  isActive: boolean;
  role: SystemRoleEnum;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role: SystemRoleEnum;
  NIS?: string;
  NIP?: string;
  province?: string;
  city?: string;
  schoolId?: string;
  schoolName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface GoogleCallbackInput {
  code: string;
  redirectUri: string;
}

export interface GoogleCompleteProfileInput {
  tempToken: string;
  role: SystemRoleEnum;
  fullName?: string;
  phoneNumber?: string;
  NIS?: string;
  NIP?: string;
  province?: string;
  city?: string;
  schoolId?: string;
  schoolName?: string;
}

export interface GoogleTempPayload {
  email: string;
  name: string;
  picture?: string;
  googleId: string;
}

export interface MagicLinkRequestInput {
  email: string;
}

export interface MagicLinkVerifyInput {
  token: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    isActive: boolean;
    role: SystemRoleEnum;
    profile: Record<string, unknown> | null;
  };
  tokens: TokenPair;
}
