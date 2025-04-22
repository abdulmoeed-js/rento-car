
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  CarFront, 
  LogOut, 
  User, 
  Plus, 
  Calendar, 
  DollarSign, 
  Bell, 
  ClipboardList, 
  Settings,
  CarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RentoHeader from "@/components/layout/RentoHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Booking } from "@/types/car";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const OwnerPortal = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [earnings, setEarnings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);

  // Redirect to auth if not logged in or not a host
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else if (user.user_role !== 'host') {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch owner data
  useEffect(() => {
    const fetchOwnerData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch cars - using car_images instead of images
        const { data: carsData, error: carsError } = await supabase
          .from('cars')
          .select(`
            *,
            car_images (*),
            bookings (*)
          `)
          .eq('host_id', user.id);
          
        if (carsError) {
          console.error("Error fetching cars:", carsError);
          throw carsError;
        }
        
        // Fetch bookings
        const carIds = carsData?.map(car => car.id) || [];
        let allBookings: Booking[] = [];
        
        if (carIds.length > 0) {
          const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
              *,
              cars (*),
              profiles (*)
            `)
            .in('car_id', carIds);
            
          if (bookingsError) {
            console.error("Error fetching bookings:", bookingsError);
            throw bookingsError;
          }
          
          // Process bookings to ensure they match the Booking type
          allBookings = bookingsData ? bookingsData.map(booking => {
            return {
              ...booking,
              profiles: booking.profiles && typeof booking.profiles === 'object' 
                ? booking.profiles 
                : null
            } as Booking;
          }) : [];
          
          // Count pending requests
          const pending = allBookings.filter(booking => booking.status === 'pending').length;
          setPendingRequests(pending);
          
          // Calculate earnings (from confirmed bookings)
          const totalEarnings = allBookings
            .filter(booking => booking.status === 'confirmed')
            .reduce((sum, booking) => sum + (booking.total_price || 0), 0);
          setEarnings(totalEarnings);
        }
        
        // Process cars to ensure they match the Car type
        const processedCars = carsData ? carsData.map(car => {
          // Safely handle car.car_images with proper type checking
          const carImagesData = car.car_images;
          const carImages = Array.isArray(carImagesData) ? carImagesData : [];
          const primaryImage = carImages.find(img => img.is_primary);
          
          return {
            ...car,
            image_url: primaryImage?.image_path || (carImages.length > 0 ? carImages[0].image_path : ''),
            images: carImages, // Maintain compatibility with the Car type
            bookings: Array.isArray(car.bookings) ? car.bookings : []
          } as Car;
        }) : [];
        
        setCars(processedCars);
        setBookings(allBookings);
      } catch (error) {
        console.error('Error fetching owner data:', error);
        toast.error('Failed to load your data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOwnerData();
  }, [user]);

  if (!user || user.user_role !== 'host') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RentoHeader />

      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-rento-dark">Owner Portal</h1>
          <div className="flex space-x-2">
            <Button asChild>
              <Link to="/owner-portal/cars/new" className="flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Add New Car
              </Link>
            </Button>
            {pendingRequests > 0 && (
              <Button asChild variant="outline">
                <Link to="/owner-portal/bookings/requests" className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  <span>Requests</span>
                  <Badge className="ml-2 bg-red-500">{pendingRequests}</Badge>
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-muted-foreground">Total Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CarFront className="h-8 w-8 text-rento-blue mr-3" />
                {loading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  <span className="text-3xl font-bold">{cars.length}</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-muted-foreground">Active Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600 mr-3" />
                {loading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  <span className="text-3xl font-bold">
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-muted-foreground">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-amber-600 mr-3" />
                {loading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  <span className="text-3xl font-bold">${earnings.toFixed(2)}</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cars" className="space-y-6">
          <TabsList className="grid grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="cars">My Cars</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cars" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="mt-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : cars.length > 0 ? (
                cars.map((car) => (
                  <Card key={car.id} className="overflow-hidden">
                    <div className="aspect-video relative">
                      <img 
                        src={car.image_url || (car.images && car.images[0]?.image_path) || '/placeholder.svg'} 
                        alt={`${car.brand} ${car.model}`}
                        className="w-full h-full object-cover"
                      />
                      {car.bookings && car.bookings.some(b => b.status === 'confirmed') && (
                        <Badge className="absolute top-2 right-2 bg-green-500">
                          Active
                        </Badge>
                      )}
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-lg mb-1">{car.brand} {car.model}</h3>
                      <p className="text-sm text-muted-foreground mb-4">${car.price_per_day}/day</p>
                      <div className="flex space-x-2">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link to={`/owner-portal/cars/edit/${car.id}`}>
                            Edit
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="secondary" className="flex-1">
                          <Link to={`/cars/${car.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <CarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No cars listed yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start earning by adding your first car to the platform.
                  </p>
                  <Button asChild>
                    <Link to="/owner-portal/cars/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Car
                    </Link>
                  </Button>
                </div>
              )}
              
              {!loading && cars.length > 0 && (
                <Card className="flex flex-col items-center justify-center p-6 border-dashed">
                  <Button asChild variant="outline" className="w-full h-full">
                    <Link to="/owner-portal/cars/new" className="flex flex-col items-center py-6">
                      <Plus className="h-10 w-10 mb-2 text-muted-foreground" />
                      <span>Add Another Car</span>
                    </Link>
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Recent Bookings</span>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/owner-portal/bookings">View All</Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="mb-4 flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ))
                ) : bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings
                      .filter(b => b.status !== 'pending')
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 5)
                      .map((booking) => (
                        <div key={booking.id} className="flex items-start gap-4 p-3 rounded-lg border">
                          <div className="bg-muted w-12 h-12 rounded-md flex items-center justify-center">
                            <CarFront className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">
                                  {booking.cars?.brand} {booking.cars?.model}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge
                                className={`${
                                  booking.status === 'confirmed' 
                                    ? 'bg-green-500' 
                                    : booking.status === 'completed'
                                    ? 'bg-blue-500'
                                    : booking.status === 'cancelled'
                                    ? 'bg-red-500'
                                    : 'bg-amber-500'
                                }`}
                              >
                                {booking.status}
                              </Badge>
                            </div>
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Renter:</span> {booking.profiles?.full_name || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-muted-foreground">No bookings yet</p>
                  </div>
                )}
                
                {!loading && pendingRequests > 0 && (
                  <div className="mt-6 text-center">
                    <Button asChild>
                      <Link to="/owner-portal/bookings/requests">
                        View {pendingRequests} Pending Request{pendingRequests !== 1 ? 's' : ''}
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Earnings Summary</span>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/owner-portal/earnings">Detailed Report</Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : earnings > 0 ? (
                  <div className="space-y-6">
                    <div className="bg-muted p-6 rounded-lg text-center">
                      <h3 className="text-lg font-medium mb-2">Total Earnings</h3>
                      <p className="text-4xl font-bold text-green-600">${earnings.toFixed(2)}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-3">Earnings by Car</h3>
                      {cars.map(car => {
                        const carBookings = bookings.filter(
                          b => b.car_id === car.id && b.status === 'confirmed'
                        );
                        const carEarnings = carBookings.reduce(
                          (sum, b) => sum + (b.total_price || 0), 0
                        );
                        
                        return (
                          <div key={car.id} className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm">
                                {car.brand} {car.model}
                              </span>
                              <span className="font-medium">
                                ${carEarnings.toFixed(2)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-rento-blue h-full" 
                                style={{ width: `${(carEarnings / earnings) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-muted-foreground">No earnings yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Earnings will appear here once you have confirmed bookings
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OwnerPortal;
