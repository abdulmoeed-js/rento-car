
import React, { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookingFormData } from "@/types/car";
import { DialogFooter } from "@/components/ui/dialog";
import { submitBooking } from "@/lib/api";
import { CheckCircle, MessageSquare, Send, AlertCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface BookingConfirmationProps {
  bookingData: BookingFormData;
  onClose: () => void;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ 
  bookingData, 
  onClose 
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<{
    success: boolean;
    method: 'whatsapp' | 'email' | 'none';
  } | null>(null);
  const { car, startDate, endDate, pickupTime, returnTime, totalDays, totalPrice, preferWhatsApp } = bookingData;
  
  // Fixed values for confirmation screen
  const serviceFeesPercent = 10;
  const serviceFees = (totalPrice * serviceFeesPercent) / 100;
  const totalWithFees = totalPrice + serviceFees;

  const sendNotification = async (bookingId: string) => {
    try {
      // Get user profile data for name and contact info
      // In a real app, you'd have a profiles table with this info
      const userEmail = user?.email || '';
      const userPhone = user?.phone || '';
      const userName = user?.user_metadata?.full_name || 'Rento User';
      
      const { data, error } = await supabase.functions.invoke('send-booking-notification', {
        body: {
          booking: {
            id: bookingId,
            carName: `${car.brand} ${car.model} (${car.year})`,
            startDate: format(startDate, "MMM d, yyyy"),
            endDate: format(endDate, "MMM d, yyyy"),
            pickupTime,
            returnTime,
            location: bookingData.location,
            totalDays,
            totalPrice,
          },
          renter: {
            name: userName,
            phone: userPhone,
            email: userEmail,
          },
          preferWhatsApp,
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

  if (isBooked) {
    return (
      <div className="py-4 flex flex-col items-center text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Booking Request Sent!</h3>
        
        {notificationStatus && (
          <div className="mt-2 mb-4">
            {notificationStatus.success ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-full">
                  {notificationStatus.method === 'whatsapp' ? (
                    <>
                      <MessageSquare className="h-5 w-5 mr-2" />
                      <span>Sent via WhatsApp</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5 mr-2" />
                      <span>Sent via Email</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Host has been notified about your booking request
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-2 rounded-full">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>Notification delivery failed</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={handleResendNotification}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Resend Notification
                </Button>
              </div>
            )}
          </div>
        )}
        
        <p className="text-muted-foreground mb-6">
          Your booking request has been sent to the host for approval. You'll be notified when they respond.
        </p>
        <Button onClick={onClose} className="w-full">Close</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <img 
            src={car.images && car.images.length > 0 ? car.images[0].image_path : 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000'} 
            alt={`${car.brand} ${car.model}`} 
            className="w-20 h-20 object-cover rounded"
          />
          <div>
            <h3 className="font-semibold">{car.brand} {car.model}</h3>
            <p className="text-sm text-muted-foreground">{car.year} · {car.transmission}</p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="font-medium">Trip details</h4>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Pickup</p>
            <p className="font-medium">{format(startDate, "EEE, MMM d, yyyy")} · {pickupTime}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Return</p>
            <p className="font-medium">{format(endDate, "EEE, MMM d, yyyy")} · {returnTime}</p>
          </div>
        </div>
        
        <div className="text-sm">
          <p className="text-muted-foreground">Location</p>
          <p className="font-medium">{bookingData.location}</p>
        </div>
        
        {preferWhatsApp && (
          <div className="flex items-center text-sm text-green-600 bg-green-50 p-2 rounded">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>WhatsApp notifications enabled</span>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="font-medium">Price breakdown</h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>{car.price_per_day} × {totalDays} {totalDays === 1 ? 'day' : 'days'}</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Service fee ({serviceFeesPercent}%)</span>
            <span>${serviceFees.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between font-semibold pt-2">
            <span>Total</span>
            <span>${totalWithFees.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="text-sm">
        <h4 className="font-medium mb-2">Cancellation policy</h4>
        <p>Free cancellation up to 24 hours before the trip starts. After that, a fee equivalent to one day's rental may apply.</p>
      </div>

      <DialogFooter className="sm:justify-between flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={handleBookNow} disabled={isSubmitting}>
          {isSubmitting ? "Sending request..." : "Request Booking"}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default BookingConfirmation;
