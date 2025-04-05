
export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  location: string;
  price_per_day: number;
  availability: boolean;
  car_type: string;
  fuel_type: string;
  transmission: string;
  image_url: string;
  host_id: string;
  trust_rating: number;
  description: string;
  // Added properties that are being used throughout the application
  images?: {
    id: string;
    car_id: string;
    image_path: string;
    is_primary: boolean;
    created_at: string;
  }[];
  host_rating?: number;
  bookings?: Booking[];
}

export interface Booking {
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
  // References to joined tables
  cars?: Car;
  profiles?: {
    id: string;
    full_name: string | null;
    phone_number: string | null;
    license_status?: string | null;
    user_role?: string | null;
  } | null;
}

export interface BookingFormData {
  car: Car;
  startDate: Date;
  endDate: Date;
  pickupTime: string;
  returnTime: string;
  location: string;
  message: string;
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
