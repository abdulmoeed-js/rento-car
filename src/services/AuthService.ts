
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@/types/auth';
import { trackUserActivity, ActivityType } from '@/services/UserActivityService';

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
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

// Helper function to create user profile
export const createUserProfile = async (userId: string, userRole: 'renter' | 'host' = 'renter', fullName: string = '') => {
  try {
    // Check if profile already exists to prevent duplicate inserts
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (existingProfile) {
      // Profile already exists, just update it
      const { error } = await supabase
        .from('profiles')
        .update({
          user_role: userRole,
          full_name: fullName,
        })
        .eq('id', userId);
        
      if (error) {
        console.error('Error updating existing profile:', error);
        return false;
      }
      
      return true;
    }
    
    // Profile doesn't exist, create a new one
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        user_role: userRole,
        full_name: fullName,
        license_status: 'not_uploaded'
      });
    
    if (error) {
      console.error('Error creating profile:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error in createUserProfile function:', err);
    return false;
  }
};

export const signUpWithEmail = async (email: string, password: string, full_name: string, user_role: 'renter' | 'host' = 'renter') => {
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
    
    // Create profile if signup successful
    if (data && data.user) {
      await createUserProfile(data.user.id, user_role, full_name);
      
      trackUserActivity(ActivityType.LOGIN, {
        method: 'email_signup',
        user_role: user_role,
      });
    }

    // Return success message
    return { error: null, data };
  } catch (error: any) {
    console.error('Signup error:', error);
    
    trackUserActivity(ActivityType.LOGIN, {
      method: 'email_signup',
      error: error.message,
      status: 'failed'
    });
    
    // Check for specific error messages
    if (error.message.includes('already registered')) {
      return { error: 'This email is already registered. Please log in instead.', data: null };
    }
    
    return { error: error.message, data: null };
  }
};

// Alias for signUpWithEmail for compatibility
export const signUp = async (email: string, password: string, phone?: string, userRole: 'renter' | 'host' = 'renter') => {
  try {
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

    // Create profile if signup successful
    if (data && data.user) {
      await createUserProfile(data.user.id, userRole);
      
      trackUserActivity(ActivityType.LOGIN, {
        method: 'email_signup',
        user_role: userRole,
      });
    }

    return { error: null };
  } catch (error: any) {
    console.error('Signup error:', error);
    
    trackUserActivity(ActivityType.LOGIN, {
      method: 'email_signup',
      error: error.message,
      status: 'failed'
    });
    
    return { error: error.message };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const profile = await getUserProfile(data.user.id);
    
    if (!profile) {
      // If profile doesn't exist, create it
      const userRole = data.user.user_metadata?.user_role || 'renter';
      await createUserProfile(data.user.id, userRole);
    }
    
    trackUserActivity(ActivityType.LOGIN, {
      method: 'email',
      user_role: profile?.user_role || 'renter',
    });
    
    return { error: null };
  } catch (error: any) {
    console.error('Login error:', error);
    
    trackUserActivity(ActivityType.LOGIN, {
      method: 'email',
      error: error.message,
      status: 'failed'
    });
    
    // Check for specific error messages
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Invalid email or password. Please try again.' };
    }
    
    return { error: error.message };
  }
};

export const signInWithPhone = async (phone: string, userRole: 'renter' | 'host' = 'renter') => {
  try {
    // Format phone number if needed (remove spaces, ensure proper format)
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
    
    trackUserActivity(ActivityType.LOGIN, {
      method: 'phone_otp_sent',
      user_role: userRole,
    });
    
    toast.success('OTP sent to your phone number');
    return { error: null };
  } catch (error: any) {
    console.error('Phone login error:', error);
    
    trackUserActivity(ActivityType.LOGIN, {
      method: 'phone_otp_sent',
      error: error.message,
      status: 'failed'
    });
    
    toast.error(error.message);
    return { error: error.message };
  }
};

export const verifyOtp = async (phone: string, otp: string) => {
  try {
    if (!phone) {
      throw new Error('Phone number not available for verification');
    }
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: 'sms',
    });

    if (error) throw error;

    // Check if user profile exists
    const profile = await getUserProfile(data.user.id);

    if (!profile) {
      // If profile doesn't exist, create it
      const userRole = data.user.user_metadata?.user_role || 'renter';
      await createUserProfile(data.user.id, userRole);
    }
    
    trackUserActivity(ActivityType.LOGIN, {
      method: 'phone_otp_verified',
      user_role: profile?.user_role || 'renter',
    });
    
    return { error: null };
  } catch (error: any) {
    console.error('OTP verification error:', error);
    
    trackUserActivity(ActivityType.LOGIN, {
      method: 'phone_otp_verified',
      error: error.message,
      status: 'failed'
    });
    
    toast.error(error.message);
    return { error: error.message };
  }
};

export const uploadLicense = async (user: User | null, imageData: string) => {
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

    trackUserActivity(ActivityType.LICENSE_UPDATED, {
      action: 'upload_license',
      previous_status: user.license_status,
      new_status: 'pending_verification'
    });
    
    toast.success('License uploaded successfully');

  } catch (error: any) {
    console.error('Error uploading license:', error);
    toast.error('Failed to upload license');
    throw error;
  }
};

export const signOut = async () => {
  try {
    await supabase.auth.signOut();
    trackUserActivity(ActivityType.LOGOUT, {
      method: 'manual',
    });
  } catch (error: any) {
    console.error('Signout error:', error);
    toast.error(error.message);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) throw error;
    toast.success('Password reset link sent to your email');
    return { error: null };
  } catch (error: any) {
    console.error('Reset password error:', error);
    toast.error(error.message);
    return { error: error.message };
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    toast.success('Password updated successfully');
    return { error: null };
  } catch (error: any) {
    console.error('Update password error:', error);
    toast.error(error.message);
    return { error: error.message };
  }
};

// Function to convert Supabase user to our User type
export const mapUserData = (authUser: any, profile: any): User => {
  return {
    id: authUser.id,
    email: authUser.email || '',
    phone: authUser.phone || '',
    full_name: profile?.full_name || '',
    license_status: profile?.license_status || 'not_uploaded',
    user_role: profile?.user_role || 'renter',
  };
};
