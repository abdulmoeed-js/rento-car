import { supabase } from "@/integrations/supabase/client";
import { Car, BookingFormData, CarFilters } from "@/types/car";

export const fetchCars = async (filters: CarFilters, page: number, pageSize: number): Promise<Car[]> => {
  let query = supabase
    .from('cars')
    .select(`
      *,
      images (*),
      bookings (*),
      host_rating
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
    query = query.order('host_rating', { ascending: false, nullsFirst: false });
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

  return data as Car[];
};

export const fetchCar = async (id: string): Promise<Car | null> => {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select(`
        *,
        images (*),
        bookings (*),
        host_rating
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Transform data to match Car interface
    if (data) {
      const car: Car = {
        id: data.id,
        brand: data.brand,
        model: data.model,
        year: data.year,
        location: data.location,
        price_per_day: data.price_per_day,
        availability: data.availability,
        car_type: data.car_type,
        fuel_type: data.fuel_type,
        transmission: data.transmission,
        image_url: data.image_url,
        host_id: data.host_id,
        trust_rating: data.trust_rating,
        description: data.description,
        images: data.images,
        host_rating: data.host_rating,
        bookings: data.bookings
      };
      return car;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching car:', error);
    return null;
  }
};

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
        preferWhatsApp: preferWhatsApp || false,
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
