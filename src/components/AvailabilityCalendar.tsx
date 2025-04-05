
import React from "react";
import { cn } from "@/lib/utils";

interface AvailabilityCalendarProps {
  days: Array<{ date: Date; isAvailable: boolean }>;
  className?: string;
  compact?: boolean;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  days,
  className,
  compact = false
}) => {
  // Get the month name from the first day
  const monthName = days.length > 0 
    ? days[0].date.toLocaleString('default', { month: compact ? 'short' : 'long' }) 
    : '';
  
  // Group days by week for rendering
  const weeks: Array<Array<typeof days[0] | null>> = [];
  let currentWeek: Array<typeof days[0] | null> = [];

  // Add empty cells for days before the first day of the month
  const firstDayOfMonth = days.length > 0 ? days[0].date.getDay() : 0;
  for (let i = 0; i < firstDayOfMonth; i++) {
    currentWeek.push(null);
  }

  // Add the days
  days.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Add empty cells for days after the last day of the month
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return (
    <div className={cn("w-full", className)}>
      {!compact && <h3 className="text-center font-medium mb-2">{monthName}</h3>}
      
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers - only show if not compact */}
        {!compact && ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {weeks.flatMap((week, weekIndex) =>
          week.map((day, dayIndex) => (
            <div
              key={`${weekIndex}-${dayIndex}`}
              className={cn(
                "aspect-square flex items-center justify-center text-xs",
                day ? (
                  day.isAvailable 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                ) : "bg-transparent",
                compact ? "w-4 h-4 rounded-full" : "rounded"
              )}
            >
              {day && !compact ? day.date.getDate() : ""}
            </div>
          ))
        )}
      </div>
      
      {compact && (
        <div className="text-xs text-center mt-1 font-medium">{monthName}</div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
