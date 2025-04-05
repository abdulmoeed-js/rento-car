
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, AuthContextProps } from '@/types/auth';
import { 
  signUpWithEmail,
  signInWithEmail,
  signInWithPhone,
  verifyOtp as verifyOtpService,
  signOut as signOutService,
  resetPassword as resetPasswordService,
  updatePassword as updatePasswordService,
  uploadLicense as uploadLicenseService,
  signUp as signUpService
} from '@/services/AuthService';
import { handleUserChange } from '@/services/ProfileService';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  authMethod: 'email',
  signUpWithEmail: async () => ({ error: 'Not implemented', data: null }),
  signInWithEmail: async () => ({ error: 'Not implemented' }),
  signInWithPhone: async () => ({ error: 'Not implemented' }),
  verifyOtp: async () => ({ error: 'Not implemented' }),
  signOut: async () => { },
  resetPassword: async () => ({ error: 'Not implemented' }),
  updatePassword: async () => ({ error: 'Not implemented' }),
  uploadLicense: async () => { },
  signUp: async () => ({ error: null }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [phoneNumber, setPhoneNumber] = useState<string>(''); // Store phone number for OTP verification

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const userData = await handleUserChange(session.user);
        setUser(userData);
      }
      setIsLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const userData = await handleUserChange(session.user);
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignUpWithEmail = async (email: string, password: string, full_name: string, user_role: 'renter' | 'host' = 'renter') => {
    return await signUpWithEmail(email, password, full_name, user_role);
  };

  const handleSignUp = async (email: string, password: string, phone?: string, userRole: 'renter' | 'host' = 'renter') => {
    return await signUpService(email, password, phone, userRole);
  };

  const handleSignInWithEmail = async (email: string, password: string) => {
    setAuthMethod('email');
    return await signInWithEmail(email, password);
  };

  const handleSignInWithPhone = async (phone: string, userRole: 'renter' | 'host' = 'renter') => {
    setAuthMethod('phone');
    setPhoneNumber(phone); // Store phone number for OTP verification
    return await signInWithPhone(phone, userRole);
  };

  const handleVerifyOtp = async (otp: string) => {
    return await verifyOtpService(phoneNumber, otp);
  };

  const handleUploadLicense = async (imageData: string) => {
    await uploadLicenseService(user, imageData);
    // Update local user state
    setUser(prev => prev ? {
      ...prev,
      license_status: 'pending_verification',
    } : null);
  };

  const handleSignOut = async () => {
    await signOutService();
    setUser(null);
  };

  const handleResetPassword = async (email: string) => {
    return await resetPasswordService(email);
  };

  const handleUpdatePassword = async (newPassword: string) => {
    return await updatePasswordService(newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        authMethod,
        signUpWithEmail: handleSignUpWithEmail,
        signInWithEmail: handleSignInWithEmail,
        signInWithPhone: handleSignInWithPhone,
        verifyOtp: handleVerifyOtp,
        signOut: handleSignOut,
        resetPassword: handleResetPassword,
        updatePassword: handleUpdatePassword,
        uploadLicense: handleUploadLicense,
        signUp: handleSignUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
