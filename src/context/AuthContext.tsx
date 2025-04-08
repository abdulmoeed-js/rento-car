
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
  signUp as signUpService,
  uploadLicense as uploadLicenseService
} from '@/services/AuthService';
import { handleUserChange } from '@/services/ProfileService';
import { toast } from 'sonner';

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
  signUp: async () => ({ error: null }),
  uploadLicense: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      if (session) {
        try {
          const userData = await handleUserChange(session.user);
          if (userData && mounted) {
            // Ensure user_role is never undefined
            userData.user_role = userData.user_role || 'renter';
            setUser(userData);
          }
        } catch (error) {
          console.error("Error in auth state change handler:", error);
        }
      } else {
        if (mounted) setUser(null);
      }
      
      if (mounted) setIsLoading(false);
    });

    // Then get the initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          const userData = await handleUserChange(session.user);
          if (userData && mounted) {
            // Ensure user_role is never undefined
            userData.user_role = userData.user_role || 'renter';
            setUser(userData);
          }
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    
    getSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignUpWithEmail = async (email: string, password: string, full_name: string, user_role: 'renter' | 'host' = 'renter') => {
    setIsLoading(true);
    try {
      const result = await signUpWithEmail(email, password, full_name, user_role);
      return result;
    } catch (error) {
      console.error("Error in handleSignUpWithEmail:", error);
      return { error: "An unexpected error occurred", data: null };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, phone?: string, userRole: 'renter' | 'host' = 'renter') => {
    setIsLoading(true);
    try {
      return await signUpService(email, password, phone, userRole);
    } catch (error) {
      console.error("Error in handleSignUp:", error);
      return { error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthMethod('email');
    try {
      return await signInWithEmail(email, password);
    } catch (error) {
      console.error("Error in handleSignInWithEmail:", error);
      return { error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithPhone = async (phone: string, userRole: 'renter' | 'host' = 'renter') => {
    setIsLoading(true);
    setAuthMethod('phone');
    setPhoneNumber(phone); // Store phone number for OTP verification
    try {
      return await signInWithPhone(phone, userRole);
    } catch (error) {
      console.error("Error in handleSignInWithPhone:", error);
      return { error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    setIsLoading(true);
    try {
      return await verifyOtpService(phoneNumber, otp);
    } catch (error) {
      console.error("Error in handleVerifyOtp:", error);
      return { error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOutService();
      setUser(null);
    } catch (error) {
      console.error("Error in handleSignOut:", error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      return await resetPasswordService(email);
    } catch (error) {
      console.error("Error in handleResetPassword:", error);
      return { error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (newPassword: string) => {
    setIsLoading(true);
    try {
      return await updatePasswordService(newPassword);
    } catch (error) {
      console.error("Error in handleUpdatePassword:", error);
      return { error: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadLicense = async (imageData: string) => {
    setIsLoading(true);
    try {
      if (!user) {
        toast.error('You must be logged in to upload a license');
        return;
      }
      await uploadLicenseService(user, imageData);
      
      // Update the local user state to reflect the license upload
      if (user) {
        setUser({
          ...user,
          license_status: 'pending_verification'
        });
      }
    } catch (error) {
      console.error("Error in handleUploadLicense:", error);
      toast.error("Failed to upload license. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
        signUp: handleSignUp,
        uploadLicense: handleUploadLicense
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
