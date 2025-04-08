import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Car, Booking } from "@/types/car";
import { toast } from "sonner";
import RentoHeader from "@/components/layout/RentoHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Car as CarIcon, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const OwnerBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchBookings();
  }, [user]);

  useEffect(() => {
    const filtered = bookings.filter(booking => {
      const cars = booking.cars as Car;
      return (
        cars.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cars.model.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    setFilteredBookings(filtered);
  }, [searchQuery, bookings]);

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (*),
          profiles (*)
        `)
        .or(`status.eq.confirmed,status.eq.completed,status.eq.cancelled`)
        .order('created_at', { ascending: false });
      
      if (bookingsError) throw bookingsError;
      
      if (bookingsData) {
        // Add proper type assertion to handle the Supabase response
        const typedBookings = bookingsData.map(booking => {
          return {
            ...booking,
            cars: booking.cars as unknown as Car,
            profiles: booking.profiles as unknown as Booking['profiles']
          } as Booking;
        });
        
        setBookings(typedBookings as Booking[]);
        setFilteredBookings(typedBookings as Booking[]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RentoHeader />
        <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-rento-blue border-t-transparent rounded-full mb-4"></div>
          <p className="text-lg">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RentoHeader />
      
      <main className="container mx-auto py-8 px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Bookings</CardTitle>
            <CardDescription>
              Manage and view all bookings for your listed cars
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="relative">
                <Label htmlFor="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  Search:
                </Label>
                <Input
                  id="search"
                  placeholder="Search by car brand or model..."
                  className="pl-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {filteredBookings.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-lg text-gray-500">No bookings found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBookings.map(booking => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

const BookingCard = ({ booking }: { booking: Booking }) => {
  const cars = booking.cars as Car;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {cars.brand} {cars.model}
          <Badge variant="secondary">{booking.status}</Badge>
        </CardTitle>
        <CardDescription>
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            {format(new Date(booking.start_date), 'MMM dd, yyyy')} - {format(new Date(booking.end_date), 'MMM dd, yyyy')}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">
              {booking.profiles?.full_name || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500">
              <Users className="h-3 w-3 inline-block mr-1" />
              Renter
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <CarIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm">
            {cars.car_type}, {cars.transmission}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default OwnerBookings;
