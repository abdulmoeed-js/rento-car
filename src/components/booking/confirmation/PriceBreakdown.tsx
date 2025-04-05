
import React from "react";
import { Separator } from "@/components/ui/separator";

interface PriceBreakdownProps {
  totalDays: number;
  totalPrice: number;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({ totalDays, totalPrice }) => {
  // Fixed values for confirmation screen
  const serviceFeesPercent = 10;
  const serviceFees = (totalPrice * serviceFeesPercent) / 100;
  const totalWithFees = totalPrice + serviceFees;

  return (
    <>
      <Separator />

      <div className="space-y-3">
        <h4 className="font-medium">Price breakdown</h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>${totalPrice / totalDays} × {totalDays} {totalDays === 1 ? 'day' : 'days'}</span>
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
    </>
  );
};
