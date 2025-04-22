
// Car API functions and availability type guard

import { supabase } from "@/integrations/supabase/client";
import type { Car, CarFilters } from "@/types/car";

// Type guard for available_hours object
function isAvailableHoursObject(obj: unknown): obj is { start: string; end: string } {
  return (
    typeof obj === "object" &&
    !!obj &&
    !Array.isArray(obj) &&
    typeof (obj as any).start === "string" &&
    typeof (obj as any).end === "string"
  );
}

function parseAvailableHours(raw: any): { start: string; end: string } {
  const fallback = { start: '08:00', end: '20:00' };
  if (!raw) return fallback;

  if (isAvailableHoursObject(raw)) {
    return { start: raw.start, end: raw.end };
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (isAvailableHoursObject(parsed)) {
        return { start: parsed.start, end: parsed.end };
      }
    } catch (e) {
      console.error("Error parsing available_hours:", e);
    }
  }

  return fallback;
}

// Fetch cars with filters
export const fetchCars = async (filters: CarFilters, page: number, pageSize: number): Promise<Car[]> => {
  try {
    let query = supabase
      .from('cars')
      .select(`
        *,
        images:car_images(*),
        bookings(*)
      `)
      .order('created_at', { ascending: false });

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

    if (filters.sortBy === 'price_asc') {
      query = query.order('price_per_day', { ascending: true });
    } else if (filters.sortBy === 'price_desc') {
      query = query.order('price_per_day', { ascending: false });
    } else if (filters.sortBy === 'newest' || filters.sortBy === 'rating') {
      query = query.order('year', { ascending: false });
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize - 1;
    query = query.range(startIndex, endIndex);

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching cars:', error);
      return [];
    }

    return (data || []).map(car => {
      const carImages = Array.isArray(car.images) ? car.images : [];
      const primaryImage = carImages.find(img => img.is_primary);

      return {
        ...(car as any),
        available_hours: parseAvailableHours(car.available_hours),
        host_rating: 4.5,
        availability: true,
        image_url: primaryImage?.image_path || (carImages.length > 0 ? carImages[0].image_path : ''),
        trust_rating: 4.5,
      } as Car;
    });
  } catch (error) {
    console.error("Unexpected error in fetchCars:", error);
    return [];
  }
};

export const getCarById = async (id: string): Promise<Car | null> => {
  try {
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

    const carImages = Array.isArray(data.images) ? data.images : [];
    const primaryImage = carImages.find(img => img.is_primary);

    return {
      ...(data as any),
      available_hours: parseAvailableHours(data.available_hours),
      host_rating: 4.5,
      availability: true,
      image_url: primaryImage?.image_path || (carImages.length > 0 ? carImages[0].image_path : ''),
      trust_rating: 4.5,
    } as Car;
  } catch (error) {
    console.error('Error fetching car:', error);
    return null;
  }
};

export const getCars = fetchCars;


