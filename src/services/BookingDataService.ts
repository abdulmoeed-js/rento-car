
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logInfo, logError, LogType } from "@/utils/logger";
import { Booking } from "@/types/car";

// Define an explicit interface for the booking response from Supabase
interface BookingResponseItem {
  id: string;
  car_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  cars?: {
    id: string;
    brand: string;
    model: string;
    location: string;
    price_per_day: number;
    [key: string]: any;
  };
  profiles?: {
    id: string;
    full_name: string | null;
    phone_number: string | null;
    license_status?: string | null;
    [key: string]: any;
  };
}

export async function fetchBookings(
  statusFilter: string = "all",
  locationFilter: string = "",
  flaggedFilter: boolean = false
): Promise<{ bookings: Booking[]; locations: string[] }> {
  logInfo(LogType.ADMIN, "Fetching bookings with filters", {
    status: statusFilter,
    location: locationFilter,
    flagged: flaggedFilter,
  });

  try {
    let query = supabase
      .from("bookings")
      .select("*, cars(*), profiles(*)");

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    // Get bookings
    const { data: bookingsData, error } = await query;

    if (error) {
      throw error;
    }

    // Extract unique locations from cars
    const allLocations = new Set<string>();
    
    // Transform the response to match our Booking type
    const bookings: Booking[] = (bookingsData as BookingResponseItem[]).map((item) => {
      if (item.cars?.location) {
        allLocations.add(item.cars.location);
      }
      
      return {
        id: item.id,
        car_id: item.car_id,
        user_id: item.user_id,
        start_date: item.start_date,
        end_date: item.end_date,
        status: item.status as 'pending' | 'confirmed' | 'cancelled' | 'completed',
        created_at: item.created_at,
        updated_at: item.updated_at,
        cars: item.cars ? {
          ...item.cars,
          images: [],
          bookings: [],
        } : undefined,
        profiles: item.profiles ? {
          id: item.profiles.id,
          full_name: item.profiles.full_name,
          phone_number: item.profiles.phone_number,
          license_status: item.profiles.license_status,
        } : undefined,
      };
    }) as Booking[];

    // Filter by location if specified
    const filteredBookings = locationFilter
      ? bookings.filter((booking) => booking.cars?.location === locationFilter)
      : bookings;

    // Filter flagged bookings if needed
    const finalBookings = flaggedFilter
      ? filteredBookings.filter((booking) => {
          // Implement flagged criteria here
          // For example, bookings that are pending for more than 7 days
          const createdDate = new Date(booking.created_at);
          const now = new Date();
          const daysDifference = Math.floor(
            (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          return booking.status === "pending" && daysDifference > 7;
        })
      : filteredBookings;

    logInfo(LogType.ADMIN, `Successfully fetched ${finalBookings.length} bookings`);
    return {
      bookings: finalBookings,
      locations: Array.from(allLocations).sort(),
    };
  } catch (error) {
    logError(LogType.ADMIN, "Error fetching bookings", { error });
    toast.error("Failed to fetch bookings");
    console.error("Error fetching bookings:", error);
    return { bookings: [], locations: [] };
  }
}
