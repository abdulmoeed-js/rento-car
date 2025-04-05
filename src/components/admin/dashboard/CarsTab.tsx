
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const CarsTab: React.FC = () => {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("availability_desc");

  const fetchCarsWithAvailability = async () => {
    setLoading(true);
    try {
      // Get cars with bookings information
      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          bookings (*)
        `);
      
      if (error) throw error;
      
      // Calculate availability percentages
      const currentDate = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(currentDate.getDate() + 30);
      
      const carsWithAvailability = data.map(car => {
        // Count total days in 30-day period
        const totalDays = 30;
        
        // Count booked days in this period
        const bookedDays = new Set();
        
        car.bookings.forEach(booking => {
          if (booking.status === 'cancelled') return;
          
          const startDate = new Date(booking.start_date);
          const endDate = new Date(booking.end_date);
          
          // Adjust dates to be within our 30-day window
          const effectiveStartDate = startDate > currentDate ? startDate : currentDate;
          const effectiveEndDate = endDate < thirtyDaysLater ? endDate : thirtyDaysLater;
          
          // Count each day in the booking
          if (effectiveEndDate >= effectiveStartDate) {
            let day = new Date(effectiveStartDate);
            while (day <= effectiveEndDate) {
              bookedDays.add(day.toISOString().split('T')[0]);
              day.setDate(day.getDate() + 1);
            }
          }
        });
        
        const bookedDaysCount = bookedDays.size;
        const availableDaysCount = totalDays - bookedDaysCount;
        
        const percentBooked = (bookedDaysCount / totalDays) * 100;
        const percentAvailable = (availableDaysCount / totalDays) * 100;
        
        return {
          ...car,
          percentBooked: Math.round(percentBooked),
          percentAvailable: Math.round(percentAvailable)
        };
      });
      
      // Apply filters
      let filteredCars = [...carsWithAvailability];
      
      if (availabilityFilter === "high_availability") {
        filteredCars = filteredCars.filter(car => car.percentAvailable >= 70);
      } else if (availabilityFilter === "medium_availability") {
        filteredCars = filteredCars.filter(car => car.percentAvailable >= 30 && car.percentAvailable < 70);
      } else if (availabilityFilter === "low_availability") {
        filteredCars = filteredCars.filter(car => car.percentAvailable < 30);
      }
      
      // Apply sorting
      if (sortBy === "availability_asc") {
        filteredCars.sort((a, b) => a.percentAvailable - b.percentAvailable);
      } else if (sortBy === "availability_desc") {
        filteredCars.sort((a, b) => b.percentAvailable - a.percentAvailable);
      } else if (sortBy === "price_asc") {
        filteredCars.sort((a, b) => a.price_per_day - b.price_per_day);
      } else if (sortBy === "price_desc") {
        filteredCars.sort((a, b) => b.price_per_day - a.price_per_day);
      }
      
      setCars(filteredCars);
    } catch (error) {
      console.error("Error fetching cars:", error);
      toast.error("Failed to load cars data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarsWithAvailability();
  }, [availabilityFilter, sortBy]);

  const exportToCSV = () => {
    try {
      // Format cars data for CSV
      const csvData = cars.map(car => ({
        id: car.id,
        brand_model: `${car.brand} ${car.model}`,
        year: car.year,
        price: car.price_per_day,
        location: car.location,
        percent_available: car.percentAvailable,
        percent_booked: car.percentBooked,
      }));

      // Convert to CSV string
      const headers = Object.keys(csvData[0] || {}).join(',');
      const rows = csvData.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');

      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `cars-${new Date().toISOString().split('T')[0]}.csv`);
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Cars data exported successfully");
    } catch (error) {
      console.error("Error exporting cars data:", error);
      toast.error("Failed to export cars data");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold">Cars Management</h2>
        <div className="flex gap-2">
          <Button onClick={fetchCarsWithAvailability} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-1">Availability</label>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cars</SelectItem>
                  <SelectItem value="high_availability">High Availability (>70%)</SelectItem>
                  <SelectItem value="medium_availability">Medium Availability (30-70%)</SelectItem>
                  <SelectItem value="low_availability">Low Availability (<30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium mb-1">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="availability_desc">Highest Availability</SelectItem>
                  <SelectItem value="availability_asc">Lowest Availability</SelectItem>
                  <SelectItem value="price_desc">Highest Price</SelectItem>
                  <SelectItem value="price_asc">Lowest Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Car</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Availability (30 days)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cars.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No cars found matching the current filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    cars.map((car) => (
                      <TableRow key={car.id}>
                        <TableCell>
                          <span className="font-medium">{car.brand} {car.model}</span>
                        </TableCell>
                        <TableCell>{car.year}</TableCell>
                        <TableCell>${car.price_per_day}/day</TableCell>
                        <TableCell>{car.location}</TableCell>
                        <TableCell>{car.car_type}</TableCell>
                        <TableCell>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-primary h-2.5 rounded-full" 
                              style={{ width: `${car.percentAvailable}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span>{car.percentAvailable}% Available</span>
                            <span>{car.percentBooked}% Booked</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
