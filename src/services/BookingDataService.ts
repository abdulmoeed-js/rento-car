
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
  pickup_time?: string;
  return_time?: string;
  location?: string;
  message?: string;
  total_price?: number;
  prefer_whatsapp?: boolean;
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
    user_role?: string | null;
  } | null;
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
    // Cast the data explicitly to handle potential type mismatches
    const bookingsWithTypeChecks = (bookingsData || []).map((item: any) => {
      if (item.cars?.location) {
        allLocations.add(item.cars.location);
      }
      
      // Check if profiles exists and has the expected shape
      let profileData = null;
      if (item.profiles && typeof item.profiles === 'object' && !item.profiles.error) {
        profileData = {
          id: item.profiles.id,
          full_name: item.profiles.full_name,
          phone_number: item.profiles.phone_number,
          license_status: item.profiles.license_status,
          user_role: item.profiles.user_role,
        };
      }
      
      const booking: Booking = {
        id: item.id,
        car_id: item.car_id,
        user_id: item.user_id,
        start_date: item.start_date,
        end_date: item.end_date,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        pickup_time: item.pickup_time,
        return_time: item.return_time,
        location: item.location,
        message: item.message,
        total_price: item.total_price,
        prefer_whatsapp: item.prefer_whatsapp,
        cars: item.cars,
        profiles: profileData,
      };
      
      return booking;
    });

    // Filter by location if specified
    const filteredBookings = locationFilter
      ? bookingsWithTypeChecks.filter((booking) => booking.cars?.location === locationFilter)
      : bookingsWithTypeChecks;

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
