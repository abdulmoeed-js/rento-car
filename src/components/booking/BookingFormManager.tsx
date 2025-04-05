
import React, { useState, useEffect } from "react";
import { differenceInDays, isBefore, isAfter, isSameDay } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Car, BookingFormData } from "@/types/car";
import { isDateRangeAvailable } from "@/lib/api";
import BookingConfirmation from "../BookingConfirmation";
import DateSelector from "./DateSelector";
import TimeSelector from "./TimeSelector";
import BookingDetails from "./BookingDetails";
import BookingSummary from "./BookingSummary";

interface BookingFormManagerProps {
  car: Car;
}

const BookingFormManager: React.FC<BookingFormManagerProps> = ({ car }) => {
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

  // Handle submit
  const handleSubmit = () => {
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

  // Close confirmation dialog
  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  // Check if form is valid for submission
  const isFormValid = !!(startDate && endDate);

  return (
    <>
      <form className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
        <DateSelector 
          startDate={startDate}
          endDate={endDate}
          disabledDates={disabledDates}
          onDateSelect={handleDateSelect}
        />

        <TimeSelector 
          pickupTime={pickupTime}
          returnTime={returnTime}
          onPickupTimeChange={setPickupTime}
          onReturnTimeChange={setReturnTime}
        />

        <BookingDetails 
          location={location}
          message={message}
          preferWhatsApp={preferWhatsApp}
          onLocationChange={setLocation}
          onMessageChange={setMessage}
          onWhatsAppPreferenceChange={setPreferWhatsApp}
        />

        <BookingSummary 
          totalDays={totalDays}
          totalPrice={totalPrice}
          isFormValid={isFormValid}
          onSubmit={handleSubmit}
        />
      </form>

      {/* Booking Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
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

export default BookingFormManager;
