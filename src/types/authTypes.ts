

// export interface AuthInput {
//   name: string;
//   email: string;
//   password: string;
//   phoneNumber: string;
// }

// export interface AuthResponse {
//   token: string;
//   user: {
//     id: string;
//     name: string;
//     email: string;
//     phoneNumber?: string; // Optional if you want to include it in the response
//   };
// }

// // Additional types for password reset functionality
export interface ForgotPasswordInput {
  username: string;
  newPassword: string;
}

export interface ResetPasswordInput {
  email: string;
  newPassword: string;
}

// // export interface UpdatePasswordInput {
// //   newPassword: string;
// // }

// AuthInput: For login and signup requests
export interface AuthInput {
  name: string; // optional for login, required for signup
  email: string;
  password: string;
  phoneNumber: string;
  clinic_id?: string;

}

// AuthResponse: Response format for authentication endpoints
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string; // JWT token returned on successful authentication
  user?: {
    id: string;
    name: string;
    email: string;
    isProfileCompleted: boolean;
  };
}

// AddMemberInput: Input data for adding a new member
export interface AddMemberInput {
  name: string;
  email: string;
  clinic_id?: string; // can be an empty string if not provided
}

// AddMemberResponse: Response format for addMember API
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

// SendMailInput: Data needed to send an email
export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
}

// JWT Payload: Structure of JWT payload for user identification
export interface JWTPayload {
  id: string;
  clinic_id?: string; // optional field, default to an empty string if not present
}
