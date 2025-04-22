
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
    
    // Use the Edge function directly with proper error handling
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
