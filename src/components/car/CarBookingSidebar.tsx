
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import BookingForm from "@/components/BookingForm";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import { Car } from "@/types/car";

interface CarBookingSidebarProps {
  car: Car;
  currentMonthAvailability: Array<{ date: Date; isAvailable: boolean }>;
  nextMonthAvailability: Array<{ date: Date; isAvailable: boolean }>;
}

const CarBookingSidebar: React.FC<CarBookingSidebarProps> = ({ 
  car, 
  currentMonthAvailability, 
  nextMonthAvailability 
}) => {
  return (
    <div>
      {/* Booking Form */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-2xl font-bold">${car.price_per_day}</span>
              <span className="text-muted-foreground"> / day</span>
            </div>
          </div>
          
          <BookingForm car={car} />
        </CardContent>
      </Card>
      
      {/* Availability Calendar */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Availability</h2>
          
          <div className="space-y-6">
            <AvailabilityCalendar days={currentMonthAvailability} />
            <AvailabilityCalendar days={nextMonthAvailability} />
          </div>
          
          <div className="flex items-center justify-between mt-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
              <span>Booked</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarBookingSidebar;
