
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Car, Booking } from "@/types/car";
import { EarningsSummary } from "@/types/owner";
import { format, addMonths, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { toast } from "sonner";
import RentoHeader from "@/components/layout/RentoHeader";
import OwnerSidebar from "@/components/owner/OwnerSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Bar, Cell, Pie, Legend } from "recharts";
import { DollarSign, Calendar, DownloadIcon } from "lucide-react";

const CHART_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
  "#6366f1", // indigo-500
  "#f97316", // orange-500
];

interface DateRange {
  from: Date;
  to: Date;
}

const OwnerEarnings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary>({
    total: 0,
    byPeriod: [],
    byCar: []
  });
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else if (user.user_role !== 'host') {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch cars and bookings
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch cars
        const { data: carsData, error: carsError } = await supabase
          .from('cars')
          .select('*')
          .eq('host_id', user.id);
          
        if (carsError) throw carsError;
        
        // Fetch bookings
        const carIds = carsData?.map(car => car.id) || [];
        
        if (carIds.length > 0) {
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
          
          // Process bookings to match Booking type
          const processedBookings = bookingsData ? bookingsData.map(booking => {
            return {
              ...booking,
              profiles: booking.profiles && typeof booking.profiles === 'object' 
                ? booking.profiles 
                : null
            } as Booking;
          }) : [];
          
          setBookings(processedBookings);
          calculateEarnings(processedBookings, carsData || [], dateRange);
        } else {
          setBookings([]);
          resetEarningsSummary();
        }
        
        setCars(carsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Recalculate earnings when timeframe changes
  useEffect(() => {
    if (timeFrame === 'week') {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      setDateRange({
        from: startDate,
        to: today
      });
    } else if (timeFrame === 'month') {
      setDateRange({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      });
    } else if (timeFrame === 'year') {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), 0, 1);
      const endDate = new Date(today.getFullYear(), 11, 31);
      setDateRange({
        from: startDate,
        to: endDate
      });
    } else {
      // All time
      setDateRange({
        from: new Date(2020, 0, 1),
        to: new Date()
      });
    }
  }, [timeFrame]);

  // Recalculate earnings when date range changes
  useEffect(() => {
    calculateEarnings(bookings, cars, dateRange);
  }, [dateRange, bookings, cars]);

  // Calculate earnings based on bookings and date range
  const calculateEarnings = (bookings: Booking[], cars: Car[], dateRange: DateRange) => {
    // Filter bookings within date range
    const filteredBookings = bookings.filter(booking => {
      const bookingStartDate = new Date(booking.start_date);
      return bookingStartDate >= dateRange.from && bookingStartDate <= dateRange.to;
    });
    
    // Calculate total earnings
    const total = filteredBookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0);
    
    // Calculate earnings by period
    const byPeriod = timeFrame === 'week' || timeFrame === 'month'
      ? calculateDailyEarnings(filteredBookings, dateRange)
      : timeFrame === 'year'
      ? calculateMonthlyEarnings(filteredBookings)
      : calculateYearlyEarnings(filteredBookings);
    
    // Calculate earnings by car
    const byCar = calculateCarEarnings(filteredBookings, cars);
    
    setEarningsSummary({
      total,
      byPeriod,
      byCar
    });
  };

  // Calculate daily earnings
  const calculateDailyEarnings = (bookings: Booking[], dateRange: DateRange) => {
    const result: { period: string; amount: number }[] = [];
    const days = differenceInDays(dateRange.to, dateRange.from) + 1;
    
    // Create array with all days in range
    for (let i = 0; i < days; i++) {
      const date = new Date(dateRange.from);
      date.setDate(date.getDate() + i);
      const formattedDate = format(date, 'MM/dd');
      
      result.push({
        period: formattedDate,
        amount: 0
      });
    }
    
    // Add earnings to corresponding days
    bookings.forEach(booking => {
      const bookingStartDate = new Date(booking.start_date);
      const formattedDate = format(bookingStartDate, 'MM/dd');
      
      const dayIndex = result.findIndex(item => item.period === formattedDate);
      if (dayIndex !== -1) {
        result[dayIndex].amount += booking.total_price || 0;
      }
    });
    
    return result;
  };

  // Calculate monthly earnings
  const calculateMonthlyEarnings = (bookings: Booking[]) => {
    const result: { period: string; amount: number }[] = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Create array with all months
    months.forEach(month => {
      result.push({
        period: month,
        amount: 0
      });
    });
    
    // Add earnings to corresponding months
    bookings.forEach(booking => {
      const bookingStartDate = new Date(booking.start_date);
      const monthIndex = bookingStartDate.getMonth();
      
      result[monthIndex].amount += booking.total_price || 0;
    });
    
    return result;
  };

  // Calculate yearly earnings
  const calculateYearlyEarnings = (bookings: Booking[]) => {
    const result: { period: string; amount: number }[] = [];
    const years = new Set<number>();
    
    // Find all years in bookings
    bookings.forEach(booking => {
      const year = new Date(booking.start_date).getFullYear();
      years.add(year);
    });
    
    // Create array with all years
    Array.from(years).sort().forEach(year => {
      result.push({
        period: year.toString(),
        amount: 0
      });
    });
    
    // Add earnings to corresponding years
    bookings.forEach(booking => {
      const year = new Date(booking.start_date).getFullYear();
      const yearIndex = result.findIndex(item => item.period === year.toString());
      
      if (yearIndex !== -1) {
        result[yearIndex].amount += booking.total_price || 0;
      }
    });
    
    return result;
  };

  // Calculate earnings by car
  const calculateCarEarnings = (bookings: Booking[], cars: Car[]) => {
    const result: { carId: string; carName: string; amount: number; color: string }[] = [];
    
    // Add all cars to result
    cars.forEach((car, index) => {
      result.push({
        carId: car.id,
        carName: `${car.brand} ${car.model}`,
        amount: 0,
        color: CHART_COLORS[index % CHART_COLORS.length]
      });
    });
    
    // Add earnings to corresponding cars
    bookings.forEach(booking => {
      const carIndex = result.findIndex(item => item.carId === booking.car_id);
      
      if (carIndex !== -1) {
        result[carIndex].amount += booking.total_price || 0;
      }
    });
    
    // Sort by amount (descending)
    return result.sort((a, b) => b.amount - a.amount);
  };

  // Reset earnings summary
  const resetEarningsSummary = () => {
    setEarningsSummary({
      total: 0,
      byPeriod: [],
      byCar: []
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="text-sm">{`${label}: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  // Export earnings data
  const exportEarningsData = () => {
    const { total, byPeriod, byCar } = earningsSummary;
    
    const csvContent = [
      `Earnings Summary for ${format(dateRange.from, 'MM/dd/yyyy')} to ${format(dateRange.to, 'MM/dd/yyyy')}`,
      `Total Earnings: ${formatCurrency(total)}`,
      '',
      'Earnings By Period:',
      'Period,Amount',
      ...byPeriod.map(item => `${item.period},${item.amount}`),
      '',
      'Earnings By Car:',
      'Car,Amount',
      ...byCar.map(item => `${item.carName},${item.amount}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `earnings_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <RentoHeader />
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          <OwnerSidebar />
          
          <div className="flex-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Earnings</CardTitle>
                    <CardDescription>Track your rental income over time</CardDescription>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportEarningsData}
                    disabled={loading || earningsSummary.total === 0}
                    className="flex items-center"
                  >
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {loading ? (
                  <div className="space-y-8">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="bg-muted rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="flex items-center">
                            <DollarSign className="h-10 w-10 text-green-500 mr-4" />
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Total Earnings</h3>
                              <p className="text-2xl font-bold">
                                {formatCurrency(earningsSummary.total)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="flex items-center">
                            <Calendar className="h-10 w-10 text-blue-500 mr-4" />
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Time Period</h3>
                              <p className="text-lg font-medium">
                                {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Select 
                            value={timeFrame} 
                            onValueChange={(value) => setTimeFrame(value as any)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="week">Last 7 days</SelectItem>
                              <SelectItem value="month">This month</SelectItem>
                              <SelectItem value="year">This year</SelectItem>
                              <SelectItem value="all">All time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Tabs defaultValue="chart" className="w-full">
                        <TabsList className="grid grid-cols-2 max-w-md mx-auto mb-6">
                          <TabsTrigger value="chart">Timeline</TabsTrigger>
                          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="chart">
                          <Card>
                            <CardHeader>
                              <CardTitle>Earnings Over Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {earningsSummary.byPeriod.length > 0 ? (
                                <div className="h-80">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                      data={earningsSummary.byPeriod}
                                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                      <XAxis dataKey="period" />
                                      <YAxis />
                                      <Tooltip content={<CustomTooltip />} />
                                      <Bar dataKey="amount" fill="#3b82f6" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                                  <p className="text-lg font-medium mb-1">No earnings data available</p>
                                  <p className="text-muted-foreground">
                                    You haven't had any confirmed bookings in this period
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </TabsContent>
                        
                        <TabsContent value="breakdown">
                          <Card>
                            <CardHeader>
                              <CardTitle>Earnings By Car</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {earningsSummary.byCar.length > 0 ? (
                                <div className="h-80">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={earningsSummary.byCar}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="amount"
                                        nameKey="carName"
                                      >
                                        {earningsSummary.byCar.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                      </Pie>
                                      <Tooltip content={<PieTooltip />} />
                                      <Legend />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                                  <p className="text-lg font-medium mb-1">No earnings data available</p>
                                  <p className="text-muted-foreground">
                                    You haven't had any confirmed bookings in this period
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </div>
                    
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">Detailed Breakdown</h3>
                      
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {earningsSummary.byCar.map((car) => (
                              <tr key={car.carId}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center">
                                    <div 
                                      className="w-3 h-3 rounded-full mr-2" 
                                      style={{ backgroundColor: car.color }}
                                    ></div>
                                    {car.carName}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                  {formatCurrency(car.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                  {earningsSummary.total ? `${((car.amount / earningsSummary.total) * 100).toFixed(1)}%` : '0%'}
                                </td>
                              </tr>
                            ))}
                            
                            {earningsSummary.byCar.length === 0 && (
                              <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                  No earnings data available
                                </td>
                              </tr>
                            )}
                            
                            {earningsSummary.byCar.length > 0 && (
                              <tr className="bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">Total</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                                  {formatCurrency(earningsSummary.total)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                                  100%
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerEarnings;
