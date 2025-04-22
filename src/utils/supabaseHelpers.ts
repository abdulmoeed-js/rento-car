
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const formatErrorMessage = (error: any): string => {
  if (typeof error === "string") return error;
  
  const pgError = error as PostgrestError;
  if (pgError?.message) return pgError.message;
  
  return error?.error?.message || error?.error || "An unknown error occurred";
};

export const hasRole = async (userId: string, role: string): Promise<boolean> => {
  try {
    if (!userId) return false;
    
    // First try to get the role directly from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', userId)
      .single();
    
    if (!profileError && profileData?.user_role) {
      console.log("Got role from profiles:", profileData.user_role, "Requested role:", role);
      return profileData.user_role === role;
    }
    
    if (profileError) {
      console.warn("Error getting profile, falling back to edge function:", profileError);
    }
    
    // Fall back to the Edge function
    const { data, error } = await supabase.functions.invoke('has-role', {
      body: { userId, role }
    });

    if (error) {
      console.error("Error invoking has-role function:", error);
      throw error;
    }
    
    console.log("Has role response:", data);
    return data?.hasRole || false;
  } catch (error) {
    console.error("Error checking role:", error);
    // Default to false to be safe
    return false;
  }
};
