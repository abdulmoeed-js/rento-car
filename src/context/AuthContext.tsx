import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackUserActivity, ActivityType } from '@/services/UserActivityService';

interface User {
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
  signUpWithEmail: (email: string, password: string, full_name: string, user_role?: 'renter' | 'host') => Promise<{ error: string | null; data: any | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: string | null }>;
  verifyOTP: (phone: string, otp: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signUpWithEmail: async () => ({ error: 'Not implemented', data: null }),
  signInWithEmail: async () => ({ error: 'Not implemented' }),
  signInWithPhone: async () => ({ error: 'Not implemented' }),
  verifyOTP: async () => ({ error: 'Not implemented' }),
  signOut: async () => { },
  resetPassword: async () => ({ error: 'Not implemented' }),
  updatePassword: async () => ({ error: 'Not implemented' }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSupabaseUser(session?.user || null);
    };

    getSession();

    supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user || null);
    });
  }, []);

  const [supabaseUser, setSupabaseUser] = useState(supabase.auth.currentUser);

  // When user data changes, get additional user info
  useEffect(() => {
    async function getUserProfile(userId: string) {
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
    }

    if (supabaseUser) {
      getUserProfile(supabaseUser.id).then(profile => {
        if (profile) {
          const user: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            phone: supabaseUser.phone || '',
            full_name: profile.full_name || '',
            license_status: profile.license_status || 'not_uploaded',
            user_role: profile.user_role || 'renter',
          };
          setUser(user);
          setIsLoading(false);
        }
      });
    }
  }, [supabaseUser]);

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

  async function signInWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const profile = await getUserProfile(data.user.id);
      
      if (profile) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          phone: data.user.phone || '',
          full_name: profile.full_name || '',
          license_status: profile.license_status || 'not_uploaded',
          user_role: profile.user_role || 'renter',
        };
        
        setUser(user);
        trackUserActivity(ActivityType.LOGIN, {
          method: 'email',
          user_role: user.user_role,
        });
        
        return { error: null };
      }
    } catch (error: any) {
      trackUserActivity(ActivityType.LOGIN_FAILED, {
        method: 'email',
        error: error.message,
      });
      
      return { error: error.message };
    }
  }

  async function signInWithPhone(phone: string) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      toast.success('OTP sent to your phone number');
      return { error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { error: error.message };
    }
  }

  async function verifyOTP(phone: string, otp: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      const profile = await getUserProfile(data.user.id);

      if (profile) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          phone: data.user.phone || '',
          full_name: profile.full_name || '',
          license_status: profile.license_status || 'not_uploaded',
          user_role: profile.user_role || 'renter',
        };
        setUser(user);
      }
      return { error: null };
    } catch (error: any) {
      toast.error(error.message);
      return { error: error.message };
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      setUser(null);
      trackUserActivity(ActivityType.LOGOUT, {
        method: 'email',
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
        signUpWithEmail,
        signInWithEmail,
        signInWithPhone,
        verifyOTP,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
