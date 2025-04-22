
import { toast } from "sonner";

/**
 * Utility to check if a user has a specific role.
 */
export const hasRole = async (userId: string, role: string): Promise<boolean> => {
  if (!userId) return false;
  try {
    const { data, error } = await fetch(
      `https://tzawsihjrndgmaartefg.functions.supabase.co/has-role?userId=${userId}&role=${role}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      }
    ).then((res) => res.json());

    if (error) {
      console.error("Error checking role:", error);
      toast.error("Error verifying user role.");
      return false;
    }

    return data?.hasRole || false;
  } catch (error) {
    console.error("Error checking role:", error);
    toast.error("Error verifying user role.");
    return false;
  }
};
