
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RentoHeader from "@/components/layout/RentoHeader";
import { BookingRequest } from "@/types/owner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Check, X, Calendar as CalendarIcon, Filter, Car } from "lucide-react";
import { cn } from "@/lib/utils";

const BookingRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BookingRequest[]>([]);
  const [cars, setCars] = useState<{id: string, name: string}[]>([]);
  const [filters, setFilters] = useState({
    car: "all",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    searchTerm: ""
  });

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
        
        // First fetch user's cars
        const { data: carsData, error: carsError } = await supabase
          .from('cars')
          .select('id, brand, model')
          .eq('host_id', user.id);
          
        if (carsError) throw carsError;
        
        const carsList = (carsData || []).map(car => ({
          id: car.id,
          name: `${car.brand} ${car.model}`
        }));
        
        setCars(carsList);
        
        // If no cars, no need to fetch bookings
        if (carsList.length === 0) {
          setLoading(false);
          return;
        }
        
        const carIds = carsList.map(car => car.id);
        
        // Fetch booking requests with pending status
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            cars (*),
            profiles (*)
          `)
          .in('car_id', carIds)
          .eq('status', 'pending');
          
        if (bookingsError) throw bookingsError;
        
        // Transform data to match BookingRequest type
        const requests = (bookingsData || []).map(booking => ({
          ...booking,
          renter_name: booking.profiles?.full_name || 'Unknown User'
        }));
        
        setBookingRequests(requests);
        setFilteredRequests(requests);
      } catch (error) {
        console.error('Error fetching booking requests:', error);
        toast.error('Failed to load booking requests');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingRequests();
  }, [user]);

  // Apply filters
  useEffect(() => {
    let filtered = [...bookingRequests];
    
    // Filter by car
    if (filters.car !== "all") {
      filtered = filtered.filter(request => request.car_id === filters.car);
    }
    
    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(request => {
        const requestStartDate = new Date(request.start_date);
        return requestStartDate >= filters.startDate!;
      });
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(request => {
        const requestEndDate = new Date(request.end_date);
        return requestEndDate <= filters.endDate!;
      });
    }
    
    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        request => 
          request.renter_name.toLowerCase().includes(term) ||
          (request.cars?.brand + ' ' + request.cars?.model).toLowerCase().includes(term) ||
          request.message?.toLowerCase().includes(term)
      );
    }
    
    setFilteredRequests(filtered);
  }, [filters, bookingRequests]);

  // Handle booking actions
  const handleBookingAction = async (bookingId: string, action: 'confirm' | 'reject') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: action === 'confirm' ? 'confirmed' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
        
      if (error) throw error;
      
      // Update local state
      setBookingRequests(prev => prev.filter(req => req.id !== bookingId));
      
      toast.success(
        action === 'confirm' 
          ? 'Booking confirmed successfully' 
          : 'Booking rejected'
      );
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      car: "all",
      startDate: undefined,
      endDate: undefined,
      searchTerm: ""
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <RentoHeader />
      
      <main className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Booking Requests</CardTitle>
                <CardDescription>
                  Manage pending booking requests for your cars
                </CardDescription>
              </div>
              
              <Button variant="outline" onClick={() => navigate('/owner-portal')}>
                Back to Dashboard
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Filters */}
            <div className="mb-6 bg-muted p-4 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4" />
                <h3 className="font-medium">Filters</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm mb-1 block">Car</label>
                  <Select
                    value={filters.car}
                    onValueChange={(value) => setFilters({...filters, car: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All cars" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cars</SelectItem>
                      {cars.map(car => (
                        <SelectItem key={car.id} value={car.id}>
                          {car.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm mb-1 block">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate ? format(filters.startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.startDate}
                        onSelect={(date) => setFilters({...filters, startDate: date})}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="text-sm mb-1 block">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.endDate ? format(filters.endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.endDate}
                        onSelect={(date) => setFilters({...filters, endDate: date})}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="text-sm mb-1 block">Search</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search name or car..."
                      value={filters.searchTerm}
                      onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={resetFilters}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Booking Requests List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-rento-blue border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading booking requests...</p>
              </div>
            ) : filteredRequests.length > 0 ? (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1 bg-muted p-4">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <User className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{request.renter_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {request.profiles?.phone_number || "No phone"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <Car className="h-4 w-4 mt-0.5 text-gray-500" />
                            <span>
                              {request.cars?.brand} {request.cars?.model}
                            </span>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <CalendarIcon className="h-4 w-4 mt-0.5 text-gray-500" />
                            <div>
                              <div>{format(new Date(request.start_date), "PPP")}</div>
                              <div>to {format(new Date(request.end_date), "PPP")}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:col-span-2 p-4">
                        <h4 className="font-medium mb-2">Message from Renter</h4>
                        <div className="bg-gray-50 p-3 rounded-md text-sm min-h-24">
                          {request.message || "No message provided"}
                        </div>
                        
                        <div className="mt-4 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-medium block">Pickup:</span>
                              <span>{request.pickup_time || "Not specified"}</span>
                            </div>
                            <div>
                              <span className="font-medium block">Return:</span>
                              <span>{request.return_time || "Not specified"}</span>
                            </div>
                          </div>
                          
                          {request.prefer_whatsapp && (
                            <div className="mt-2">
                              <Badge variant="outline" className="bg-green-50">
                                Prefers WhatsApp for communication
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="md:col-span-1 bg-gray-50 p-4 flex flex-col">
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">Booking Details</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Duration:</span>
                              <span className="font-medium">
                                {Math.round((new Date(request.end_date).getTime() - new Date(request.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                              </span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span>Daily Rate:</span>
                              <span className="font-medium">
                                ${request.cars?.price_per_day}
                              </span>
                            </div>
                            
                            <div className="flex justify-between border-t pt-1 mt-1">
                              <span>Total:</span>
                              <span className="font-bold">
                                ${request.total_price || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mt-4">
                          <Button 
                            className="w-full" 
                            onClick={() => handleBookingAction(request.id, 'confirm')}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Accept
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={() => handleBookingAction(request.id, 'reject')}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium mb-1">No booking requests</h3>
                <p className="text-muted-foreground">
                  {cars.length > 0 
                    ? "You don't have any pending booking requests at the moment."
                    : "You need to add a car before you can receive booking requests."}
                </p>
                
                {cars.length === 0 && (
                  <Button
                    className="mt-4"
                    onClick={() => navigate('/owner-portal/cars/new')}
                  >
                    Add Your First Car
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BookingRequests;
