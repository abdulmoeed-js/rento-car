
/**
 * Format error messages from Supabase responses
 */
export const formatErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error occurred';
  
  // Check for Supabase API error format
  if (error.error_description) return error.error_description;
  if (error.message) return error.message;
  if (error.error) return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
  
  // Handle array of errors from Supabase
  if (error.details && Array.isArray(error.details)) {
    return error.details.map((e: any) => e.message).join(', ');
  }
  
  // Last resort stringification
  return typeof error === 'string' ? error : JSON.stringify(error);
};

/**
 * Check if a user has a specific role
 */
export const hasRole = async (userId: string, role: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    const { data, error } = await fetch(
      `https://tzawsihjrndgmaartefg.functions.supabase.co/has-role?userId=${userId}&role=${role}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      }
    ).then(res => res.json());
    
    if (error) {
      console.error('Error checking role:', error);
      return false;
    }
    
    return data?.hasRole || false;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
};
