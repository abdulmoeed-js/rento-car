
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BookingFormData } from "@/types/car";
import PriceBreakdown from "./confirmation/PriceBreakdown";
import BookingDetails from "./confirmation/BookingDetails";
import SuccessMessage from "./confirmation/SuccessMessage";
import CancellationPolicy from "./confirmation/CancellationPolicy";

export type NotificationStatus = "sent" | "failed" | "pending" | null;

interface BookingConfirmationProps {
  car: BookingFormData["car"];
  startDate: BookingFormData["startDate"];
  endDate: BookingFormData["endDate"];
  pickupTime: BookingFormData["pickupTime"];
  returnTime: BookingFormData["returnTime"];
  location: BookingFormData["location"];
  totalDays: BookingFormData["totalDays"];
  totalPrice: BookingFormData["totalPrice"];
  isBooked: boolean;
  notificationStatus: NotificationStatus;
  onResendNotification: () => Promise<void>;
  message?: string;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  car,
  startDate,
  endDate,
  pickupTime,
  returnTime,
  location,
  totalDays,
  totalPrice,
  isBooked,
  notificationStatus,
  onResendNotification,
  message
}) => {
  const handleResendNotification = async () => {
    try {
      await onResendNotification();
      toast.success("Notification sent successfully");
    } catch (error) {
      toast.error("Failed to send notification");
    }
  };

  // Create a complete BookingFormData object
  const bookingData: BookingFormData = {
    car,
    startDate,
    endDate,
    pickupTime,
    returnTime,
    location,
    totalDays,
    totalPrice,
    message: message || '',
    status: 'confirmed' // Set default status for BookingFormData
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          {isBooked ? "Booking Confirmed" : "Booking Summary"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isBooked && <SuccessMessage />}
        
        <BookingDetails booking={bookingData} />
        
        <PriceBreakdown totalDays={totalDays} pricePerDay={car.price_per_day} />
        
        <CancellationPolicy />
        
        {isBooked && notificationStatus && (
          <div className="pt-4">
            <div className="text-sm text-muted-foreground mb-2">
              {notificationStatus === "sent" ? (
                "We've sent booking details via WhatsApp"
              ) : notificationStatus === "failed" ? (
                "We couldn't send WhatsApp notification"
              ) : (
                "Sending notification..."
              )}
            </div>
            {notificationStatus === "failed" && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleResendNotification}
              >
                Resend Notification
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingConfirmation;
