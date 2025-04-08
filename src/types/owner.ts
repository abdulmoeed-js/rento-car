
import { Car, Booking } from "./car";

export interface CarFormData {
  // Step 1: Car Details
  brand: string;
  model: string;
  year: number;
  transmission: string;
  fuel_type: string;
  doors: number;
  has_ac: boolean;
  license_plate?: string;
  car_type: string;
  
  // Step 2: Photos
  images: File[];
  primaryImageIndex: number;
  existingImages?: Array<{id: string, url: string, is_primary?: boolean}>;
  
  // Step 3: Pricing
  price_per_day: number;
  multi_day_discount: number;
  cancellation_policy: 'flexible' | 'moderate' | 'strict';
  
  // Step 4: Availability
  available_days: string[];
  available_hours: {
    start: string;
    end: string;
  };
  custom_availability?: {
    date: Date;
    available: boolean;
  }[];
  
  // Step 5: Pickup Instructions
  location: string;
  location_coordinates?: { lat?: number; lng?: number } | null;
  pickup_instructions?: string;
  
  // Additional fields
  description: string;
}

export interface BookingRequest extends Booking {
  renter_name: string;
  renter_image?: string;
  renter_rating?: number;
}

export interface EarningsSummary {
  total: number;
  byPeriod: {
    period: string;
    amount: number;
  }[];
  byCar: {
    carId: string;
    carName: string;
    amount: number;
    color?: string;
  }[];
}

export type FormStep = 'details' | 'photos' | 'pricing' | 'availability' | 'pickup' | 'review';
