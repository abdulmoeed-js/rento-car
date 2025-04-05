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
}
