
import React from "react";
import { Button } from "@/components/ui/button";

interface BookingSummaryProps {
  totalDays: number;
  totalPrice: number;
  isFormValid: boolean;
  onSubmit: () => void;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  totalDays,
  totalPrice,
  isFormValid,
  onSubmit,
}) => {
  return (
    <div className="pt-4 border-t border-gray-100">
      <div className="flex justify-between font-medium mb-2">
        <span>Total ({totalDays} {totalDays === 1 ? 'day' : 'days'})</span>
        <span>${totalPrice.toFixed(2)}</span>
      </div>
      <Button
        type="button"
        className="w-full"
        disabled={!isFormValid}
        onClick={onSubmit}
      >
        Continue to Booking
      </Button>
    </div>
  );
};

export default BookingSummary;
