
import React from "react";
import { Button } from "@/components/ui/button";
import { Car } from "@/types/car";
import { format } from "date-fns";

export interface BookingSummaryProps {
  car: Car;
  startDate: Date;
  endDate: Date;
  pickupTime: string;
  returnTime: string;
  location: string;
  message?: string;
  totalDays: number;
  totalPrice: number;
  isFormValid?: boolean;
  isSubmitting?: boolean;
  buttonText?: string;
  onSubmit: () => void;
  onBack: () => void;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  car,
  startDate,
  endDate,
  pickupTime,
  returnTime,
  location,
  message,
  totalDays,
  totalPrice,
  isFormValid = true,
  isSubmitting = false,
  buttonText = "Continue to Booking",
  onSubmit,
  onBack,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Booking Summary</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Car:</span>
          <span>{car.brand} {car.model}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pickup:</span>
          <span>{format(startDate, "MMM d, yyyy")} at {pickupTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Return:</span>
          <span>{format(endDate, "MMM d, yyyy")} at {returnTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Location:</span>
          <span>{location}</span>
        </div>
        {message && (
          <div>
            <span className="text-muted-foreground">Message:</span>
            <p className="text-sm mt-1">{message}</p>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between font-medium mb-2">
          <span>Total ({totalDays} {totalDays === 1 ? 'day' : 'days'})</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={!isFormValid || isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? "Processing..." : buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;
