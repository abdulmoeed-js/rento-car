import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BookingRequest } from "@/types/owner";
import { Car, Booking } from "@/types/car";
import { toast } from "sonner";
import RentoHeader from "@/components/layout/RentoHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, User } from "lucide-react";

const BookingRequests = () => {
  const { user } = useAuth();
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch booking requests on mount
  useEffect(() => {
    fetchBookingRequests();
  }, [user]);

  // Filter requests based on search term
  useEffect(() => {
    const filtered = bookingRequests.filter(request =>
      request.cars?.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.cars?.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRequests(filtered);
  }, [searchTerm, bookingRequests]);

  const fetchBookingRequests = async () => {
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
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (bookingsError) throw bookingsError;
      
      if (bookingsData) {
        // Transform to BookingRequest format with type safety
        const requests = bookingsData.map(booking => {
          // Safely access profiles data by treating it as a generic object first
          const profilesData = booking.profiles as any;
          let renterName = 'Unknown User';
          
          // Check if profiles exists and has full_name property
          if (profilesData && typeof profilesData === 'object' && 'full_name' in profilesData) {
            renterName = profilesData.full_name || 'Unknown User';
          }
          
          // Create a properly typed BookingRequest object with type assertion
          return {
            ...booking,
            renter_name: renterName,
            // Add other required properties with defaults to satisfy the BookingRequest type
            cars: booking.cars as unknown as Car,
            profiles: profilesData as unknown as Booking['profiles']
          } as BookingRequest;
        });
        
        setBookingRequests(requests as BookingRequest[]);
        setFilteredRequests(requests as BookingRequest[]);
      }
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      toast.error('Failed to load booking requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveBooking = async (bookingId: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast.success('Booking request approved!');
      fetchBookingRequests();
    } catch (error) {
      console.error('Error approving booking:', error);
      toast.error('Failed to approve booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'rejected' })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast.success('Booking request rejected!');
      fetchBookingRequests();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast.error('Failed to reject booking');
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
          <p className="text-lg">Loading booking requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RentoHeader />
      
      <main className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Booking Requests</CardTitle>
            <CardDescription>
              Approve or reject pending booking requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by car or renter name"
                className="w-full px-4 py-2 border rounded-md focus:ring-rento-blue focus:border-rento-blue"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {filteredRequests.length === 0 ? (
              <p>No booking requests found.</p>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map(request => (
                  <Card key={request.id}>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1 flex items-center">
                        <Avatar className="mr-4">
                          <AvatarImage src={request.profiles?.license_image_url || ""} />
                          <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.renter_name}</p>
                          <p className="text-sm text-muted-foreground">{request.profiles?.email}</p>
                        </div>
                      </div>
                      
                      <div className="md:col-span-1">
                        <p className="font-medium">{request.cars?.brand} {request.cars?.model}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="md:col-span-1 flex justify-end items-center">
                        <Button 
                          variant="outline" 
                          className="mr-2"
                          onClick={() => handleApproveBooking(request.id)}
                          disabled={isLoading}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => handleRejectBooking(request.id)}
                          disabled={isLoading}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BookingRequests;
