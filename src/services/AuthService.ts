
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
export const createUserProfile = async (userId: string, userRole: 'renter' | 'host' = 'renter') => {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        user_role: userRole,
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

    // Return success message
    return { error: null, data };
  } catch (error: any) {
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
    }

    return { error: null };
  } catch (error: any) {
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
    trackUserActivity(ActivityType.LOGIN, {
      method: 'email',
      error: error.message,
      status: 'failed'
    });
    
    return { error: error.message };
  }
};

export const signInWithPhone = async (phone: string, userRole: 'renter' | 'host' = 'renter') => {
  try {
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
    
    return { error: null };
  } catch (error: any) {
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
