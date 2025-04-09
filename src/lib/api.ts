
import { supabase } from "@/integrations/supabase/client";
import { Car, BookingFormData, CarFilters, Booking } from "@/types/car";

// Function to fetch cars with filters
export const fetchCars = async (filters: CarFilters, page: number, pageSize: number): Promise<Car[]> => {
  try {
    console.log("Fetching cars with filters:", filters);
    
    let query = supabase
      .from('cars')
      .select(`
        *,
        images:car_images(*),
        bookings(*)
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

    console.log("Received cars data:", data);

    // Add required properties for the Car interface compatibility
    return data.map(car => {
      // Safely handle car.images with proper type checking
      const carImagesData = car.images;
      const carImages = Array.isArray(carImagesData) ? carImagesData : [];
      const primaryImage = carImages.find(img => img.is_primary);
      
      return {
        ...(car as any),
        host_rating: 4.5, // Placeholder value
        availability: true, // Add missing required property
        image_url: primaryImage?.image_path || 
                  (carImages.length > 0 ? carImages[0].image_path : ''), 
        trust_rating: 4.5, // Add missing required property
      };
    }) as Car[];
  } catch (error) {
    console.error("Unexpected error in fetchCars:", error);
    return [];
  }
};

// Function to fetch a single car by ID
export const getCarById = async (id: string): Promise<Car | null> => {
  try {
    console.log("Fetching car with ID:", id);
    
    const { data, error } = await supabase
      .from('cars')
      .select(`
        *,
        images:car_images(*),
        bookings(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching car by ID:", error);
      throw error;
    }
    
    console.log("Received car data:", data);
    
    // Safely handle data.images with proper type checking
    const carImagesData = data.images;
    const carImages = Array.isArray(carImagesData) ? carImagesData : [];
    const primaryImage = carImages.find(img => img.is_primary);
    
    // Add placeholder host_rating for compatibility
    return {
      ...(data as any),
      host_rating: 4.5, // Placeholder value
      availability: true, // Add missing required property
      image_url: primaryImage?.image_path || 
                (carImages.length > 0 ? carImages[0].image_path : ''),
      trust_rating: 4.5, // Add missing required property
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
    const { car, startDate, endDate } = bookingData;
    
    // Only include properties that match the database schema
    const bookingRecord = {
      car_id: car.id,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: 'pending',
      user_id: (await supabase.auth.getUser()).data.user?.id
    };
    
    // Create booking record
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingRecord)
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
