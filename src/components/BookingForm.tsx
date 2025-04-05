
import React, { useState, useEffect } from "react";
import { format, differenceInDays, isBefore, isAfter, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Car } from "@/types/car";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { BookingFormData } from "@/types/car";
import { isDateRangeAvailable } from "@/lib/api";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import BookingConfirmation from "./BookingConfirmation";

interface BookingFormProps {
  car: Car;
}

const BookingForm: React.FC<BookingFormProps> = ({ car }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [pickupTime, setPickupTime] = useState("12:00");
  const [returnTime, setReturnTime] = useState("12:00");
  const [location, setLocation] = useState(car.location);
  const [message, setMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [preferWhatsApp, setPreferWhatsApp] = useState(true);

  // Calculate the total days and price
  const totalDays = startDate && endDate 
    ? Math.max(1, differenceInDays(endDate, startDate) + 1)
    : 0;
  const totalPrice = totalDays * car.price_per_day;

  // Prepare booking data for confirmation
  const prepareBookingData = (): BookingFormData => {
    return {
      car,
      startDate: startDate!,
      endDate: endDate!,
      pickupTime,
      returnTime,
      location,
      message,
      totalDays,
      totalPrice,
      status: 'pending',
      preferWhatsApp,
    };
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!startDate || !endDate || !pickupTime || !returnTime || !location) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate date range
    if (isBefore(endDate, startDate) || isSameDay(startDate, endDate)) {
      toast.error("Return date must be after pickup date");
      return;
    }

    // Check if user is logged in
    if (!user) {
      toast.error("Please sign in to book a car");
      navigate("/auth");
      return;
    }

    // Check if the date range is available
    if (car.bookings && !isDateRangeAvailable(startDate, endDate, car.bookings)) {
      toast.error("Selected dates are not available");
      return;
    }

    // Prepare booking data and show confirmation
    const data = prepareBookingData();
    setBookingData(data);
    setShowConfirmation(true);
  };

  // Process disabled dates from car bookings
  useEffect(() => {
    if (car.bookings && car.bookings.length > 0) {
      const bookedDates: Date[] = [];
      
      car.bookings.forEach(booking => {
        if (booking.status !== 'cancelled') {
          const start = new Date(booking.start_date);
          const end = new Date(booking.end_date);
          
          // Add all dates between start and end (inclusive) to bookedDates
          const currentDate = new Date(start);
          
          while (currentDate <= end) {
            bookedDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      });
      
      setDisabledDates(bookedDates);
    }
  }, [car.bookings]);

  // Function to check if a date is disabled
  const isDateDisabled = (date: Date) => {
    // Disable past dates
    if (isBefore(date, new Date())) {
      return true;
    }
    
    // Disable already booked dates
    return disabledDates.some(disabledDate => 
      isSameDay(date, disabledDate)
    );
  };

  // Handle selecting dates
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // If no start date is selected or if the selected date is before the current start date
    // or if both start and end dates are already selected, set as new start date
    if (!startDate || (endDate && startDate) || isBefore(date, startDate)) {
      setStartDate(date);
      setEndDate(undefined);
    } 
    // If start date is selected and the new date is after it, set as end date
    else if (startDate && isAfter(date, startDate)) {
      setEndDate(date);
    }
  };

  // Close confirmation dialog
  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Select Dates</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              className="rounded-md border mx-auto"
              footer={
                <div className="mt-4 text-sm text-center">
                  {startDate && !endDate && (
                    <p className="text-muted-foreground">Now select your return date</p>
                  )}
                  {startDate && endDate && (
                    <p>
                      <span className="font-medium">{format(startDate, "MMM d, yyyy")}</span>
                      {" to "}
                      <span className="font-medium">{format(endDate, "MMM d, yyyy")}</span>
                    </p>
                  )}
                </div>
              }
            />
            <div className="flex items-center justify-center mt-4 text-sm space-x-2">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-red-100 mr-1"></div>
                <span>Unavailable</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-primary mr-1"></div>
                <span>Selected</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pickup-time">Pickup Time</Label>
            <Input
              id="pickup-time"
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="return-time">Return Time</Label>
            <Input
              id="return-time"
              type="time"
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Pickup/Return Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Preferred location"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message to Host</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Any special requests or information for the host..."
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Switch 
            id="whatsapp-preference" 
            checked={preferWhatsApp} 
            onCheckedChange={setPreferWhatsApp} 
          />
          <Label htmlFor="whatsapp-preference">Send booking notifications via WhatsApp</Label>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex justify-between font-medium mb-2">
            <span>Total ({totalDays} {totalDays === 1 ? 'day' : 'days'})</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={!startDate || !endDate}
          >
            Continue to Booking
          </Button>
        </div>
      </form>

      {/* Booking Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Summary</DialogTitle>
          </DialogHeader>
          
          {bookingData && (
            <BookingConfirmation 
              bookingData={bookingData} 
              onClose={handleCloseConfirmation} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingForm;
