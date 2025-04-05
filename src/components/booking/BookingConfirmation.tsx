
import React from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookingFormData } from "@/types/car";
import { BookingDetails } from "./confirmation/BookingDetails";
import { PriceBreakdown } from "./confirmation/PriceBreakdown";
import { CancellationPolicy } from "./confirmation/CancellationPolicy";
import { SuccessMessage } from "./confirmation/SuccessMessage";
import { useBookingConfirmation } from "@/hooks/useBookingConfirmation";

interface BookingConfirmationProps {
  bookingData: BookingFormData;
  onClose: () => void;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ 
  bookingData, 
  onClose 
}) => {
  const { 
    isSubmitting, 
    isBooked, 
    notificationStatus, 
    handleBookNow, 
    handleResendNotification
  } = useBookingConfirmation(bookingData);

  if (isBooked) {
    return (
      <SuccessMessage 
        notificationStatus={notificationStatus} 
        onResendNotification={handleResendNotification}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="space-y-4">
      <BookingDetails car={bookingData.car} bookingData={bookingData} />
      <PriceBreakdown totalDays={bookingData.totalDays} totalPrice={bookingData.totalPrice} />
      <CancellationPolicy />

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
