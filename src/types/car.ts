
export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  location: string;
  price_per_day: number;
  availability?: boolean;
  car_type: string;
  fuel_type: string;
  transmission: string;
  image_url?: string;
  host_id: string;
  trust_rating?: number;
  description: string;
  // Additional properties for owner portal
  doors?: number;
  has_ac?: boolean;
  license_plate?: string;
  multi_day_discount?: number;
  cancellation_policy?: 'flexible' | 'moderate' | 'strict';
  available_days?: string[];
  available_hours?: {
    start: string;
    end: string;
  };
  custom_availability?: {
    date: string; // Changed from Date to string for compatibility with database
    available: boolean;
  }[];
  pickup_instructions?: string;
  location_coordinates?: { lat?: number; lng?: number } | null;
  // Array properties - explicitly define as arrays or null
  images?: {
    id: string;
    car_id: string;
    image_path: string;
    is_primary: boolean;
    created_at: string;
  }[] | null;
  host_rating?: number;
  bookings?: Booking[] | null;
  created_at?: string;
  updated_at?: string;
}
