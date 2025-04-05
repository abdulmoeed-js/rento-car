
import { supabase } from "@/integrations/supabase/client";

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // We need to cast the entire response to any since the RPC function is not in types
    const { data, error } = await (supabase.rpc('has_role', { 
      _user_id: userId, 
      _role: 'admin' 
    }) as any);
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in isUserAdmin:', error);
    return false;
  }
}

export async function getKycStats() {
  try {
    // We need to cast to any because the profiles table is not in the TypeScript types
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('license_status')
      .not('license_status', 'is', null);
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      pending: data.filter((p: any) => p.license_status === 'pending_verification').length,
      verified: data.filter((p: any) => p.license_status === 'verified').length,
      rejected: data.filter((p: any) => p.license_status === 'rejected').length,
      reupload: data.filter((p: any) => p.license_status === 'pending_reupload').length,
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching KYC stats:', error);
    return null;
  }
}

export async function getKycLogs(limit = 100) {
  try {
    // We need to cast to any because the kyc_review_logs table is not in types
    const { data, error } = await (supabase as any)
      .from('kyc_review_logs')
      .select(`
        id,
        action,
        reason,
        previous_status,
        new_status,
        created_at,
        reviewer:reviewer_id(email),
        user:user_id(email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching KYC logs:', error);
    return [];
  }
}
