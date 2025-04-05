
import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCarById, getMonthlyAvailability } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { MapPin, Star } from "lucide-react";
import RentoHeader from "@/components/layout/RentoHeader";
import CarImageGallery from "@/components/car/CarImageGallery";
import CarDetails from "@/components/car/CarDetails";
import CarBookingSidebar from "@/components/car/CarBookingSidebar";
import CarNotFound from "@/components/car/CarNotFound";

const CarDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: car, isLoading } = useQuery({
    queryKey: ['car', id],
    queryFn: () => getCarById(id as string),
    enabled: !!id
  });

  // Generate availability data for current and next month
  const now = new Date();
  const currentMonthAvailability = car?.bookings
    ? getMonthlyAvailability(now.getFullYear(), now.getMonth(), car.bookings)
    : [];
  
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthAvailability = car?.bookings
    ? getMonthlyAvailability(nextMonth.getFullYear(), nextMonth.getMonth(), car.bookings)
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-rento-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!car) {
    return <CarNotFound />;
  }

  // Default image if car has no images
  const carImages = car.images && car.images.length > 0 
    ? car.images.map(img => img.image_path) 
    : ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000'];

  return (
    <div className="min-h-screen bg-gray-50">
      <RentoHeader />

      {/* Main Content */}
      <main className="container mx-auto p-4 py-6">
        <div className="mb-4">
          <Button 
            variant="ghost" 
            asChild 
            className="mb-2"
          >
            <Link to="/cars">← Back to listings</Link>
          </Button>
          <h1 className="text-2xl font-bold">{car.brand} {car.model} {car.year}</h1>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{car.location}</span>
            
            {car.host_rating ? (
              <div className="flex items-center ml-4">
                <Star className="h-4 w-4 text-amber-500 mr-1" fill="currentColor" />
                <span>{car.host_rating.toFixed(1)} host rating</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Car Images and Details */}
          <div className="lg:col-span-2">
            <CarImageGallery 
              images={carImages} 
              alt={`${car.brand} ${car.model}`} 
            />
            <CarDetails car={car} />
          </div>
          
          {/* Right Column: Booking Panel and Availability */}
          <div>
            <CarBookingSidebar 
              car={car}
              currentMonthAvailability={currentMonthAvailability}
              nextMonthAvailability={nextMonthAvailability}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CarDetail;
