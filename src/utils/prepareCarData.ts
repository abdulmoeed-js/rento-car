
import { CarFormData } from "@/types/owner";

export const prepareCarData = (formData: Partial<CarFormData>, userId: string) => ({
  brand: formData.brand,
  model: formData.model,
  year: formData.year,
  transmission: formData.transmission,
  fuel_type: formData.fuel_type,
  doors: formData.doors,
  has_ac: formData.has_ac,
  license_plate: formData.license_plate,
  car_type: formData.car_type,
  price_per_day: formData.price_per_day,
  multi_day_discount: formData.multi_day_discount,
  cancellation_policy: formData.cancellation_policy,
  available_days: formData.available_days,
  available_hours: formData.available_hours,
  custom_availability: formData.custom_availability
    ? formData.custom_availability.map((date) => ({
        date:
          date.date instanceof Date
            ? date.date.toISOString().split("T")[0]
            : date.date,
        available: date.available,
      }))
    : null,
  location: formData.location,
  location_coordinates: formData.location_coordinates,
  pickup_instructions: formData.pickup_instructions,
  description: formData.description,
  host_id: userId,
});
