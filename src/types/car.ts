
export interface Car {
  id: string;
  host_id: string;
  brand: string;
  model: string;
  year: number;
  price_per_day: number;
  location: string;
  location_coordinates?: { x: number; y: number };
  transmission: 'automatic' | 'manual';
  car_type: string;
  fuel_type: string;
  description: string;
  created_at: string;
  updated_at: string;
  images?: CarImage[];
  host_rating?: number;
  bookings?: Booking[];
}

export interface CarImage {
  id: string;
  car_id: string;
  image_path: string;
  is_primary: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  car_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  cars?: Car;
  profiles?: Profile;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  license_status?: string | null;
  license_uploaded_at?: string | null;
  license_image_url?: string | null;
}

export interface HostRating {
  id: string;
  host_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface CarFilters {
  minPrice?: number;
  maxPrice?: number;
  transmission?: 'automatic' | 'manual' | 'all';
  carType?: string;
  fuelType?: string;
}

export interface BookingFormData {
  car: Car;
  startDate: Date;
  endDate: Date;
  pickupTime: string;
  returnTime: string;
  location: string;
  message?: string;
  totalDays: number;
  totalPrice: number;
  status: 'pending';
  preferWhatsApp?: boolean;
}
