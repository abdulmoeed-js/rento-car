
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to verify that all required storage buckets exist
 * and create them if they don't
 */
export const ensureStorageBuckets = async (): Promise<void> => {
  try {
    // Check if car_images bucket exists
    const { error: carImagesError } = await supabase.storage
      .getBucket('car_images');
    
    if (carImagesError && carImagesError.message.includes('does not exist')) {
      // Create car_images bucket
      const { error: createError } = await supabase.storage
        .createBucket('car_images', {
          public: true,
          fileSizeLimit: 10485760 // 10MB
        });
      
      if (createError) {
        console.error('Error creating car_images bucket:', createError);
      } else {
        console.log('Created car_images bucket');
      }
    }
  } catch (error) {
    console.error('Error ensuring storage buckets:', error);
  }
};

/**
 * Helper function to check if a user has host privileges
 */
export const checkHostStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking host status:', error);
      return false;
    }
    
    return data?.user_role === 'host';
  } catch (error) {
    console.error('Error checking host status:', error);
    return false;
  }
};

/**
 * Helper function to format database error messages for display
 */
export const formatErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error occurred';
  
  // Handle specific supabase error codes
  if (error.code === '42501') {
    return 'You do not have permission to perform this action. Please ensure you are logged in with the correct account.';
  }
  
  if (error.code === '23505') {
    return 'A record with this information already exists.';
  }
  
  return error.message || 'An unexpected error occurred';
};
