
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Car, BookingFormData } from "@/types/car";
import DateSelector from "./DateSelector";
import BookingDetails from "./BookingDetails";
import BookingSummary from "./BookingSummary";
import BookingPayment from "./BookingPayment";
import BookingConfirmation from "./BookingConfirmation";
import { NotificationStatus } from "./BookingConfirmation";
import { trackUserActivity, ActivityType } from "@/services/UserActivityService";

interface BookingFormManagerProps {
  car: Car;
  onClose?: () => void;
}

const BookingFormManager: React.FC<BookingFormManagerProps> = ({ car, onClose }) => {
  // Track current step in booking flow
  const [step, setStep] = useState<
    "dates" | "details" | "summary" | "payment" | "confirmation"
  >("dates");

  // Booking data state
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [totalDays, setTotalDays] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(car.price_per_day);
  const [pickupTime, setPickupTime] = useState<string>("12:00");
  const [returnTime, setReturnTime] = useState<string>("12:00");
  const [location, setLocation] = useState<string>(car.location || "");
  const [message, setMessage] = useState<string>("");
  const [preferWhatsApp, setPreferWhatsApp] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isBooked, setIsBooked] = useState<boolean>(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>(null);

  // Handle date selection step
  const handleDateSelection = (
    startDate: Date,
    endDate: Date,
    totalDays: number,
    totalPrice: number
  ) => {
    setStartDate(startDate);
    setEndDate(endDate);
    setTotalDays(totalDays);
    setTotalPrice(totalPrice);
    setStep("details");
  };

  // Handle details submission step
  const handleDetailsSubmission = (
    pickupTime: string,
    returnTime: string, 
    location: string,
    message?: string, 
    preferWhatsApp?: boolean
  ) => {
    setPickupTime(pickupTime);
    setReturnTime(returnTime);
    setLocation(location);
    if (message) setMessage(message);
    if (preferWhatsApp !== undefined) setPreferWhatsApp(preferWhatsApp);
    setStep("summary");
  };

  // Handle booking summary confirmation
  const handleSummaryConfirmation = () => {
    setStep("payment");
  };

  // Handle payment completion
  const handlePaymentSuccess = () => {
    setIsBooked(true);
    
    // Track booking creation activity
    trackUserActivity(ActivityType.BOOKING_CREATED, {
      car_id: car.id,
      booking_details: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        pickup_time: pickupTime,
        return_time: returnTime,
        location: location,
      }
    });
    
    // Send WhatsApp notification if user opted in
    if (preferWhatsApp) {
      setNotificationStatus("pending");
      sendWhatsAppNotification()
        .then(() => setNotificationStatus("sent"))
        .catch(() => setNotificationStatus("failed"));
    }
    
    setStep("confirmation");
  };

  // Mock function to send WhatsApp notification
  const sendWhatsAppNotification = async () => {
    // In a real app, this would call an API to send WhatsApp
    return new Promise<void>((resolve, reject) => {
      // Simulate API call with 50% success rate
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve();
        } else {
          reject(new Error("Failed to send WhatsApp notification"));
        }
      }, 1500);
    });
  };

  // Resend notification if it failed
  const handleResendNotification = async () => {
    setNotificationStatus("pending");
    try {
      await sendWhatsAppNotification();
      setNotificationStatus("sent");
    } catch (error) {
      setNotificationStatus("failed");
      throw error;
    }
  };

  // Render the current step
  const renderCurrentStep = () => {
    switch (step) {
      case "dates":
        return (
          <DateSelector
            car={car}
            onSubmit={handleDateSelection}
          />
        );
      
      case "details":
        return (
          <BookingDetails
            location={location}
            pickupTime={pickupTime}
            returnTime={returnTime}
            onLocationChange={setLocation}
            onPickupTimeChange={setPickupTime}
            onReturnTimeChange={setReturnTime}
            onMessageChange={setMessage}
            onWhatsAppPreferenceChange={setPreferWhatsApp}
            onSubmit={handleDetailsSubmission}
            onBack={() => setStep("dates")}
          />
        );
      
      case "summary":
        return (
          <BookingSummary
            car={car}
            startDate={startDate}
            endDate={endDate}
            pickupTime={pickupTime}
            returnTime={returnTime}
            location={location}
            message={message}
            totalDays={totalDays}
            totalPrice={totalPrice}
            onSubmit={handleSummaryConfirmation}
            onBack={() => setStep("details")}
            buttonText="Proceed to Payment"
            isSubmitting={isSubmitting}
          />
        );

      case "payment":
        const bookingData: BookingFormData = {
          car,
          startDate,
          endDate,
          pickupTime,
          returnTime,
          location,
          message,
          totalDays,
          totalPrice,
          status: 'pending'
        };
        
        return (
          <BookingPayment
            bookingData={bookingData}
            onBack={() => setStep("summary")}
            onSuccess={handlePaymentSuccess}
          />
        );
      
      case "confirmation":
        return (
          <BookingConfirmation
            car={car}
            startDate={startDate}
            endDate={endDate}
            pickupTime={pickupTime}
            returnTime={returnTime}
            location={location}
            totalDays={totalDays}
            totalPrice={totalPrice}
            isBooked={isBooked}
            notificationStatus={notificationStatus}
            onResendNotification={handleResendNotification}
            message={message}
          />
        );
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full p-4 md:p-6">
      {renderCurrentStep()}
      
      {onClose && step === "confirmation" && (
        <div className="mt-4 text-center">
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      )}
    </div>
  );
};

export default BookingFormManager;
