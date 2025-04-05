
import { supabase } from "@/integrations/supabase/client";
import { Car, BookingFormData, CarFilters, Booking } from "@/types/car";

// Function to fetch cars with filters
export const fetchCars = async (filters: CarFilters, page: number, pageSize: number): Promise<Car[]> => {
  let query = supabase
    .from('cars')
    .select(`
      *,
      images (*),
      bookings (*)
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.priceRange) {
    query = query.gte('price_per_day', filters.priceRange[0]).lte('price_per_day', filters.priceRange[1]);
  }
  if (filters.carType && filters.carType.length > 0) {
    query = query.in('car_type', filters.carType);
  }
  if (filters.fuelType && filters.fuelType.length > 0) {
    query = query.in('fuel_type', filters.fuelType);
  }
  if (filters.transmission && filters.transmission.length > 0) {
    query = query.in('transmission', filters.transmission);
  }
  if (filters.city && filters.city.length > 0) {
    query = query.in('location', filters.city);
  }

  // Apply sorting
  if (filters.sortBy === 'price_asc') {
    query = query.order('price_per_day', { ascending: true });
  } else if (filters.sortBy === 'price_desc') {
    query = query.order('price_per_day', { ascending: false });
  } else if (filters.sortBy === 'newest') {
    query = query.order('year', { ascending: false });
  } else if (filters.sortBy === 'rating') {
    // Since host_rating column doesn't exist, we'll default to sorting by year for now
    query = query.order('year', { ascending: false });
  }

  // Apply pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize - 1;

  query = query.range(startIndex, endIndex);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching cars:', error);
    return [];
  }

  // Add placeholder host_rating for compatibility
  return data.map(car => ({
    ...car,
    host_rating: 4.5 // Placeholder value
  })) as Car[];
};

// Function to fetch a single car by ID
export const getCarById = async (id: string): Promise<Car | null> => {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select(`
        *,
        images (*),
        bookings (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Add placeholder host_rating for compatibility
    return {
      ...data,
      host_rating: 4.5 // Placeholder value
    } as Car;
  } catch (error) {
    console.error('Error fetching car:', error);
    return null;
  }
};

// Alias for fetchCars for better semantic naming
export const getCars = fetchCars;

// Function to submit a booking
export const submitBooking = async (bookingData: BookingFormData): Promise<{ id: string } | null> => {
  try {
    const { car, startDate, endDate, pickupTime, returnTime, location, message, totalPrice, preferWhatsApp } = bookingData;
    
    // Create booking record
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        car_id: car.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        pickup_time: pickupTime,
        return_time: returnTime,
        location: location,
        message: message,
        total_price: totalPrice,
        status: 'pending',
        prefer_whatsapp: preferWhatsApp || false
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error submitting booking:', error);
    return null;
  }
};

// Helper function to calculate monthly availability (local JavaScript implementation)
export const getMonthlyAvailability = (
  year: number, 
  month: number, 
  bookings: Booking[]
): { date: Date; isAvailable: boolean }[] => {
  // Create an array of days in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    
    // Check if date is in any booking
    const isBooked = bookings.some(booking => {
      const startDate = new Date(booking.start_date);
      const endDate = new Date(booking.end_date);
      
      return (
        (booking.status === 'confirmed' || booking.status === 'pending') && 
        (date >= startDate && date <= endDate)
      );
    });
    
    days.push({
      date,
      isAvailable: !isBooked
    });
  }
  
  return days;
};
