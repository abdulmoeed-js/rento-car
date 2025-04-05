
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
    const profile = await getUserProfile(authUser.id);
    
    if (profile) {
      return mapUserData(authUser, profile);
    } else {
      // If profile doesn't exist, create it
      const userRole = authUser.user_metadata?.user_role || 'renter';
      const created = await createUserProfile(authUser.id, userRole);
      
      if (created) {
        // Retry getting profile
        const newProfile = await getUserProfile(authUser.id);
        if (newProfile) {
          return mapUserData(authUser, newProfile);
        }
      }
    }
    
    // If we couldn't create a profile or retrieve it, return minimal user data
    return {
      id: authUser.id,
      email: authUser.email || '',
      phone: authUser.phone || '',
      full_name: '',
      license_status: 'not_uploaded',
      user_role: 'renter',
    };
  } catch (error) {
    console.error('Error handling user change:', error);
    return null;
  }
};
