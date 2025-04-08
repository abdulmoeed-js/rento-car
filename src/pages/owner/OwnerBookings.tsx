
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RentoHeader from "@/components/layout/RentoHeader";
import { Booking } from "@/types/car";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  Trash, 
  Download,
  Eye,
  User,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail
} from "lucide-react";

const OwnerBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<{id: string, name: string}[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  
  const [filters, setFilters] = useState({
    car: "all",
    status: "all",
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

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
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
        
        // Fetch all bookings for user's cars
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            cars (*),
            profiles (*)
          `)
          .in('car_id', carIds)
          .order('start_date', { ascending: false });
          
        if (bookingsError) throw bookingsError;
        
        setBookings(bookingsData || []);
        setFilteredBookings(bookingsData || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, [user]);

  // Apply filters
  useEffect(() => {
    let filtered = [...bookings];
    
    // Filter by car
    if (filters.car !== "all") {
      filtered = filtered.filter(booking => booking.car_id === filters.car);
    }
    
    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }
    
    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        booking => 
          (booking.profiles?.full_name || '').toLowerCase().includes(term) ||
          (booking.cars?.brand + ' ' + booking.cars?.model).toLowerCase().includes(term) ||
          booking.message?.toLowerCase().includes(term) ||
          booking.location?.toLowerCase().includes(term)
      );
    }
    
    setFilteredBookings(filtered);
  }, [filters, bookings]);

  // View booking details
  const viewBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDialog(true);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      car: "all",
      status: "all",
      searchTerm: ""
    });
  };

  // Export bookings as CSV
  const exportBookings = () => {
    try {
      const headers = [
        'Booking ID',
        'Car',
        'Renter',
        'Start Date',
        'End Date',
        'Status',
        'Total Price'
      ];

      const rows = filteredBookings.map(booking => [
        booking.id,
        `${booking.cars?.brand || ''} ${booking.cars?.model || ''}`,
        booking.profiles?.full_name || 'Unknown',
        booking.start_date,
        booking.end_date,
        booking.status,
        booking.total_price || '0'
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `bookings_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success('Bookings exported successfully');
    } catch (error) {
      console.error('Error exporting bookings:', error);
      toast.error('Failed to export bookings');
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      case 'rejected': return 'bg-red-500';
      case 'pending': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <RentoHeader />
      
      <main className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Bookings</CardTitle>
                <CardDescription>
                  Manage all bookings for your cars
                </CardDescription>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/owner-portal')}>
                  Back to Dashboard
                </Button>
                
                <Button variant="outline" onClick={exportBookings}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Filters */}
            <div className="mb-6 bg-muted p-4 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4" />
                <h3 className="font-medium">Filters</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <label className="text-sm mb-1 block">Status</label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({...filters, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm mb-1 block">Search</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search renter, car, location..."
                        value={filters.searchTerm}
                        onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                        className="pl-9"
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={resetFilters}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tabs for booking status */}
            <Tabs defaultValue="all" className="mb-6" onValueChange={(value) => setFilters({...filters, status: value})}>
              <TabsList className="grid grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled/Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Bookings Table */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-rento-blue border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading bookings...</p>
              </div>
            ) : filteredBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Car</TableHead>
                      <TableHead>Renter</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.cars?.brand} {booking.cars?.model}
                        </TableCell>
                        <TableCell>
                          {booking.profiles?.full_name || "Unknown User"}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(booking.start_date), "MMM d, yyyy")}</div>
                            <div>to {format(new Date(booking.end_date), "MMM d, yyyy")}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ${booking.total_price || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => viewBookingDetails(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium mb-1">No bookings found</h3>
                <p className="text-muted-foreground">
                  {cars.length > 0 
                    ? "No bookings match your current filters."
                    : "You need to add a car before you can receive bookings."}
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
      
      {/* Booking Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Booking ID: {selectedBooking?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-lg mb-3">Car Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center mr-3">
                      <Car className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{selectedBooking.cars?.brand} {selectedBooking.cars?.model}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedBooking.cars?.year} • {selectedBooking.cars?.transmission}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5 text-gray-500" />
                      <div>
                        <span className="font-medium">Booking Period:</span>
                        <div>{format(new Date(selectedBooking.start_date), "MMMM d, yyyy")}</div>
                        <div>to {format(new Date(selectedBooking.end_date), "MMMM d, yyyy")}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-0.5 text-gray-500" />
                      <div>
                        <span className="font-medium">Pickup/Return Times:</span>
                        <div>Pickup: {selectedBooking.pickup_time || "Not specified"}</div>
                        <div>Return: {selectedBooking.return_time || "Not specified"}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                      <div>
                        <span className="font-medium">Location:</span>
                        <div>{selectedBooking.location || selectedBooking.cars?.location || "Not specified"}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium text-lg mb-3">Payment Details</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Daily Rate:</span>
                        <span>${selectedBooking.cars?.price_per_day}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>
                          {Math.round((new Date(selectedBooking.end_date).getTime() - new Date(selectedBooking.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                      
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold">${selectedBooking.total_price || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-3">Renter Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{selectedBooking.profiles?.full_name || "Unknown User"}</h4>
                      <Badge className={getStatusColor(selectedBooking.status)}>
                        {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 mt-0.5 text-gray-500" />
                      <div>
                        <span className="font-medium">Phone:</span>
                        <div>{selectedBooking.profiles?.phone_number || "Not provided"}</div>
                        {selectedBooking.prefer_whatsapp && (
                          <Badge variant="outline" className="bg-green-50 mt-1">
                            Prefers WhatsApp
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 mt-0.5 text-gray-500" />
                      <div>
                        <span className="font-medium">Email:</span>
                        <div>{selectedBooking.profiles?.email || "Not provided"}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium text-lg mb-3">Message from Renter</h3>
                  <div className="bg-gray-50 p-4 rounded-md min-h-32">
                    {selectedBooking.message || "No message provided"}
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium text-lg mb-3">Booking Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                      <div>
                        <p className="text-sm font-medium">Booking Created</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(selectedBooking.created_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    
                    {selectedBooking.status !== 'pending' && (
                      <div className="flex gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          selectedBooking.status === 'confirmed' || selectedBooking.status === 'completed'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        } mt-1.5`}></div>
                        <div>
                          <p className="text-sm font-medium">
                            Booking {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(selectedBooking.updated_at), "MMMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerBookings;
