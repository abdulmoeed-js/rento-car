import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Booking, Car } from "@/types/car";
import { toast } from "sonner";
import RentoHeader from "@/components/layout/RentoHeader";
import OwnerSidebar from "@/components/owner/OwnerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CarFront, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from 'date-fns';

const OwnerBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  // Redirect if not logged in or not a host
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else if (user.user_role !== 'host') {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch bookings
  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First, get all cars owned by this host
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('id')
        .eq('host_id', user.id);
        
      if (carsError) throw carsError;
      
      if (!carsData || carsData.length === 0) {
        setBookings([]);
        setFilteredBookings([]);
        setLoading(false);
        return;
      }
      
      const carIds = carsData.map(car => car.id);
      
      // Then, get all bookings for these cars
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (*),
          profiles (*)
        `)
        .in('car_id', carIds);
        
      if (bookingsError) throw bookingsError;
      
      if (bookingsData) {
        // Process bookings to handle potential errors
        const processedBookings = bookingsData.map(booking => {
          return {
            ...booking,
            cars: booking.cars || null,
            profiles: booking.profiles || null,
          } as Booking;
        });
        
        setBookings(processedBookings);
        
        // Set initial filtered bookings based on default tab
        const filtered = filterBookingsByStatus(processedBookings, selectedStatus);
        setFilteredBookings(filtered);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user, navigate]);

  // Function to filter bookings by status
  const filterBookingsByStatus = (bookings: Booking[], status: string) => {
    if (status === 'all') {
      return bookings;
    } else {
      return bookings.filter(booking => booking.status === status);
    }
  };

  // Handle tab change
  const handleTabChange = (status: any) => {
    setSelectedStatus(status);
    const filtered = filterBookingsByStatus(bookings, status);
    setFilteredBookings(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <RentoHeader />

      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          <OwnerSidebar />

          <div className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle>Manage Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={selectedStatus} className="space-y-4" onValueChange={handleTabChange}>
                  <TabsList className="grid grid-cols-5">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                  </TabsList>
                  
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin h-12 w-12 border-4 border-rento-blue border-t-transparent rounded-full"></div>
                    </div>
                  ) : filteredBookings.length > 0 ? (
                    <div className="space-y-4">
                      {filteredBookings.map((booking) => {
                        const cars = booking.cars as Car; // Type assertion
                        return (
                          <Card key={booking.id} className="border">
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h3 className="text-lg font-semibold">{cars?.brand} {cars?.model}</h3>
                                <p className="text-muted-foreground">
                                  {format(parseISO(booking.start_date), 'MMM d, yyyy')} - {format(parseISO(booking.end_date), 'MMM d, yyyy')}
                                </p>
                                <p className="text-sm mt-2">
                                  Renter: {booking.profiles?.full_name || 'Unknown'}
                                </p>
                              </div>
                              <div className="flex items-center justify-end">
                                <Badge
                                  className={`${
                                    booking.status === 'pending'
                                      ? 'bg-amber-500'
                                      : booking.status === 'confirmed'
                                      ? 'bg-green-500'
                                      : booking.status === 'completed'
                                      ? 'bg-blue-500'
                                      : 'bg-red-500'
                                  }`}
                                >
                                  {booking.status}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-muted-foreground">No bookings found with status: {selectedStatus}</p>
                    </div>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OwnerBookings;
