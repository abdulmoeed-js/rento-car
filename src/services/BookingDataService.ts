
import { supabase } from "@/integrations/supabase/client";
import { Booking } from "@/types/car";
import { logInfo, logError, LogType } from "@/utils/logger";

// Define TypeScript type for the raw database response
export interface BookingResponse {
  id: string;
  car_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  cars: {
    brand: string;
    model: string;
    location: string;
    price_per_day: number;
    [key: string]: any;
  } | null;
  profiles: {
    full_name: string | null;
    phone_number: string | null;
  } | null;
  flagged?: boolean;
}

export const fetchBookings = async (
  statusFilter: string = "all",
  locationFilter: string = "",
  flaggedFilter: boolean = false
): Promise<{ bookings: Booking[]; locations: string[] }> => {
  logInfo(LogType.ADMIN, "Fetching bookings with filters", {
    statusFilter,
    locationFilter,
    flaggedFilter,
  });

  try {
    let query = supabase
      .from("bookings")
      .select(`
        *,
        cars (*),
        profiles:user_id (full_name, phone_number)
      `);

    // Apply filters
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (locationFilter) {
      query = query.eq("cars.location", locationFilter);
    }

    // In a real app, you would have a 'flagged' column
    if (flaggedFilter) {
      query = query.eq("flagged", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get unique locations for filter dropdown
    const uniqueLocations = data
      ? [...new Set(data.map((booking: any) => booking.cars?.location).filter(Boolean))]
      : [];

    // Transform the data to match our Booking type
    const transformedBookings: Booking[] = data
      ? data.map((booking: any) => ({
          id: booking.id,
          car_id: booking.car_id,
          user_id: booking.user_id,
          start_date: booking.start_date,
          end_date: booking.end_date,
          status: booking.status as Booking["status"],
          created_at: booking.created_at,
          updated_at: booking.updated_at,
          cars: booking.cars || undefined,
          profiles: booking.profiles
            ? {
                id: booking.user_id,
                full_name: booking.profiles.full_name,
                phone_number: booking.profiles.phone_number,
              }
            : undefined,
        }))
      : [];

    logInfo(LogType.ADMIN, `Successfully fetched ${transformedBookings.length} bookings`);
    return { bookings: transformedBookings, locations: uniqueLocations as string[] };
  } catch (error) {
    logError(LogType.ADMIN, "Error fetching bookings", { error });
    return { bookings: [], locations: [] };
  }
};
