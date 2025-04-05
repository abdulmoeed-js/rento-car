
import React from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookingFormData, Car } from "@/types/car";
import { BookingDetails } from "./BookingDetails";
import { PriceBreakdown } from "./PriceBreakdown";
import { CancellationPolicy } from "./CancellationPolicy";
import { SuccessMessage } from "./SuccessMessage";
import { NotificationStatus } from "@/hooks/useBookingConfirmation";

export interface BookingConfirmationProps {
  car: Car;
  startDate: Date;
  endDate: Date;
  pickupTime: string;
  returnTime: string;
  location: string;
  totalDays: number;
  totalPrice: number;
  isBooked: boolean;
  notificationStatus: NotificationStatus;
  onResendNotification: () => Promise<void>;
  onClose?: () => void;
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
  onClose
}) => {
  if (isBooked) {
    return (
      <SuccessMessage 
        notificationStatus={notificationStatus} 
        onResendNotification={onResendNotification}
        onClose={onClose}
      />
    );
  }

  const bookingData: BookingFormData = {
    car,
    startDate,
    endDate,
    pickupTime,
    returnTime,
    location,
    totalDays,
    totalPrice,
    status: 'pending'
  };

  return (
    <div className="space-y-4">
      <BookingDetails car={car} bookingData={bookingData} />
      <PriceBreakdown totalDays={totalDays} totalPrice={totalPrice} />
      <CancellationPolicy />

      {onClose && (
        <DialogFooter className="sm:justify-between flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
        </DialogFooter>
      )}
    </div>
  );
};

export default BookingConfirmation;
