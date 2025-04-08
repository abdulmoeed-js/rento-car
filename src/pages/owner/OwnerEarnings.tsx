
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RentoHeader from "@/components/layout/RentoHeader";
import { Booking } from "@/types/car";
import { EarningsSummary } from "@/types/owner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from "date-fns";
import { Download, Calendar, ChevronRight, ArrowUp, ArrowDown, TrendingUp } from "lucide-react";

// Custom colors for charts
const COLORS = ['#2563eb', '#4f46e5', '#7c3aed', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
const CAR_COLORS = ['#22c55e', '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6'];

const OwnerEarnings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<{id: string, name: string, color: string}[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary>({
    total: 0,
    byPeriod: [],
    byCar: []
  });
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [comparisonData, setComparisonData] = useState<{current: number, previous: number, change: number}>({
    current: 0,
    previous: 0,
    change: 0
  });

  // Redirect if not logged in or not a host
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else if (user.user_role !== 'host') {
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch bookings and cars
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // First fetch user's cars
        const { data: carsData, error: carsError } = await supabase
          .from('cars')
          .select('id, brand, model')
          .eq('host_id', user.id);
          
        if (carsError) throw carsError;
        
        const carsList = (carsData || []).map((car, index) => ({
          id: car.id,
          name: `${car.brand} ${car.model}`,
          color: CAR_COLORS[index % CAR_COLORS.length]
        }));
        
        setCars(carsList);
        
        // If no cars, no need to fetch bookings
        if (carsList.length === 0) {
          setLoading(false);
          return;
        }
        
        const carIds = carsList.map(car => car.id);
        
        // Fetch confirmed and completed bookings for user's cars
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            cars (*),
            profiles (*)
          `)
          .in('car_id', carIds)
          .in('status', ['confirmed', 'completed'])
          .order('start_date', { ascending: false });
          
        if (bookingsError) throw bookingsError;
        
        setBookings(bookingsData || []);
        
        // Process initial earnings summary
        processEarnings(bookingsData || [], 'month', carsList);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Process earnings when period changes
  useEffect(() => {
    if (bookings.length > 0) {
      processEarnings(bookings, period, cars);
    }
  }, [period, yearFilter, bookings, cars]);

  // Process earnings data
  const processEarnings = (bookingsData: Booking[], timePeriod: string, carsList: {id: string, name: string, color: string}[]) => {
    try {
      let filteredBookings = [...bookingsData];
      let periodLabel = '';
      
      // Filter by time period
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;
      
      switch (timePeriod) {
        case 'week':
          startDate = subDays(now, 7);
          filteredBookings = bookingsData.filter(
            b => new Date(b.start_date) >= startDate && new Date(b.start_date) <= endDate
          );
          periodLabel = 'Last 7 days';
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          filteredBookings = bookingsData.filter(
            b => new Date(b.start_date) >= startDate && new Date(b.start_date) <= endDate
          );
          periodLabel = format(now, 'MMMM yyyy');
          break;
        case 'year':
          const selectedYear = parseInt(yearFilter);
          startDate = new Date(selectedYear, 0, 1);
          endDate = new Date(selectedYear, 11, 31);
          filteredBookings = bookingsData.filter(
            b => new Date(b.start_date).getFullYear() === selectedYear
          );
          periodLabel = yearFilter;
          break;
        case 'all':
          periodLabel = 'All time';
          filteredBookings = bookingsData;
          break;
        default:
          periodLabel = 'All time';
          break;
      }
      
      // Calculate total earnings
      const totalEarnings = filteredBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      
      // Calculate earnings by car
      const earningsByCar = carsList.map(car => {
        const carBookings = filteredBookings.filter(b => b.car_id === car.id);
        const amount = carBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
        
        return {
          carId: car.id,
          carName: car.name,
          amount,
          color: car.color
        };
      }).filter(car => car.amount > 0).sort((a, b) => b.amount - a.amount);
      
      // Calculate earnings by period (week/month/year)
      let earningsByPeriod: {period: string, amount: number}[] = [];
      
      if (timePeriod === 'week') {
        // Last 7 days
        const last7Days = Array(7).fill(0).map((_, i) => subDays(now, i));
        
        earningsByPeriod = last7Days.map(date => {
          const dayBookings = filteredBookings.filter(
            b => format(new Date(b.start_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
          );
          
          const amount = dayBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
          
          return {
            period: format(date, 'EEE'),
            amount
          };
        }).reverse();
      } else if (timePeriod === 'month') {
        // Current month by week
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
        
        earningsByPeriod = weeks.map((week, index) => {
          const weekStart = new Date(currentYear, currentMonth, index * 7 + 1);
          const weekEnd = new Date(currentYear, currentMonth, index * 7 + 7);
          
          // Only include if week is in the current month
          if (weekStart.getMonth() !== currentMonth) {
            return { period: week, amount: 0 };
          }
          
          const weekBookings = filteredBookings.filter(
            b => {
              const date = new Date(b.start_date);
              return date >= weekStart && date <= weekEnd;
            }
          );
          
          const amount = weekBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
          
          return {
            period: week,
            amount
          };
        }).filter(week => week.amount > 0);
      } else if (timePeriod === 'year') {
        // By month for the selected year
        const year = parseInt(yearFilter);
        const months = Array(12).fill(0).map((_, i) => new Date(year, i, 1));
        
        earningsByPeriod = months.map(month => {
          const monthBookings = filteredBookings.filter(
            b => {
              const date = new Date(b.start_date);
              return date.getMonth() === month.getMonth() && date.getFullYear() === year;
            }
          );
          
          const amount = monthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
          
          return {
            period: format(month, 'MMM'),
            amount
          };
        });
      } else {
        // All time, group by year then by month
        const years = [...new Set(bookingsData.map(b => new Date(b.start_date).getFullYear()))].sort();
        
        earningsByPeriod = years.map(year => {
          const yearBookings = filteredBookings.filter(
            b => new Date(b.start_date).getFullYear() === year
          );
          
          const amount = yearBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
          
          return {
            period: year.toString(),
            amount
          };
        });
      }
      
      // Update earnings summary
      setEarningsSummary({
        total: totalEarnings,
        byPeriod: earningsByPeriod,
        byCar: earningsByCar
      });
      
      // Calculate comparison data
      if (timePeriod !== 'all') {
        let previousStart: Date;
        let previousEnd: Date;
        
        switch (timePeriod) {
          case 'week':
            previousStart = subDays(startDate, 7);
            previousEnd = subDays(endDate, 7);
            break;
          case 'month':
            previousStart = startOfMonth(subMonths(now, 1));
            previousEnd = endOfMonth(subMonths(now, 1));
            break;
          case 'year':
            const selectedYear = parseInt(yearFilter);
            previousStart = new Date(selectedYear - 1, 0, 1);
            previousEnd = new Date(selectedYear - 1, 11, 31);
            break;
          default:
            previousStart = startDate;
            previousEnd = endDate;
            break;
        }
        
        const previousBookings = bookingsData.filter(
          b => {
            const date = new Date(b.start_date);
            return date >= previousStart && date <= previousEnd;
          }
        );
        
        const previousTotal = previousBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
        const currentTotal = totalEarnings;
        
        let changePercent = 0;
        if (previousTotal > 0) {
          changePercent = ((currentTotal - previousTotal) / previousTotal) * 100;
        } else if (currentTotal > 0) {
          changePercent = 100; // If previous is 0 and current is > 0, that's a 100% increase
        }
        
        setComparisonData({
          current: currentTotal,
          previous: previousTotal,
          change: changePercent
        });
        
        setCompareMode(true);
      } else {
        setCompareMode(false);
      }
    } catch (error) {
      console.error('Error processing earnings:', error);
    }
  };

  // Export earnings as CSV
  const exportEarnings = () => {
    try {
      // Headers for the CSV
      const headers = ['Period', 'Car', 'Amount'];
      
      // Prepare the data
      const rows: string[][] = [];
      
      // Add period data
      earningsSummary.byPeriod.forEach(item => {
        rows.push([item.period, 'All Cars', item.amount.toString()]);
      });
      
      // Add car data
      earningsSummary.byCar.forEach(item => {
        rows.push(['All Periods', item.carName, item.amount.toString()]);
      });
      
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
      a.setAttribute('download', `earnings_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success('Earnings data exported successfully');
    } catch (error) {
      console.error('Error exporting earnings:', error);
      toast.error('Failed to export earnings data');
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          <p className="text-rento-blue">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <RentoHeader />
      
      <main className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Earnings Summary</CardTitle>
                <CardDescription>
                  Track your earnings over time and across your vehicles
                </CardDescription>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/owner-portal')}>
                  Back to Dashboard
                </Button>
                
                <Button variant="outline" onClick={exportEarnings}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Period filters */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <div>
                <Tabs defaultValue="month" onValueChange={(value) => setPeriod(value as any)}>
                  <TabsList>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="year">Year</TabsTrigger>
                    <TabsTrigger value="all">All Time</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {period === 'year' && (
                <div className="w-full sm:w-48">
                  <Select
                    value={yearFilter}
                    onValueChange={setYearFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-rento-blue border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading earnings data...</p>
              </div>
            ) : earningsSummary.total > 0 ? (
              <div className="space-y-8">
                {/* Earnings summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {period === 'week' 
                              ? 'Last 7 Days' 
                              : period === 'month' 
                                ? format(new Date(), 'MMMM yyyy')
                                : period === 'year'
                                  ? yearFilter
                                  : 'All Time'} Earnings
                          </p>
                          <p className="text-3xl font-bold">
                            ${earningsSummary.total.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-2 rounded-full bg-emerald-100">
                          <TrendingUp className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                      
                      {compareMode && (
                        <div className="mt-4 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground flex-1">
                              vs previous {period}
                            </p>
                            <div className={`flex items-center ${
                              comparisonData.change >= 0 
                                ? 'text-emerald-600' 
                                : 'text-red-600'
                            }`}>
                              {comparisonData.change >= 0 ? (
                                <ArrowUp className="h-3 w-3 mr-1" />
                              ) : (
                                <ArrowDown className="h-3 w-3 mr-1" />
                              )}
                              <span className="text-sm font-medium">
                                {Math.abs(comparisonData.change).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-1">
                        Top Earning Car
                      </p>
                      {earningsSummary.byCar.length > 0 ? (
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xl font-bold mb-1">
                              {earningsSummary.byCar[0].carName}
                            </p>
                            <p className="text-2xl font-bold text-emerald-600">
                              ${earningsSummary.byCar[0].amount.toFixed(2)}
                            </p>
                          </div>
                          <div 
                            className="p-2 rounded-full" 
                            style={{ 
                              backgroundColor: `${earningsSummary.byCar[0].color}20`
                            }}
                          >
                            <Car 
                              className="h-6 w-6" 
                              style={{ color: earningsSummary.byCar[0].color }}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-lg font-medium text-muted-foreground">
                          No earnings data
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-1">
                        Booking Count
                      </p>
                      {bookings.length > 0 ? (
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-3xl font-bold">
                              {bookings.filter(b => period === 'all' || 
                                (period === 'year' && new Date(b.start_date).getFullYear() === parseInt(yearFilter)) ||
                                (period === 'month' && new Date(b.start_date).getMonth() === new Date().getMonth() &&
                                 new Date(b.start_date).getFullYear() === new Date().getFullYear()) ||
                                (period === 'week' && new Date(b.start_date) >= subDays(new Date(), 7))
                              ).length}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              completed bookings
                            </p>
                          </div>
                          <div className="p-2 rounded-full bg-blue-100">
                            <Calendar className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      ) : (
                        <p className="text-lg font-medium text-muted-foreground">
                          No bookings data
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Earnings Over Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-80">
                        {earningsSummary.byPeriod.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={earningsSummary.byPeriod}
                              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="period" />
                              <YAxis 
                                tickFormatter={(value) => `$${value}`}
                                width={60}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar 
                                dataKey="amount" 
                                fill="#3b82f6" 
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                              No earnings data available for this period
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Earnings By Car
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-80">
                        {earningsSummary.byCar.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={earningsSummary.byCar}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                dataKey="amount"
                                nameKey="carName"
                                paddingAngle={2}
                                label={({ carName, percent }) => `${carName} ${(percent * 100).toFixed(0)}%`}
                              >
                                {earningsSummary.byCar.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `$${value}`} />
                              <Legend 
                                layout="horizontal" 
                                verticalAlign="bottom" 
                                align="center" 
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                              No car earnings data available for this period
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Recent bookings */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between">
                      <span>Recent Bookings</span>
                      <Button asChild variant="outline" size="sm">
                        <a href="/owner-portal/bookings">
                          <span>View All</span>
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </a>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-start gap-4 p-3 rounded-lg border">
                          <div className="bg-muted w-12 h-12 rounded-md flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">
                                  {booking.cars?.brand} {booking.cars?.model}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(booking.start_date), "MMM d")} - {format(new Date(booking.end_date), "MMM d, yyyy")}
                                </p>
                              </div>
                              <span className="font-bold">
                                ${booking.total_price}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {bookings.length === 0 && (
                        <div className="text-center py-6">
                          <p className="text-muted-foreground">
                            No bookings found for this period
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium mb-1">No earnings yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  {cars.length > 0 
                    ? "You don't have any earnings yet. Earnings will appear here once you have confirmed bookings."
                    : "You need to add a car first before you can start earning."}
                </p>
                
                {cars.length === 0 && (
                  <Button
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

export default OwnerEarnings;
