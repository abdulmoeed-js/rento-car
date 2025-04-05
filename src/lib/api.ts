
import { supabase } from "@/integrations/supabase/client";
import { Car, CarFilters, BookingFormData } from "@/types/car";
import { toast } from "sonner";

export async function getCars(filters?: CarFilters) {
  try {
    let query = supabase
      .from('cars')
      .select('*, car_images(*)');

    // Apply filters if provided
    if (filters) {
      if (filters.minPrice !== undefined) {
        query = query.gte('price_per_day', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price_per_day', filters.maxPrice);
      }
      if (filters.transmission && filters.transmission !== 'all') {
        query = query.eq('transmission', filters.transmission);
      }
      if (filters.carType && filters.carType !== 'all') {
        query = query.eq('car_type', filters.carType);
      }
      if (filters.fuelType && filters.fuelType !== 'all') {
        query = query.eq('fuel_type', filters.fuelType);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Format the data to match our Car type
    const cars = data?.map((car: any) => {
      return {
        ...car,
        images: car.car_images || []
      } as Car;
    }) || [];

    return cars;
  } catch (error) {
    toast.error('Failed to fetch cars');
    console.error('Error fetching cars:', error);
    return [];
  }
}

export async function getCarById(id: string) {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*, car_images(*), bookings(*)')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    // Calculate host rating
    const { data: ratingData } = await supabase
      .from('host_ratings')
      .select('rating')
      .eq('host_id', data?.host_id);

    const hostRating = ratingData && ratingData.length > 0
      ? ratingData.reduce((sum: number, item: any) => sum + item.rating, 0) / ratingData.length
      : 0;

    // Format the car data
    const car = data ? {
      ...data,
      images: data.car_images || [],
      host_rating: hostRating,
    } as Car : null;

    return car;
  } catch (error) {
    toast.error('Failed to fetch car details');
    console.error('Error fetching car details:', error);
    return null;
  }
}

// Check if a date range overlaps with existing bookings
export function isDateRangeAvailable(startDate: Date, endDate: Date, bookings: any[]) {
  return !bookings.some(booking => {
    if (booking.status === 'cancelled') return false;
    
    const bookingStart = new Date(booking.start_date);
    const bookingEnd = new Date(booking.end_date);
    
    return (
      (startDate <= bookingEnd && startDate >= bookingStart) ||
      (endDate <= bookingEnd && endDate >= bookingStart) ||
      (startDate <= bookingStart && endDate >= bookingEnd)
    );
  });
}

// Get availability for a specific month
export function getMonthlyAvailability(year: number, month: number, bookings: any[]) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const availability = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isAvailable = isDateRangeAvailable(date, date, bookings);
    availability.push({
      date,
      isAvailable
    });
  }

  return availability;
}

// Submit booking request to Supabase
export async function submitBooking(bookingData: BookingFormData) {
  try {
    const { car, startDate, endDate, message, preferWhatsApp } = bookingData;
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('You must be logged in to book a car');
      return null;
    }
    
    // Format dates for database
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // Insert booking record
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        car_id: car.id,
        user_id: user.id,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        status: 'pending',
        message: message,
        whatsapp_notifications: preferWhatsApp || false,
        // You could also store additional metadata like message, pickup location, etc.
        // in another related table if needed
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error submitting booking:', error);
    return null;
  }
}
