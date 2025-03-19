export interface ForgotPasswordInput {
  username: string;
  newPassword: string;
}

export interface ResetPasswordInput {
  email: string;
  newPassword: string;
}

export interface AuthInput {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  clinic_id?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    isProfileCompleted: boolean;
  };
}

export interface AddMemberInput {
  name: string;
  email: string;
  clinic_id?: string;
}

export interface AddMemberResponse {
  success: boolean;
  message: string;
  member?: {
    id: string;
    name: string;
    email: string;
    clinic_id: string;
  };
}

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
}
export interface JWTPayload {
  id: string;
  clinic_id?: string;
}
