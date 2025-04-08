import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BookingRequest } from "@/types/owner";
import { toast } from "sonner";
import RentoHeader from "@/components/layout/RentoHeader";
import OwnerSidebar from "@/components/owner/OwnerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Check, X, Calendar, Car, MapPin, Clock, MessageSquare, PhoneCall } from "lucide-react";
import { format, parseISO } from "date-fns";

const BookingRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending');

  // Redirect if not logged in or not a host
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else if (user.user_role !== 'host') {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch booking requests
  useEffect(() => {
    const fetchBookingRequests = async () => {
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
          setBookingRequests([]);
          setFilteredRequests([]);
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
          // Transform to BookingRequest format with type safety
          const requests = bookingsData.map(booking => {
            // Safely access profiles data by treating it as a generic object first
            const profilesData = booking.profiles as any;
            let renterName = 'Unknown User';
            
            // Check if profiles exists and has full_name property
            if (profilesData && typeof profilesData === 'object' && 'full_name' in profilesData) {
              renterName = profilesData.full_name || 'Unknown User';
            }
            
            // Create a properly typed BookingRequest object
            return {
              ...booking,
              renter_name: renterName,
              // Add default values for other properties that might be missing
              cars: booking.cars || null,
              profiles: booking.profiles || null
            } as BookingRequest;
          });
          
          setBookingRequests(requests);
          
          // Set initial filtered requests based on default tab (pending)
          const pending = requests.filter(req => req.status === 'pending');
          setFilteredRequests(pending);
        }
      } catch (error) {
        console.error('Error fetching booking requests:', error);
        toast.error('Failed to load booking requests. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingRequests();
  }, [user, navigate]);

  // Filter requests based on selected tab
  useEffect(() => {
    if (!bookingRequests.length) return;
    
    switch (selectedTab) {
      case 'all':
        setFilteredRequests(bookingRequests);
        break;
      case 'pending':
        setFilteredRequests(bookingRequests.filter(req => req.status === 'pending'));
        break;
      case 'accepted':
        setFilteredRequests(bookingRequests.filter(req => req.status === 'confirmed'));
        break;
      case 'rejected':
        setFilteredRequests(bookingRequests.filter(req => req.status === 'rejected'));
        break;
      default:
        setFilteredRequests(bookingRequests);
    }
  }, [selectedTab, bookingRequests]);

  // Handle request action (accept/reject)
  const handleRequestAction = async (bookingId: string, action: 'accept' | 'reject') => {
    try {
      setProcessingId(bookingId);
      
      const status = action === 'accept' ? 'confirmed' : 'rejected';
      
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);
        
      if (error) throw error;
      
      // Update local state
      setBookingRequests(prev =>
        prev.map(req =>
          req.id === bookingId ? { ...req, status } : req
        )
      );
      
      // Show success message
      toast.success(
        action === 'accept'
          ? 'Booking request accepted!'
          : 'Booking request rejected.'
      );
      
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error);
      toast.error(`Failed to ${action} booking. Please try again.`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <RentoHeader />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          <OwnerSidebar />
          
          <div className="flex-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Booking Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedTab} onValueChange={(v: any) => setSelectedTab(v)}>
                  <TabsList className="grid grid-cols-4 mb-6">
                    <TabsTrigger value="pending">
                      Pending
                      {bookingRequests.filter(req => req.status === 'pending').length > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {bookingRequests.filter(req => req.status === 'pending').length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="accepted">Accepted</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                  </TabsList>
                
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin h-12 w-12 border-4 border-rento-blue border-t-transparent rounded-full"></div>
                    </div>
                  ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No {selectedTab === 'all' ? '' : selectedTab} requests</h3>
                      <p className="text-muted-foreground">
                        {selectedTab === 'pending' 
                          ? 'You have no pending booking requests to review'
                          : selectedTab === 'accepted'
                          ? 'You have not accepted any booking requests yet'
                          : selectedTab === 'rejected'
                          ? 'You have not rejected any booking requests yet'
                          : 'You have no booking requests yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredRequests.map((request) => (
                        <Card key={request.id} className="overflow-hidden">
                          <div className="flex flex-col md:flex-row">
                            <div className="md:w-1/3 bg-gray-100 p-4 flex flex-col space-y-4">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-12 w-12 border">
                                  <AvatarImage src={request.renter_image} alt={request.renter_name} />
                                  <AvatarFallback>{request.renter_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-medium">{request.renter_name}</h3>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <span>{request.renter_rating || 'New User'}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="rounded-md bg-white p-3 space-y-3">
                                <div className="flex items-start space-x-2">
                                  <Calendar className="h-5 w-5 text-rento-blue shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium">Trip Dates</p>
                                    <p className="text-sm text-muted-foreground">
                                      {format(parseISO(request.start_date), 'MMM d, yyyy')} - {format(parseISO(request.end_date), 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                </div>
                                
                                {request.pickup_time && request.return_time && (
                                  <div className="flex items-start space-x-2">
                                    <Clock className="h-5 w-5 text-rento-blue shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-medium">Pickup & Return</p>
                                      <p className="text-sm text-muted-foreground">
                                        {request.pickup_time} - {request.return_time}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {request.location && (
                                  <div className="flex items-start space-x-2">
                                    <MapPin className="h-5 w-5 text-rento-blue shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-medium">Pickup Location</p>
                                      <p className="text-sm text-muted-foreground">{request.location}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {request.total_price && (
                                  <div className="text-right font-bold">
                                    ${request.total_price.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="md:w-2/3 p-4">
                              <div className="mb-4 flex justify-between items-start">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <Car className="h-5 w-5 text-rento-blue" />
                                    <h3 className="font-medium">
                                      {request.cars?.brand} {request.cars?.model} ({request.cars?.year})
                                    </h3>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Request created on {format(parseISO(request.created_at), 'MMM d, yyyy')}
                                  </p>
                                </div>
                                
                                <Badge 
                                  className={`
                                    ${request.status === 'pending' ? 'bg-amber-500' : 
                                      request.status === 'confirmed' ? 'bg-green-500' : 
                                      'bg-red-500'
                                    }
                                  `}
                                >
                                  {request.status === 'pending' ? 'Pending' : 
                                    request.status === 'confirmed' ? 'Accepted' : 
                                    'Rejected'
                                  }
                                </Badge>
                              </div>
                              
                              {request.message && (
                                <div className="bg-gray-50 rounded-md p-3 mb-4">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <MessageSquare className="h-4 w-4" />
                                    <p className="text-sm font-medium">Message from renter:</p>
                                  </div>
                                  <p className="text-sm">{request.message}</p>
                                </div>
                              )}
                              
                              {request.prefer_whatsapp && (
                                <div className="flex items-center space-x-2 text-sm text-green-600 mb-4">
                                  <PhoneCall className="h-4 w-4" />
                                  <span>Prefers WhatsApp for communication</span>
                                </div>
                              )}
                              
                              {request.status === 'pending' && (
                                <div className="flex space-x-2 mt-6">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        disabled={!!processingId}
                                      >
                                        <X className="mr-2 h-4 w-4" />
                                        Reject
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Reject Booking Request</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to reject this booking request? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          className="bg-red-600 hover:bg-red-700"
                                          onClick={() => handleRequestAction(request.id, 'reject')}
                                        >
                                          Reject
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  
                                  <Button 
                                    className="flex-1"
                                    disabled={!!processingId}
                                    onClick={() => handleRequestAction(request.id, 'accept')}
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Accept
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
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

export default BookingRequests;
