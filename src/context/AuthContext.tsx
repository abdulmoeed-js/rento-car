
import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "sonner";
import { logInfo, logError, logWarn, LogType } from "@/utils/logger";
import { supabase } from "@/integrations/supabase/client";
import { trackUserActivity, ActivityType } from "@/services/UserActivityService";

interface User {
  id: string;
  email?: string;
  phone?: string;
  licenseStatus: 'not_uploaded' | 'pending_verification' | 'verified' | 'rejected' | 'pending_reupload';
  licenseImage?: string;
  userRole?: 'renter' | 'host';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  authMethod: 'email' | 'phone' | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithPhone: (phone: string, userRole?: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  signUp: (email: string, password: string, phone?: string, userRole?: string) => Promise<void>;
  uploadLicense: (licenseImage: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | null>(null);
  
  // Initialize authentication state and connect to Supabase
  useEffect(() => {
    logInfo(LogType.AUTH, "Initializing authentication state");
    
    const checkUser = async () => {
      try {
        // Check if user is authenticated with Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // User is authenticated, fetch their profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            logError(LogType.AUTH, "Error fetching user profile", { error: profileError });
          }
          
          // Set user state
          setUser({
            id: session.user.id,
            email: session.user.email || undefined,
            phone: session.user.phone || undefined,
            licenseStatus: (profileData?.license_status as any) || 'not_uploaded',
            licenseImage: profileData?.license_image_url,
            userRole: profileData?.user_role || 'renter',
          });
          
          setAuthMethod(session.user.email ? 'email' : 'phone');
          logInfo(LogType.AUTH, "User authenticated from session", { userId: session.user.id });
        } else {
          // No active session
          setUser(null);
          setAuthMethod(null);
          logInfo(LogType.AUTH, "No active session found");
        }
      } catch (error) {
        logError(LogType.AUTH, "Error checking authentication state", { error });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Setup auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logInfo(LogType.AUTH, "Auth state changed", { event });
        
        if (event === 'SIGNED_IN' && session) {
          // Track login activity
          trackUserActivity(ActivityType.LOGIN, {
            method: session.user.email ? 'email' : 'phone',
            timestamp: new Date().toISOString(),
          });
          
          // Fetch user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            logError(LogType.AUTH, "Error fetching user profile on sign in", { error: profileError });
          }
          
          // Set user state
          setUser({
            id: session.user.id,
            email: session.user.email || undefined,
            phone: session.user.phone || undefined,
            licenseStatus: (profileData?.license_status as any) || 'not_uploaded',
            licenseImage: profileData?.license_image_url,
            userRole: profileData?.user_role || 'renter',
          });
          
          setAuthMethod(session.user.email ? 'email' : 'phone');
          toast.success('Successfully signed in!');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setAuthMethod(null);
          toast.info('Signed out successfully');
        }
      }
    );
    
    // Initial check
    checkUser();
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    logInfo(LogType.AUTH, "Attempting email sign in", { email });
    try {
      setIsLoading(true);
      
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      logInfo(LogType.AUTH, "Email sign in successful", { userId: data.user.id });
      
      // Note: User state is updated by the auth state change listener
    } catch (error: any) {
      logError(LogType.AUTH, "Email sign in error", { error: error.message });
      toast.error(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPhone = async (phone: string, userRole: string = 'renter') => {
    logInfo(LogType.AUTH, "Attempting phone sign in", { phone: phone.substring(0, 6) + "XXXX" });
    try {
      setIsLoading(true);
      
      // Basic validation
      if (!/^\d{10}$/.test(phone)) {
        const error = new Error('Please enter a valid 10-digit phone number');
        logError(LogType.AUTH, "Phone sign in failed - invalid format", { phone: phone.substring(0, 6) + "XXXX" });
        throw error;
      }
      
      // Send OTP via Supabase
      const formattedPhone = `+1${phone}`; // Add country code for US numbers
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          data: {
            user_role: userRole
          }
        }
      });
      
      if (error) throw error;
      
      setAuthMethod('phone');
      logInfo(LogType.AUTH, "OTP sent for phone sign in", { phone: phone.substring(0, 6) + "XXXX" });
      toast.success('OTP sent to your phone!');
      
      // Store the phone temporarily for verification
      localStorage.setItem('rentoTempPhone', formattedPhone);
      localStorage.setItem('rentoTempUserRole', userRole);
    } catch (error: any) {
      logError(LogType.AUTH, "Phone sign in error", { error: error.message });
      toast.error(error.message || 'Failed to send OTP');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    logInfo(LogType.AUTH, "Verifying OTP");
    try {
      setIsLoading(true);
      
      // Basic validation
      if (!/^\d{6}$/.test(otp)) {
        const error = new Error('Please enter a valid 6-digit OTP');
        logError(LogType.AUTH, "OTP verification failed - invalid format");
        throw error;
      }
      
      const phone = localStorage.getItem('rentoTempPhone');
      const userRole = localStorage.getItem('rentoTempUserRole') || 'renter';
      
      if (!phone) {
        const error = new Error('Session expired, please try again');
        logError(LogType.AUTH, "OTP verification failed - session expired");
        throw error;
      }
      
      // Verify OTP with Supabase
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
        options: {
          data: {
            user_role: userRole
          }
        }
      });
      
      if (error) throw error;
      
      // User will be updated via the auth state change listener
      localStorage.removeItem('rentoTempPhone');
      localStorage.removeItem('rentoTempUserRole');
      
      // Note: User profile is created via database trigger
      
      logInfo(LogType.AUTH, "OTP verification successful");
    } catch (error: any) {
      logError(LogType.AUTH, "OTP verification error", { error: error.message });
      toast.error(error.message || 'Failed to verify OTP');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, phone?: string, userRole: string = 'renter') => {
    logInfo(LogType.AUTH, "Attempting sign up", { email, hasPhone: !!phone, userRole });
    try {
      setIsLoading(true);
      
      // Basic validation
      if (!email.includes('@')) {
        const error = new Error('Invalid email format');
        logError(LogType.AUTH, "Sign up failed - invalid email format", { email });
        throw error;
      }
      
      // Create user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        phone,
        options: {
          data: {
            full_name: email.split('@')[0], // Default name from email
            phone_number: phone,
            user_role: userRole
          },
        },
      });
      
      if (error) throw error;
      
      // User profile is created via database trigger
      
      setAuthMethod('email');
      logInfo(LogType.AUTH, "Sign up successful", { userId: data.user?.id });
      toast.success('Account created successfully!');
      
      // User state will be updated by the auth state change listener
    } catch (error: any) {
      logError(LogType.AUTH, "Sign up error", { error: error.message });
      toast.error(error.message || 'Failed to sign up');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadLicense = async (licenseImage: string) => {
    logInfo(LogType.KYC, "Attempting license upload");
    try {
      setIsLoading(true);
      
      if (!user) {
        const error = new Error('You must be logged in to upload a license');
        logError(LogType.KYC, "License upload failed - user not logged in");
        throw error;
      }
      
      // Upload image to Supabase Storage (would be implemented in a real app)
      // For demo, we'll just update the profile
      
      // Update user profile with license information
      const { error } = await supabase
        .from('profiles')
        .update({
          license_image_url: licenseImage, // In a real app, this would be a storage URL
          license_status: 'pending_verification',
          license_uploaded_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Track activity
      await trackUserActivity(ActivityType.LICENSE_UPLOAD, {
        timestamp: new Date().toISOString(),
      });
      
      // Update local user state
      setUser({
        ...user,
        licenseImage,
        licenseStatus: 'pending_verification',
      });
      
      logInfo(LogType.KYC, "License uploaded successfully", { userId: user.id });
    } catch (error: any) {
      logError(LogType.KYC, "License upload error", { error: error.message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    logInfo(LogType.AUTH, "Password reset requested", { email });
    try {
      setIsLoading(true);
      
      // Request password reset via Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      // For security, don't reveal if the email exists or not
      logInfo(LogType.AUTH, "Password reset email sent", { email });
      toast.success('If an account with that email exists, we have sent password reset instructions.');
    } catch (error: any) {
      // For security, we still show success even if there's an error
      logError(LogType.AUTH, "Password reset error", { error: error.message, email });
      toast.success('If an account with that email exists, we have sent password reset instructions.');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    logInfo(LogType.AUTH, "User signing out", { userId: user?.id });
    
    try {
      if (user) {
        // Track logout activity
        await trackUserActivity(ActivityType.LOGOUT, {
          timestamp: new Date().toISOString(),
        });
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // User state will be updated by the auth state change listener
    } catch (error) {
      logError(LogType.AUTH, "Error during sign out", { error });
      toast.error('Error signing out');
    }
  };

  const value = {
    user,
    isLoading,
    authMethod,
    signInWithEmail,
    signInWithPhone,
    verifyOtp,
    signUp,
    uploadLicense,
    resetPassword,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
