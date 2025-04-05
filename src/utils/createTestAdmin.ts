
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export async function createTestAdmin(email: string, password: string) {
  try {
    // Step 1: Create a new user with Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    
    if (!authData.user) {
      throw new Error("Failed to create user account");
    }

    // Step 2: Make the user an admin using the make_admin function
    // Note: We need to cast the client to any because the rpc function is not in the types
    const { error: adminError } = await (supabase as any).rpc('make_admin', { 
      _email: email 
    });
    
    if (adminError) throw adminError;
    
    return { 
      success: true, 
      message: `Admin account created successfully for ${email}` 
    };
  } catch (error) {
    console.error("Error creating test admin:", error);
    return { 
      success: false, 
      error: error.message || "Failed to create admin account" 
    };
  }
}
