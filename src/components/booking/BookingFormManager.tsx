
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Car, BookingFormData } from "@/types/car";
import DateSelector from "./DateSelector";
import TimeSelector from "./TimeSelector";
import BookingDetails from "./BookingDetails";
import BookingSummary from "./BookingSummary";
import BookingPayment from "./BookingPayment"; // Import the new payment component
import { useBookingConfirmation } from "@/hooks/useBookingConfirmation";
import BookingConfirmation from "../BookingConfirmation";

enum BookingStep {
  DATE_SELECTION = 0,
  DETAILS = 1,
  REVIEW = 2,
  PAYMENT = 3, // Add a payment step
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

  const handleReviewSubmit = () => {
    // Instead of submitting, go to payment step
    setCurrentStep(BookingStep.PAYMENT);
  };

  const handlePaymentSuccess = () => {
    // After payment succeeds, handle the booking and move to confirmation
    handleBookNow();
    setCurrentStep(BookingStep.CONFIRMATION);
  };

  const handleBackFromPayment = () => {
    // Go back to review step
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
                buttonText="Proceed to Payment" // Update button text
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
          notificationStatus={notificationStatus}
          onResendNotification={handleResendNotification}
        />
      )}
    </div>
  );
};

export default BookingFormManager;
