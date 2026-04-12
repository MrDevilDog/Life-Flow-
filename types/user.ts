// User and Donor type definitions

export type UserRole = "user" | "admin" | "hospital";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  email_verified: boolean;
  phone_verified: boolean;
  verification_type?: 'email' | 'phone';
};

export type DonorProfile = {
  id?: number;
  user_id: number;
  blood_group: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  location: string;
  phone: string;
  availability: boolean;
  lat: number;
  lng: number;
  created_at?: string;
  updated_at?: string;
};

export type UserWithDonorProfile = AuthUser & {
  created_at: string;
  donor_profile?: DonorProfile;
};

export type UserProfileResponse = {
  id: number;
  name: string;
  email: string;
  phone: string;
  email_verified: boolean;
  phone_verified: boolean;
  verification_type?: 'email' | 'phone';
  created_at: string;
  donor_profile?: DonorProfile;
};

export type MeResponse = {
  name: string;
  email: string;
  created_at: string;
  phone: string | null;
  location: string | null;
  blood_group: string | null;
  availability: boolean | null;
};
