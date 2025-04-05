
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Car, BookingFormData } from "@/types/car";
import DateSelector from "./DateSelector";
import TimeSelector from "./TimeSelector";
import BookingDetails from "./BookingDetails";
import BookingSummary from "./BookingSummary";
import BookingPayment from "./BookingPayment"; 
import { useBookingConfirmation } from "@/hooks/useBookingConfirmation";
import BookingConfirmation from "../BookingConfirmation";

enum BookingStep {
  DATE_SELECTION = 0,
  DETAILS = 1,
  REVIEW = 2,
  PAYMENT = 3,
  CONFIRMATION = 4,
}

interface BookingFormManagerProps {
  car: Car;
}

const BookingFormManager: React.FC<BookingFormManagerProps> = ({ car }) => {
  const [currentStep, setCurrentStep] = useState<BookingStep>(BookingStep.DATE_SELECTION);
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    car,
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    pickupTime: "10:00",
    returnTime: "10:00",
    location: car.location,
    totalDays: 1,
    totalPrice: car.price_per_day,
    status: "pending",
  });
  
  // For BookingDetails component
  const [message, setMessage] = useState("");
  const [preferWhatsApp, setPreferWhatsApp] = useState(false);

  const {
    isSubmitting,
    isBooked,
    notificationStatus,
    handleBookNow,
    handleResendNotification,
  } = useBookingConfirmation(formData as BookingFormData);

  const handleDateSelection = (startDate: Date, endDate: Date, totalDays: number, totalPrice: number) => {
    setFormData((prev) => ({
      ...prev,
      startDate,
      endDate,
      totalDays,
      totalPrice,
    }));
    setCurrentStep(BookingStep.DETAILS);
  };

  const handleDetailsSubmit = (
    pickupTime: string,
    returnTime: string,
    location: string,
    message?: string,
    preferWhatsApp?: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      pickupTime,
      returnTime,
      location,
      message,
      preferWhatsApp,
    }));
    setCurrentStep(BookingStep.REVIEW);
  };

  const handleLocationChange = (value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
  };

  const handleMessageChange = (value: string) => {
    setMessage(value);
  };

  const handleWhatsAppPreferenceChange = (checked: boolean) => {
    setPreferWhatsApp(checked);
  };

  const handleReviewSubmit = () => {
    setCurrentStep(BookingStep.PAYMENT);
  };

  const handlePaymentSuccess = () => {
    handleBookNow();
    setCurrentStep(BookingStep.CONFIRMATION);
  };

  const handleBackFromPayment = () => {
    setCurrentStep(BookingStep.REVIEW);
  };

  const handleBackFromDetails = () => {
    setCurrentStep(BookingStep.DATE_SELECTION);
  };

  const handleBackFromReview = () => {
    setCurrentStep(BookingStep.DETAILS);
  };

  return (
    <div className="space-y-4">
      {currentStep === BookingStep.DATE_SELECTION && (
        <DateSelector car={car} onSubmit={handleDateSelection} />
      )}

      {currentStep === BookingStep.DETAILS && (
        <BookingDetails
          location={formData.location || car.location}
          pickupTime={formData.pickupTime || "10:00"}
          returnTime={formData.returnTime || "10:00"}
          message={message}
          preferWhatsApp={preferWhatsApp}
          onLocationChange={handleLocationChange}
          onMessageChange={handleMessageChange}
          onWhatsAppPreferenceChange={handleWhatsAppPreferenceChange}
          onSubmit={handleDetailsSubmit}
          onBack={handleBackFromDetails}
        />
      )}

      {currentStep === BookingStep.REVIEW && formData.startDate && formData.endDate && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <BookingSummary
                car={car}
                startDate={formData.startDate}
                endDate={formData.endDate}
                pickupTime={formData.pickupTime || "10:00"}
                returnTime={formData.returnTime || "10:00"}
                location={formData.location || car.location}
                message={formData.message}
                totalDays={formData.totalDays || 1}
                totalPrice={formData.totalPrice || car.price_per_day}
                onSubmit={handleReviewSubmit}
                onBack={handleBackFromReview}
                buttonText="Proceed to Payment"
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === BookingStep.PAYMENT && (
        <BookingPayment
          bookingData={formData as BookingFormData}
          onBack={handleBackFromPayment}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {currentStep === BookingStep.CONFIRMATION && formData.startDate && formData.endDate && (
        <BookingConfirmation
          car={car}
          startDate={formData.startDate}
          endDate={formData.endDate}
          pickupTime={formData.pickupTime || "10:00"}
          returnTime={formData.returnTime || "10:00"}
          location={formData.location || car.location}
          totalDays={formData.totalDays || 1}
          totalPrice={formData.totalPrice || car.price_per_day}
          isBooked={isBooked}
          notificationStatus={notificationStatus || { success: false, method: 'none' }}
          onResendNotification={handleResendNotification}
        />
      )}
    </div>
  );
};

export default BookingFormManager;
