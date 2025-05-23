
import { supabase } from "@/integrations/supabase/client";

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // We need to cast the entire thing to any since the RPC function is not in types
    const { data, error } = await (supabase as any).rpc('has_role', { 
      _user_id: userId, 
      _role: 'admin' 
    });
    
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

export async function pushPendingVerifications() {
  try {
    // Find all records that need to be pushed to admin review
    const { data: profiles, error } = await (supabase as any)
      .from('profiles')
      .select('id, license_status, license_uploaded_at, license_image_url')
      .or('license_status.is.null,license_status.eq.not_submitted')
      .not('license_image_url', 'is', null); // Only include records with an image
    
    if (error) throw error;
    
    if (!profiles || profiles.length === 0) {
      console.log('No pending verifications to push');
      return { success: true, count: 0 };
    }
    
    // Update all records to pending_verification status
    const updates = profiles.map((profile: any) => ({
      id: profile.id,
      license_status: 'pending_verification',
      license_uploaded_at: profile.license_uploaded_at || new Date().toISOString()
    }));
    
    const { error: updateError, count } = await (supabase as any)
      .from('profiles')
      .upsert(updates)
      .select();
    
    if (updateError) throw updateError;
    
    return { 
      success: true, 
      count: updates.length,
      message: `Successfully pushed ${updates.length} records to pending verification`
    };
  } catch (error) {
    console.error('Error pushing pending verifications:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Function to approve all pending verifications immediately
export async function approveAllPendingVerifications(adminUserId: string) {
  try {
    // Get all pending verifications
    const { data: pendingProfiles, error } = await (supabase as any)
      .from('profiles')
      .select('id, license_status')
      .eq('license_status', 'pending_verification');
    
    if (error) throw error;
    
    if (!pendingProfiles || pendingProfiles.length === 0) {
      return { 
        success: true, 
        count: 0, 
        message: 'No pending verifications found to approve'
      };
    }
    
    // Process each pending verification
    let successCount = 0;
    
    for (const profile of pendingProfiles) {
      // Update the profile status
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({ license_status: 'verified' })
        .eq('id', profile.id);
      
      if (updateError) {
        console.error(`Error updating profile ${profile.id}:`, updateError);
        continue;
      }
      
      // Log the approval action
      const { error: logError } = await (supabase as any)
        .from('kyc_review_logs')
        .insert({
          user_id: profile.id,
          reviewer_id: adminUserId,
          action: 'approve',
          reason: 'Bulk approval by admin',
          previous_status: profile.license_status,
          new_status: 'verified'
        });
      
      if (logError) {
        console.error(`Error logging approval for profile ${profile.id}:`, logError);
      }
      
      successCount++;
    }
    
    return {
      success: true,
      count: successCount,
      message: `Successfully approved ${successCount} out of ${pendingProfiles.length} pending verifications`
    };
  } catch (error) {
    console.error('Error approving all pending verifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
