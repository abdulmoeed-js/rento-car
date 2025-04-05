
import { supabase } from "@/integrations/supabase/client";
import { Car, CarFilters } from "@/types/car";
import { toast } from "sonner";

export async function getCars(filters?: CarFilters) {
  try {
    let query = supabase
      .from('cars')
      .select(`
        *,
        car_images (*)
      `);

    // Apply filters if provided
    if (filters) {
      if (filters.minPrice !== undefined) {
        query = query.gte('price_per_day', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price_per_day', filters.maxPrice);
      }
      if (filters.transmission && filters.transmission !== '') {
        query = query.eq('transmission', filters.transmission);
      }
      if (filters.carType && filters.carType !== '') {
        query = query.eq('car_type', filters.carType);
      }
      if (filters.fuelType && filters.fuelType !== '') {
        query = query.eq('fuel_type', filters.fuelType);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Format the data to match our Car type
    const cars = data.map((car) => {
      return {
        ...car,
        images: car.car_images || []
      } as Car;
    });

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
      .select(`
        *,
        car_images (*),
        bookings (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    // Calculate host rating
    const { data: ratingData } = await supabase
      .from('host_ratings')
      .select('rating')
      .eq('host_id', data.host_id);

    const hostRating = ratingData && ratingData.length > 0
      ? ratingData.reduce((sum, item) => sum + item.rating, 0) / ratingData.length
      : 0;

    // Format the car data
    const car = {
      ...data,
      images: data.car_images || [],
      host_rating: hostRating,
    } as Car;

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
