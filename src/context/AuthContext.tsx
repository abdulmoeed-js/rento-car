
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
  isLoading: false, // Alias for loading
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
  const [authChecked, setAuthChecked] = useState(false);

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

  // Implementation of additional methods
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

  const signUp = async (email: string, password: string, phone?: string, userRole: 'renter' | 'host' = 'renter') => {
    try {
      setLoading(true);
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
  
  // Enhanced init function with timeout safeguard
  useEffect(() => {
    let isActive = true; // Track if component is still mounted
    
    const initAuth = async () => {
      try {
        console.log("Starting auth initialization...");
        
        // Set up auth listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("Auth state change:", event);
            
            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
              if (session?.user) {
                const profile = await checkProfile(session.user.id);
                const mappedUser = mapUserToModel(session.user, profile);
                
                if (isActive) {
                  setUser(mappedUser);
                  if (profile) {
                    setUserData({
                      ...session.user,
                      ...profile
                    });
                  }
                  setSession(session);
                }
              }
            } else if (event === 'SIGNED_OUT') {
              if (isActive) {
                setUser(null);
                setUserData(null);
                setSession(null);
              }
            }
            
            // Always ensure loading is set to false after auth state change
            if (isActive) {
              setLoading(false);
              setAuthChecked(true);
            }
          }
        );
        
        // Also check current session as a fallback
        const { data: sessionData } = await supabase.auth.getSession();
        const currentSession = sessionData.session;
        
        if (currentSession?.user) {
          const profile = await checkProfile(currentSession.user.id);
          const mappedUser = mapUserToModel(currentSession.user, profile);
          
          if (isActive) {
            setUser(mappedUser);
            if (profile) {
              setUserData({
                ...currentSession.user,
                ...profile
              });
            }
            setSession(currentSession);
          }
        }
        
        // Safety timeout to ensure loading state always resolves
        setTimeout(() => {
          if (isActive && loading) {
            console.log("Auth check timeout reached - forcing loading state to false");
            setLoading(false);
            setAuthChecked(true);
          }
        }, 3000);
        
        // Always make sure to update loading state
        if (isActive) {
          setLoading(false);
          setAuthChecked(true);
        }
        
        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isActive) {
          setLoading(false);
          setAuthChecked(true);
        }
      }
    };
    
    initAuth();
    
    return () => {
      isActive = false; // Prevent state updates if component unmounts
    };
  }, [checkProfile, loading]);

  const value = {
    user,
    userData,
    session,
    loading,
    isLoading: loading || !authChecked, // Consider initialization incomplete until both loading is false and auth check has completed
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
