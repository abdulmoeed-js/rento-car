
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Updates a user's role in the profiles table
 * @param email User's email
 * @param role Role to set ('host' or 'renter')
 * @returns Promise resolving to success status
 */
export async function updateUserRole(email: string, role: 'host' | 'renter'): Promise<boolean> {
  try {
    // First, find the user by email through the admin API
    // We need to use the edge function since we can't directly query auth.users from the client
    const { data: userData, error: userError } = await supabase.functions.invoke('get-user-by-email', {
      body: { email }
    });
    
    if (userError || !userData) {
      console.error('Error finding user by email:', userError || 'No user data returned');
      return false;
    }
    
    // Update the user's role in the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ user_role: role })
      .eq('id', userData.id);
    
    if (updateError) {
      console.error('Error updating user role:', updateError);
      return false;
    }
    
    console.log(`Successfully updated ${email} to role: ${role}`);
    return true;
  } catch (error) {
    console.error('Unexpected error updating user role:', error);
    return false;
  }
}

/**
 * Updates the specified user to have the "host" role
 * @param email User's email to make a host
 * @returns Promise resolving to success message
 */
export async function makeUserHost(email: string): Promise<string> {
  try {
    // Use the set-user-role edge function to set the user's role to host
    const { data, error } = await supabase.functions.invoke('set-user-role', {
      body: { email, role: 'host' }
    });
    
    if (error) {
      console.error('Error setting user role:', error);
      return `Failed to update role: ${error.message}`;
    }
    
    return data?.message || 'Successfully set user as host';
  } catch (error: any) {
    console.error('Unexpected error making user a host:', error);
    return `Failed to update role: ${error.message || 'Unknown error'}`;
  }
}
