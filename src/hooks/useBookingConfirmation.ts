
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BookingFormData } from "@/types/car";
import { submitBooking } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

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
          preferWhatsApp: bookingData.preferWhatsApp,
        },
      });
      
      if (error) throw error;
      
      setNotificationStatus({
        success: data.success,
        method: data.method,
      });
      
      return data.success;
    } catch (error) {
      console.error("Error sending notification:", error);
      setNotificationStatus({
        success: false,
        method: 'none',
      });
      return false;
    }
  };

  const handleBookNow = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await submitBooking(bookingData);
      
      if (result) {
        // Send notification after booking is submitted
        await sendNotification(result.id);
        
        setIsBooked(true);
        toast.success("Booking request submitted successfully!");
      } else {
        toast.error("Failed to submit booking request");
      }
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast.error("Error submitting booking request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendNotification = async () => {
    toast.promise(sendNotification('resend-notification'), {
      loading: 'Resending notification...',
      success: () => {
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
