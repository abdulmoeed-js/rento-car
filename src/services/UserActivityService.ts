
import { supabase } from "@/integrations/supabase/client";
import { logInfo, logError, LogType } from "@/utils/logger";

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  LICENSE_UPLOAD = 'license_upload',
  LICENSE_UPDATED = 'license_updated',
  BOOKING_CREATED = 'booking_created',
  BOOKING_CANCELLED = 'booking_cancelled',
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_COMPLETED = 'payment_completed'
}

export async function trackUserActivity(
  activityType: ActivityType, 
  details: Record<string, any> = {}
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      logError(LogType.USER, "Failed to track activity: User not authenticated");
      return false;
    }

    // Call an edge function instead of directly querying a non-existent table
    // This avoids type errors with the rpc method
    const { error } = await supabase.functions.invoke('log-user-activity', {
      body: {
        user_id: user.id,
        activity_type: activityType,
        details: details
      }
    });

    if (error) {
      logError(LogType.USER, "Failed to track user activity", { error, activityType });
      return false;
    }

    logInfo(LogType.USER, "User activity tracked successfully", { activityType });
    return true;
  } catch (error) {
    logError(LogType.USER, "Error tracking user activity", { error, activityType });
    return false;
  }
}
