
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackUserActivity, ActivityType } from '@/services/UserActivityService';

export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  license_status: string;
  user_role: string;
}

interface AuthContextProps {
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
  signUp: (email: string, password: string, phone?: string, userRole?: 'renter' | 'host') => Promise<void>;
}

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
  signUp: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [phoneNumber, setPhoneNumber] = useState<string>(''); // Store phone number for OTP verification

  // Helper function to get user profile
  const getUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in getUserProfile function:', err);
      return null;
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleUserChange(session?.user || null);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserChange(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // When user data changes, get additional user info
  const handleUserChange = async (authUser: any) => {
    if (!authUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await getUserProfile(authUser.id);
      
      if (profile) {
        const userData: User = {
          id: authUser.id,
          email: authUser.email || '',
          phone: authUser.phone || '',
          full_name: profile.full_name || '',
          license_status: profile.license_status || 'not_uploaded',
          user_role: profile.user_role || 'renter',
        };
        setUser(userData);
      } else {
        // If profile doesn't exist, create it
        const { error } = await supabase.from('profiles').insert({
          id: authUser.id,
          user_role: 'renter',
        });
        
        if (error) {
          console.error('Error creating profile:', error);
        } else {
          // Retry getting profile
          const newProfile = await getUserProfile(authUser.id);
          if (newProfile) {
            const userData: User = {
              id: authUser.id,
              email: authUser.email || '',
              phone: authUser.phone || '',
              full_name: newProfile.full_name || '',
              license_status: newProfile.license_status || 'not_uploaded',
              user_role: newProfile.user_role || 'renter',
            };
            setUser(userData);
          }
        }
      }
    } catch (error) {
      console.error('Error handling user change:', error);
    } finally {
      setIsLoading(false);
    }
  };

  async function signUpWithEmail(email: string, password: string, full_name: string, user_role: 'renter' | 'host' = 'renter') {
    try {
      // Create the user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            user_role,
          }
        }
      });

      if (error) throw error;

      // Return success message
      return { error: null, data };
    } catch (error: any) {
      return { error: error.message, data: null };
    }
  }

  // Alias for signUpWithEmail for compatibility
  async function signUp(email: string, password: string, phone?: string, userRole: 'renter' | 'host' = 'renter') {
    const result = await signUpWithEmail(email, password, '', userRole);
    if (result.error) {
      throw new Error(result.error);
    }
  }

  async function signInWithEmail(email: string, password: string) {
    try {
      setAuthMethod('email');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const profile = await getUserProfile(data.user.id);
      
      if (profile) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email || '',
          phone: data.user.phone || '',
          full_name: profile.full_name || '',
          license_status: profile.license_status || 'not_uploaded',
          user_role: profile.user_role || 'renter',
        };
        
        setUser(userData);
        trackUserActivity(ActivityType.LOGIN, {
          method: 'email',
          user_role: userData.user_role,
        });
        
        return { error: null };
      }
      return { error: 'Profile not found' };
    } catch (error: any) {
      trackUserActivity(ActivityType.LOGIN, {
        method: 'email',
        error: error.message,
        status: 'failed'
      });
      
      return { error: error.message };
    }
  }

  async function signInWithPhone(phone: string, userRole: 'renter' | 'host' = 'renter') {
    try {
      setAuthMethod('phone');
      setPhoneNumber(phone); // Store phone number for OTP verification
      
      const { data, error } = await supabase.auth.signInWithOtp({ 
        phone,
        options: {
          data: {
            user_role: userRole
          }
        }
      });
      
      if (error) throw error;
      toast.success('OTP sent to your phone number');
      return { error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { error: error.message };
    }
  }

  async function verifyOtp(otp: string) {
    try {
      if (!phoneNumber) {
        throw new Error('Phone number not available for verification');
      }
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      const profile = await getUserProfile(data.user.id);

      if (profile) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email || '',
          phone: data.user.phone || '',
          full_name: profile.full_name || '',
          license_status: profile.license_status || 'not_uploaded',
          user_role: profile.user_role || 'renter',
        };
        setUser(userData);
      }
      return { error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { error: error.message };
    }
  }

  async function uploadLicense(imageData: string) {
    try {
      if (!user) throw new Error('User not authenticated');

      // Update profile with license image URL and status
      const { error } = await supabase
        .from('profiles')
        .update({
          license_image_url: imageData,
          license_status: 'pending_verification',
          license_uploaded_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local user state
      setUser(prev => prev ? {
        ...prev,
        license_status: 'pending_verification',
      } : null);

      trackUserActivity(ActivityType.LICENSE_UPDATED, {
        action: 'upload_license',
        previous_status: user.license_status,
        new_status: 'pending_verification'
      });

    } catch (error: any) {
      console.error('Error uploading license:', error);
      toast.error('Failed to upload license');
      throw error;
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      trackUserActivity(ActivityType.LOGOUT, {
        method: 'manual',
      });
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function resetPassword(email: string) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      toast.success('Password reset link sent to your email');
      return { error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { error: error.message };
    }
  }

  async function updatePassword(newPassword: string) {
    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      return { error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { error: error.message };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        authMethod,
        signUpWithEmail,
        signInWithEmail,
        signInWithPhone,
        verifyOtp,
        signOut,
        resetPassword,
        updatePassword,
        uploadLicense,
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
