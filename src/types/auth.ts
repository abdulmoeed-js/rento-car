
export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  license_status: string;
  user_role: string;
}

export interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authMethod: 'email' | 'phone';
  signUpWithEmail: (email: string, password: string, full_name: string, user_role?: 'renter' | 'host') => Promise<{ error: string | null; data: any | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithPhone: (phone: string, userRole?: 'renter' | 'host') => Promise<{ error: string | null }>;
  verifyOtp: (otp: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  uploadLicense: (imageData: string) => Promise<void>;
  signUp: (email: string, password: string, phone?: string, userRole?: 'renter' | 'host') => Promise<{ error: string | null }>;
}
