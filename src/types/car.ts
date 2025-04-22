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
  car_images?: {
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

export interface Booking {
  id: string;
  car_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  pickup_time?: string;
  return_time?: string;
  location?: string;
  message?: string;
  total_price?: number;
  prefer_whatsapp?: boolean;
  created_at: string;
  updated_at: string;
  cars?: Car;
  profiles?: {
    id: string;
    full_name: string | null;
    email?: string;
    phone_number: string | null;
    license_status?: string | null;
    user_role?: string | null;
    license_image_url?: string | null;
  } | null;
}

export interface BookingFormData {
  car: Car;
  startDate: Date;
  endDate: Date;
  pickupTime?: string;
  returnTime?: string;
  location?: string;
  message?: string;
  totalDays: number;
  totalPrice: number;
  status: string;
  preferWhatsApp?: boolean;
}

export interface CarFilters {
  priceRange: [number, number];
  carType: string[];
  fuelType: string[];
  transmission: string[];
  city: string[];
  sortBy: 'price_asc' | 'price_desc' | 'newest' | 'rating';
}
