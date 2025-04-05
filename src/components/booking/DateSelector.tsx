
import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { format, isBefore, isAfter, isSameDay } from "date-fns";

interface DateSelectorProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  disabledDates: Date[];
  onDateSelect: (date: Date | undefined) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  startDate,
  endDate,
  disabledDates,
  onDateSelect,
}) => {
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

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Select Dates</h3>
      <div className="bg-gray-50 rounded-lg p-4">
        <Calendar
          mode="single"
          selected={startDate}
          onSelect={onDateSelect}
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
  );
};

export default DateSelector;
