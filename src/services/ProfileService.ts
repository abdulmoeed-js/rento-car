
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';
import { toast } from 'sonner';
import { getUserProfile, createUserProfile, mapUserData } from './AuthService';

// Function to handle user authentication changes
export const handleUserChange = async (authUser: any): Promise<User | null> => {
  if (!authUser) {
    return null;
  }

  try {
    // Check if profile exists
    let profile = await getUserProfile(authUser.id);
    
    if (!profile) {
      // If profile doesn't exist, create it with metadata from authUser
      const userRole = authUser.user_metadata?.user_role || 'renter';
      const fullName = authUser.user_metadata?.full_name || '';
      
      // Create the profile
      const success = await createUserProfile(authUser.id, userRole, fullName);
      
      if (!success) {
        console.error('Failed to create user profile');
        toast.error('Error setting up your profile. Please try again.');
      }
      
      // Fetch the newly created profile
      profile = await getUserProfile(authUser.id);
      
      if (!profile) {
        console.error('Failed to retrieve user profile after creation');
        // Return minimal user data if profile creation failed
        return {
          id: authUser.id,
          email: authUser.email || '',
          phone: authUser.phone || '',
          full_name: authUser.user_metadata?.full_name || '',
          license_status: 'not_uploaded',
          user_role: userRole,
        };
      }
    } else if (!profile.user_role) {
      // If profile exists but doesn't have a user_role, update it to 'renter'
      const { error } = await supabase
        .from('profiles')
        .update({ user_role: 'renter' })
        .eq('id', authUser.id);
      
      if (error) {
        console.error('Error updating user_role:', error);
        toast.error('Error updating your profile. Please try again.');
      } else {
        // Refresh the profile data after update
        profile = await getUserProfile(authUser.id);
      }
    }
    
    // If we have a profile, map the data
    if (profile) {
      // Make sure user_role is 'renter' if it's null or undefined
      if (!profile.user_role) {
        profile.user_role = 'renter';
      }
      return mapUserData(authUser, profile);
    }
    
    // If we couldn't create a profile or retrieve it, return minimal user data
    return {
      id: authUser.id,
      email: authUser.email || '',
      phone: authUser.phone || '',
      full_name: authUser.user_metadata?.full_name || '',
      license_status: 'not_uploaded',
      user_role: authUser.user_metadata?.user_role || 'renter',
    };
  } catch (error) {
    console.error('Error handling user change:', error);
    toast.error('Authentication error. Please try again later.');
    return null;
  }
};
