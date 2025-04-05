
import React from "react";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Car, BookingFormData } from "@/types/car";

interface BookingDetailsProps {
  car: Car;
  bookingData: BookingFormData;
}

export const BookingDetails: React.FC<BookingDetailsProps> = ({ car, bookingData }) => {
  const { startDate, endDate, pickupTime, returnTime, location, preferWhatsApp } = bookingData;

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <img 
            src={car.images && car.images.length > 0 ? car.images[0].image_path : 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000'} 
            alt={`${car.brand} ${car.model}`} 
            className="w-20 h-20 object-cover rounded"
          />
          <div>
            <h3 className="font-semibold">{car.brand} {car.model}</h3>
            <p className="text-sm text-muted-foreground">{car.year} · {car.transmission}</p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="font-medium">Trip details</h4>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Pickup</p>
            <p className="font-medium">{format(startDate, "EEE, MMM d, yyyy")} · {pickupTime}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Return</p>
            <p className="font-medium">{format(endDate, "EEE, MMM d, yyyy")} · {returnTime}</p>
          </div>
        </div>
        
        <div className="text-sm">
          <p className="text-muted-foreground">Location</p>
          <p className="font-medium">{location}</p>
        </div>
        
        {preferWhatsApp && (
          <div className="flex items-center text-sm text-green-600 bg-green-50 p-2 rounded">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>WhatsApp notifications enabled</span>
          </div>
        )}
      </div>
    </>
  );
};
