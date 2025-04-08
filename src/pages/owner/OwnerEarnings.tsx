import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Booking, Car } from "@/types/car"; // Make sure to import Car
import { EarningsSummary } from "@/types/owner";
import { DollarSign } from "lucide-react"; // Add this import
import RentoHeader from "@/components/layout/RentoHeader";
import OwnerSidebar from "@/components/owner/OwnerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const OwnerEarnings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  // Redirect if not logged in or not a host
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else if (user.user_role !== 'host') {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch earnings data
  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // First, get all cars owned by this host
        const { data: carsData, error: carsError } = await supabase
          .from('cars')
          .select('*')
          .eq('host_id', user.id);
          
        if (carsError) throw carsError;
        
        // Process cars to match the Car type
        const processedCars = carsData ? carsData.map(car => ({
          ...car,
          location_coordinates: car.location_coordinates || null,
          images: [],
          bookings: []
        } as Car)) : [];
        
        setCars(processedCars);
        
        if (!carsData || carsData.length === 0) {
          setBookings([]);
          setLoading(false);
          return;
        }
        
        const carIds = carsData.map(car => car.id);
        
        // Then, get all confirmed bookings for these cars
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            cars (*),
            profiles (*)
          `)
          .in('car_id', carIds)
          .eq('status', 'confirmed');
          
        if (bookingsError) throw bookingsError;
        
        const processedBookings = bookingsData ? bookingsData.map(booking => ({
          ...booking,
          cars: booking.cars || null,
          profiles: booking.profiles || null
        } as Booking)) : [];
        
        setBookings(processedBookings);
        
        // Calculate earnings
        calculateEarnings(processedBookings, processedCars, selectedPeriod);
        
      } catch (error) {
        console.error('Error fetching earnings:', error);
        toast.error('Failed to load earnings data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEarnings();
  }, [user, selectedPeriod, navigate]);

  // Calculate earnings
  const calculateEarnings = (bookings: Booking[], cars: Car[], period: string) => {
    let totalEarnings = 0;
    const periodEarnings: { period: string; amount: number }[] = [];
    const carEarnings: { carId: string; carName: string; amount: number }[] = [];

    // Calculate total earnings
    totalEarnings = bookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0);

    // Calculate earnings by period (simplified for monthly)
    const monthlyEarnings: { [month: string]: number } = {};
    bookings.forEach(booking => {
      const bookingMonth = new Date(booking.start_date).toLocaleString('default', { month: 'long' });
      monthlyEarnings[bookingMonth] = (monthlyEarnings[bookingMonth] || 0) + (booking.total_price || 0);
    });

    for (const month in monthlyEarnings) {
      periodEarnings.push({ period: month, amount: monthlyEarnings[month] });
    }

    // Calculate earnings by car
    cars.forEach(car => {
      const carBookings = bookings.filter(b => b.car_id === car.id);
      const carTotal = carBookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0);
      carEarnings.push({ carId: car.id, carName: `${car.brand} ${car.model}`, amount: carTotal });
    });

    // Add color property to carEarnings
    const carEarningsWithColor = carEarnings.map((car, index) => ({
      ...car,
      color: getCarColor(index)
    }));

    setEarningsSummary({
      total: totalEarnings,
      byPeriod: periodEarnings,
      byCar: carEarningsWithColor
    });
  };

  // Helper function to get colors for charts
  const getCarColor = (index: number) => {
    const colors = [
      '#4f46e5', '#0ea5e9', '#22c55e', '#f59e0b', '#ec4899',
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ef4444',
    ];
    return colors[index % colors.length];
  };

  if (!user || user.user_role !== 'host') {
    return null;
  }

  const carData = cars as Car[]; // Type assertion

  return (
    <div className="min-h-screen bg-gray-50">
      <RentoHeader />

      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          <OwnerSidebar />

          <div className="flex-1">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Earnings Summary</CardTitle>
                  <Select onValueChange={setSelectedPeriod} defaultValue={selectedPeriod}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      {/* Add other periods as needed */}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : earningsSummary ? (
                  <div className="space-y-6">
                    <div className="bg-muted p-6 rounded-lg text-center">
                      <h3 className="text-lg font-medium mb-2">Total Earnings</h3>
                      <p className="text-4xl font-bold text-green-600">${earningsSummary.total.toFixed(2)}</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Earnings by Period</h3>
                      {earningsSummary.byPeriod && earningsSummary.byPeriod.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={earningsSummary.byPeriod}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="amount" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-muted-foreground">No earnings data available for the selected period.</p>
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Earnings by Car</h3>
                      {earningsSummary.byCar && earningsSummary.byCar.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={earningsSummary.byCar}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="carName" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            {earningsSummary.byCar.map((car, index) => (
                              <Bar key={car.carId} dataKey="amount" fill={car.color || getCarColor(index)} />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-muted-foreground">No earnings data available for cars.</p>
                      )}
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default OwnerEarnings;
