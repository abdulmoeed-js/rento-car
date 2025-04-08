import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Car, Booking } from "@/types/car";
import { EarningsSummary } from "@/types/owner";
import { toast } from "sonner";
import RentoHeader from "@/components/layout/RentoHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarRange, CircleDollarSign, Car as CarIcon } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const OwnerEarnings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary>({
    total: 0,
    byPeriod: [],
    byCar: []
  });
  
  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [user]);
  
  // Fetch bookings and cars data
  const fetchData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch confirmed and completed bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (*),
          profiles (*)
        `)
        .or('status.eq.confirmed,status.eq.completed')
        .eq('cars.host_id', user.id);
      
      if (bookingsError) throw bookingsError;
      
      // Fetch all cars
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('*')
        .eq('host_id', user.id);
      
      if (carsError) throw carsError;
      
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
        
        // Calculate earnings if bookings exist
        if (typedBookings.length > 0) {
          calculateEarnings(typedBookings as Booking[]);
        }
      }
      
      if (carsData) {
        // Add proper type assertion for cars
        setCars(carsData as unknown as Car[]);
      }
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate earnings summary
  const calculateEarnings = (bookings: Booking[]) => {
    let totalEarnings = 0;
    const byPeriod: { period: string; amount: number }[] = [];
    const byCar: { carId: string; carName: string; amount: number; color?: string }[] = [];
    
    // Calculate total earnings and earnings by period
    bookings.forEach(booking => {
      if (booking.total_price) {
        totalEarnings += booking.total_price;
        
        // Group by month
        const monthYear = format(new Date(booking.start_date), 'MMMM yyyy');
        const existingPeriod = byPeriod.find(item => item.period === monthYear);
        
        if (existingPeriod) {
          existingPeriod.amount += booking.total_price;
        } else {
          byPeriod.push({ period: monthYear, amount: booking.total_price });
        }
      }
    });
    
    // Calculate earnings by car
    cars.forEach(car => {
      let carEarnings = 0;
      
      bookings.forEach(booking => {
        if (booking.car_id === car.id && booking.total_price) {
          carEarnings += booking.total_price;
        }
      });
      
      byCar.push({
        carId: car.id,
        carName: `${car.brand} ${car.model}`,
        amount: carEarnings,
        color: getRandomColor()
      });
    });
    
    // Sort byCar in descending order of amount
    byCar.sort((a, b) => b.amount - a.amount);
    
    // Update state
    setEarningsSummary({
      total: totalEarnings,
      byPeriod: byPeriod.sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime()),
      byCar: byCar
    });
  };

  // Generate random color for car earnings chart
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RentoHeader />
        <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-rento-blue border-t-transparent rounded-full mb-4"></div>
          <p className="text-lg">Loading earnings data...</p>
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
            <CardTitle>Earnings Summary</CardTitle>
            <CardDescription>
              Track your rental earnings and performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Earnings</CardTitle>
                  <CardDescription>
                    All time earnings from car rentals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ${earningsSummary.total.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Earnings by Period</CardTitle>
                  <CardDescription>
                    Earnings for the last 6 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {earningsSummary.byPeriod.slice(0, 6).map(period => (
                      <div key={period.period} className="flex justify-between items-center">
                        <span>{period.period}</span>
                        <span className="font-medium">${period.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Earnings by Car</CardTitle>
                <CardDescription>
                  Earnings from each car you have listed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {earningsSummary.byCar.length > 0 ? (
                  earningsSummary.byCar.map((carData, index) => (
                    <CarEarningsCard key={carData.carId} carData={carData} amount={carData.amount} />
                  ))
                ) : (
                  <div className="text-center py-4">
                    No earnings data available for your cars.
                  </div>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

const CarEarningsCard = ({ carData, amount }: { carData: EarningsSummary['byCar'][0], amount: number }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="rounded-full w-8 h-8 flex items-center justify-center text-white" style={{ backgroundColor: carData.color }}>
          <CarIcon className="h-4 w-4" />
        </div>
        <div>
          <h4 className="font-medium">{carData.carName}</h4>
          <p className="text-sm text-muted-foreground">Car ID: {carData.carId}</p>
        </div>
      </div>
      <div className="font-medium">${amount.toFixed(2)}</div>
    </div>
  );
};

// Replace DollarSign with a proper icon from lucide-react
import { DollarSign } from "lucide-react";

export default OwnerEarnings;
