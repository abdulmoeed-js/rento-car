
import React, { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookingFormData } from "@/types/car";
import { DialogFooter } from "@/components/ui/dialog";
import { submitBooking } from "@/lib/api";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface BookingConfirmationProps {
  bookingData: BookingFormData;
  onClose: () => void;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ 
  bookingData, 
  onClose 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const { car, startDate, endDate, pickupTime, returnTime, totalDays, totalPrice } = bookingData;
  
  // Fixed values for confirmation screen
  const serviceFeesPercent = 10;
  const serviceFees = (totalPrice * serviceFeesPercent) / 100;
  const totalWithFees = totalPrice + serviceFees;

  const handleBookNow = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await submitBooking(bookingData);
      
      if (result) {
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

  if (isBooked) {
    return (
      <div className="py-4 flex flex-col items-center text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Booking Request Sent!</h3>
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
