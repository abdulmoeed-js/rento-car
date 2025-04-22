
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BookingFormData } from "@/types/car";
import { submitBooking } from "@/lib/bookingApi";
import { useAuth } from "@/context/AuthContext";
import { logInfo, logError, LogType } from "@/utils/logger";

export interface NotificationStatus {
  success: boolean;
  method: 'whatsapp' | 'email' | 'none';
}

export function useBookingConfirmation(bookingData: BookingFormData) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null);
  
  const sendNotification = async (bookingId: string) => {
    logInfo(LogType.BOOKING, "Sending booking notification", { bookingId });
    try {
      // Get user profile data for name and contact info
      const userEmail = user?.email || '';
      const userPhone = user?.phone || '';
      const userName = user?.email ? user.email.split('@')[0] : 'Rento User';
      
      const { data, error } = await supabase.functions.invoke('send-booking-notification', {
        body: {
          booking: {
            id: bookingId,
            carName: `${bookingData.car.brand} ${bookingData.car.model} (${bookingData.car.year})`,
            startDate: format(bookingData.startDate, "MMM d, yyyy"),
            endDate: format(bookingData.endDate, "MMM d, yyyy"),
            pickupTime: bookingData.pickupTime,
            returnTime: bookingData.returnTime,
            location: bookingData.location,
            totalDays: bookingData.totalDays,
            totalPrice: bookingData.totalPrice,
          },
          renter: {
            name: userName,
            phone: userPhone,
            email: userEmail,
          },
          preferWhatsApp: bookingData.preferWhatsApp || false,
        },
      });
      
      if (error) throw error;
      
      setNotificationStatus({
        success: data.success,
        method: data.method,
      });
      
      logInfo(LogType.BOOKING, "Notification sent successfully", { 
        bookingId, 
        method: data.method,
        success: data.success
      });
      
      return data.success;
    } catch (error) {
      logError(LogType.BOOKING, "Error sending notification", { bookingId, error });
      console.error("Error sending notification:", error);
      setNotificationStatus({
        success: false,
        method: 'none',
      });
      return false;
    }
  };

  const handleBookNow = async () => {
    logInfo(LogType.BOOKING, "Initiating booking process", { 
      carId: bookingData.car.id,
      startDate: format(bookingData.startDate, "yyyy-MM-dd"),
      endDate: format(bookingData.endDate, "yyyy-MM-dd")
    });
    
    setIsSubmitting(true);
    
    try {
      const result = await submitBooking(bookingData);
      
      if (result) {
        // Send notification after booking is submitted
        await sendNotification(result.id);
        
        setIsBooked(true);
        logInfo(LogType.BOOKING, "Booking completed successfully", { bookingId: result.id });
        toast.success("Booking request submitted successfully!");
      } else {
        logError(LogType.BOOKING, "Booking submission failed");
        toast.error("Failed to submit booking request");
      }
    } catch (error) {
      logError(LogType.BOOKING, "Error in booking process", { error });
      console.error("Error submitting booking:", error);
      toast.error("Error submitting booking request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendNotification = async () => {
    logInfo(LogType.BOOKING, "Attempting to resend notification");
    toast.promise(sendNotification('resend-notification'), {
      loading: 'Resending notification...',
      success: () => {
        logInfo(LogType.BOOKING, "Notification resent successfully");
        return 'Notification resent successfully!';
      },
      error: 'Failed to resend notification.',
    });
  };

  return {
    isSubmitting,
    isBooked,
    notificationStatus,
    handleBookNow,
    handleResendNotification
  };
}
