
export interface User {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  license_status?: string;
  user_role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
  user: User | null;
  userData: any | null;
  session: any | null;
  loading: boolean;
  isLoading: boolean; // Alias for loading
  authInitialized: boolean; // New property to track initialization completion
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: any) => Promise<void>;
  
  // Additional methods being used in components
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithPhone: (phone: string, userRole?: 'renter' | 'host') => Promise<{ error: string | null }>;
  verifyOtp: (otp: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  uploadLicense: (imageData: string) => Promise<void>;
  signUp: (email: string, password: string, phone?: string, userRole?: 'renter' | 'host') => Promise<{ error: string | null }>;
}
