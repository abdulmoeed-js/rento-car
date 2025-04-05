
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
      
      await createUserProfile(authUser.id, userRole, fullName);
      
      // Fetch the newly created profile
      profile = await getUserProfile(authUser.id);
      
      if (!profile) {
        console.error('Failed to create user profile');
      }
    }
    
    // If we have a profile, map the data
    if (profile) {
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
    return null;
  }
};
