export interface MemberInput {
    name: string;
    email: string;
    password: string; // You may hash the password in the service
    phoneNumber: string;
    role: string;
    status:string;
  }
  