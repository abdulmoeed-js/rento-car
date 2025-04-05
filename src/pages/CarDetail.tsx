
import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCarById, getMonthlyAvailability } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import { CarFront, User, LogOut, Calendar, MapPin, Fuel, Gauge, Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const CarDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const handleBookNow = () => {
    if (!user) {
      toast.error("Please sign in to book a car");
      navigate("/auth");
      return;
    }
    
    toast.success("Booking functionality will be implemented in the next phase!");
  };

  const handlePrevImage = () => {
    if (!car?.images?.length) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? car.images!.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!car?.images?.length) return;
    setCurrentImageIndex((prev) => 
      prev === car.images!.length - 1 ? 0 : prev + 1
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-rento-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <CarFront className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Car Not Found</h1>
        <p className="text-muted-foreground mb-4">The car you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/cars">Back to Car Listings</Link>
        </Button>
      </div>
    );
  }

  // Default image if car has no images
  const carImages = car.images && car.images.length > 0 
    ? car.images.map(img => img.image_path) 
    : ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000'];
  
  const currentImage = carImages[currentImageIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-rento-blue text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <CarFront className="h-6 w-6" />
            <span className="font-bold text-xl">Rento</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <span className="hidden sm:inline">
                    {user.email || user.phone}
                  </span>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={signOut}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button asChild variant="secondary">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

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
            {/* Car Image Gallery */}
            <Card className="mb-6 overflow-hidden">
              <div className="relative">
                <div className="aspect-video">
                  <img 
                    src={currentImage} 
                    alt={`${car.brand} ${car.model}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Image Navigation */}
                {carImages.length > 1 && (
                  <>
                    <Button 
                      onClick={handlePrevImage}
                      variant="secondary"
                      size="icon"
                      className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full h-8 w-8"
                    >
                      {"<"}
                    </Button>
                    <Button 
                      onClick={handleNextImage}
                      variant="secondary"
                      size="icon"
                      className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full h-8 w-8"
                    >
                      {">"}
                    </Button>
                  </>
                )}
              </div>
              
              {/* Thumbnail Previews */}
              {carImages.length > 1 && (
                <div className="p-2 flex gap-2 overflow-x-auto">
                  {carImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-16 w-24 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                        index === currentImageIndex ? 'border-rento-blue' : 'border-transparent'
                      }`}
                    >
                      <img 
                        src={image} 
                        alt={`Thumbnail ${index}`} 
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </Card>
            
            {/* Car Details */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Car Details</h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                    <Gauge className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-sm font-medium">{car.transmission}</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                    <Fuel className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-sm font-medium">{car.fuel_type}</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                    <CarFront className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-sm font-medium">{car.car_type}</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-sm font-medium">{car.year}</span>
                  </div>
                </div>
                
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-muted-foreground">{car.description}</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column: Booking Panel and Availability */}
          <div>
            {/* Booking Panel */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-2xl font-bold">${car.price_per_day}</span>
                    <span className="text-muted-foreground"> / day</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mb-4" 
                  size="lg"
                  onClick={handleBookNow}
                >
                  Book Now
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  You won't be charged yet
                </p>
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
        </div>
      </main>
    </div>
  );
};

export default CarDetail;
