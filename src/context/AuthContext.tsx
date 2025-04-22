
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { User, AuthContextType } from "@/types/auth";
import { toast } from "sonner";
import { mapUserToModel } from "@/utils/authUtils";

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  session: null,
  loading: false,
  isLoading: false,
  signIn: async () => {},
  signOut: async () => {},
  updateUser: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signInWithPhone: async () => ({ error: null }),
  verifyOtp: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  uploadLicense: async () => {},
  signUp: async () => ({ error: null }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Implementation of signIn with magic link
  const signIn = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      alert("Check your email for the magic link.");
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  // Implementation of signOut
  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setUserData(null);
      setSession(null);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  // Implementation of updateUser
  const updateUser = async (data: any) => {
    try {
      setLoading(true);
      const { error } = await supabase.from("profiles").upsert(data);
      if (error) throw error;
      setUserData({ ...userData, ...data });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Implementation of signInWithEmail
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error("Login error:", error);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Implementation of signInWithPhone
  const signInWithPhone = async (phone: string, userRole: 'renter' | 'host' = 'renter') => {
    try {
      setLoading(true);
      // Format phone number if needed
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      
      const { data, error } = await supabase.auth.signInWithOtp({ 
        phone: formattedPhone,
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
      console.error("Phone login error:", error);
      toast.error(error.message);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Implementation of verifyOtp
  const verifyOtp = async (otp: string) => {
    try {
      setLoading(true);
      // We need the phone number from session or somewhere
      const phoneNumber = userData?.phone || '';
      
      if (!phoneNumber) {
        throw new Error('Phone number not available for verification');
      }
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error("OTP verification error:", error);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Implementation of resetPassword
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      toast.success('Password reset link sent to your email');
      return { error: null };
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(error.message);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Implementation of uploadLicense
  const uploadLicense = async (imageData: string) => {
    try {
      if (!user) throw new Error('User not authenticated');
      setLoading(true);

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
      
      // Update local user data
      setUserData({
        ...userData,
        license_image_url: imageData,
        license_status: 'pending_verification',
        license_uploaded_at: new Date().toISOString()
      });
      
      toast.success('License uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading license:', error);
      toast.error('Failed to upload license');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Implementation of signUp
  const signUp = async (email: string, password: string, phone?: string, userRole: 'renter' | 'host' = 'renter') => {
    try {
      setLoading(true);
      console.log(`Signing up with email and role: ${userRole}`);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_role: userRole
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      // If signup is successful and we have a user, create a profile
      if (data && data.user) {
        try {
          // Create a profile for the new user
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              user_role: userRole,
              full_name: email.split('@')[0],
              license_status: 'not_uploaded'
            });
            
          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        } catch (profileErr) {
          console.error('Failed to create profile:', profileErr);
        }
      }

      return { error: null };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const checkProfile = useCallback(async (userId: string) => {
    if (!userId) return null;
    
    try {
      // Check if profile exists
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (fetchError) {
        // If profile doesn't exist, create one
        if (fetchError.code === 'PGRST116') {
          try {
            const { data: userData } = await supabase.auth.getUser();
            const email = userData.user?.email || '';
            const user_role = userData.user?.user_metadata?.user_role || 'renter';
            
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                full_name: email.split('@')[0],
                user_role: user_role,
                license_status: 'not_uploaded'
              })
              .select('*')
              .single();
            
            if (createError) {
              console.error('Error creating profile:', createError);
              throw createError;
            }
            
            console.log('Created new profile:', newProfile);
            return newProfile;
          } catch (createProfileError) {
            console.error('Failed to create user profile', createProfileError);
            return null;
          }
        }
        
        console.error('Error fetching user profile:', fetchError);
        return null;
      }
      
      return profile;
    } catch (error) {
      console.error('Unexpected error checking profile:', error);
      return null;
    }
  }, []);
  
  // Completely rewritten authentication initialization
  useEffect(() => {
    console.log("Starting auth initialization...");
    let mounted = true;
    
    // Setup a fallback timeout to prevent eternal loading state
    const fallbackTimer = setTimeout(() => {
      if (mounted && loading) {
        console.log("Auth initialization timeout - forcing completion");
        setLoading(false);
        setAuthInitialized(true);
      }
    }, 3000);
    
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state change:", event);
        
        if (!mounted) return;
        
        if (newSession?.user) {
          try {
            const profile = await checkProfile(newSession.user.id);
            const mappedUser = mapUserToModel(newSession.user, profile);
            
            setUser(mappedUser);
            setUserData(profile);
            setSession(newSession);
          } catch (error) {
            console.error("Error processing auth state change:", error);
          }
        } else {
          setUser(null);
          setUserData(null);
          setSession(null);
        }
        
        // Ensure loading is done regardless of outcome
        setLoading(false);
        setAuthInitialized(true);
      }
    );
    
    // Check current session
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const currentSession = data.session;
        
        if (!mounted) return;
        
        if (currentSession?.user) {
          try {
            const profile = await checkProfile(currentSession.user.id);
            const mappedUser = mapUserToModel(currentSession.user, profile);
            
            setUser(mappedUser);
            setUserData(profile);
            setSession(currentSession);
          } catch (error) {
            console.error("Error processing session check:", error);
          }
        }
        
        // Always complete loading after session check
        setLoading(false);
        setAuthInitialized(true);
      } catch (error) {
        console.error("Error checking session:", error);
        
        if (mounted) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };
    
    checkSession();
    
    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      subscription?.unsubscribe();
    };
  }, [checkProfile]);

  const value = {
    user,
    userData,
    session,
    loading,
    isLoading: loading,
    signIn,
    signOut,
    updateUser,
    signInWithEmail,
    signInWithPhone,
    verifyOtp,
    resetPassword,
    uploadLicense,
    signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
