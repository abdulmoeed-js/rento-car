
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/types/auth';

/**
 * Maps Supabase user and profile data to our User interface
 */
export const mapUserToModel = (supabaseUser: SupabaseUser | null, profileData: any): User | null => {
  if (!supabaseUser) return null;
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || undefined,
    phone: supabaseUser.phone || undefined,
    // Use profile data for these fields if available
    full_name: profileData?.full_name || supabaseUser.user_metadata?.full_name,
    license_status: profileData?.license_status || 'not_uploaded',
    user_role: profileData?.user_role || supabaseUser.user_metadata?.user_role || 'renter',
    created_at: supabaseUser.created_at,
    updated_at: supabaseUser.updated_at
  };
};
