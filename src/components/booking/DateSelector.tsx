import React, { useState } from "react";
import { Car } from "@/types/car";
import { Button } from "@/components/ui/button";

export interface DateSelectorProps {
  car: Car;
  onSubmit: (startDate: Date, endDate: Date, totalDays: number, totalPrice: number) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ car, onSubmit }) => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() + 1)));
  const [totalDays, setTotalDays] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(car.price_per_day);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = new Date(e.target.value);
    setStartDate(newStartDate);
    
    // Ensure end date is not before start date
    if (endDate < newStartDate) {
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newStartDate.getDate() + 1);
      setEndDate(newEndDate);
    }
    
    // Recalculate total days and price
    calculateTotals(newStartDate, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = new Date(e.target.value);
    setEndDate(newEndDate);
    
    // Recalculate total days and price
    calculateTotals(startDate, newEndDate);
  };

  const calculateTotals = (start: Date, end: Date) => {
    // Calculate difference in days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    setTotalDays(diffDays);
    setTotalPrice(diffDays * car.price_per_day);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(startDate, endDate, totalDays, totalPrice);
  };

  // Format dates for input fields
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Get minimum date (today) for date inputs
  const minDate = formatDateForInput(new Date());

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium mb-1">
            Pickup Date
          </label>
          <input
            type="date"
            id="start-date"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={formatDateForInput(startDate)}
            onChange={handleStartDateChange}
            min={minDate}
            required
          />
        </div>
        
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium mb-1">
            Return Date
          </label>
          <input
            type="date"
            id="end-date"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={formatDateForInput(endDate)}
            onChange={handleEndDateChange}
            min={formatDateForInput(new Date(startDate.getTime() + 86400000))} // min is startDate + 1 day
            required
          />
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between font-medium mb-2">
          <span>Total ({totalDays} {totalDays === 1 ? 'day' : 'days'})</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        <Button
          type="submit"
          className="w-full"
        >
          Continue
        </Button>
      </div>
    </form>
  );
};

export default DateSelector;
