
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Car } from "@/types/car";
import AvailabilityCalendar from "./AvailabilityCalendar";
import { getMonthlyAvailability } from "@/lib/api";
import { MapPin, Star } from "lucide-react";

interface CarCardProps {
  car: Car;
}

const CarCard: React.FC<CarCardProps> = ({ car }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Get availability for current month
  const monthAvailability = getMonthlyAvailability(currentYear, currentMonth, car.bookings || []);
  
  // Calculate next return date if the car is currently booked
  const getReturnDate = () => {
    if (!car.bookings || car.bookings.length === 0) return null;
    
    const confirmedBookings = car.bookings.filter(b => b.status === 'confirmed');
    if (confirmedBookings.length === 0) return null;
    
    // Find the next booking that ends after today
    const currentDate = new Date();
    const nextReturn = confirmedBookings
      .filter(b => new Date(b.end_date) >= currentDate)
      .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())[0];
    
    return nextReturn ? new Date(nextReturn.end_date) : null;
  };
  
  const returnDate = getReturnDate();
  const primaryImage = car.images?.find(img => img.is_primary)?.image_path || 
    car.images?.[0]?.image_path || 
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000';

  return (
    <Link to={`/cars/${car.id}`}>
      <Card className="overflow-hidden transition-transform hover:shadow-md hover:scale-[1.02]">
        {/* Car Image */}
        <div className="aspect-video relative">
          <img 
            src={primaryImage} 
            alt={`${car.brand} ${car.model}`} 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 right-0 bg-white/90 px-2 py-1 m-2 rounded text-sm font-medium">
            ${car.price_per_day}/day
          </div>
        </div>
        
        <CardContent className="p-4">
          {/* Car Info */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-lg">{car.brand} {car.model}</h3>
              <p className="text-sm text-muted-foreground">{car.year}</p>
            </div>
            
            {/* Host Rating */}
            <div className="flex items-center">
              <Star className="h-4 w-4 text-amber-500 mr-1" fill="currentColor" />
              <span className="text-sm font-medium">
                {car.host_rating ? car.host_rating.toFixed(1) : 'New'}
              </span>
            </div>
          </div>
          
          {/* Location */}
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{car.location}</span>
          </div>
          
          {/* Two-column layout for calendar and return date */}
          <div className="grid grid-cols-2 gap-3">
            {/* Availability Calendar */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Availability</p>
              <AvailabilityCalendar days={monthAvailability} compact />
            </div>
            
            {/* Return Date or Features */}
            <div>
              {returnDate ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Available from</p>
                  <p className="text-sm font-medium text-green-600">
                    {returnDate.toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Features</p>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {car.transmission}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {car.fuel_type}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CarCard;
