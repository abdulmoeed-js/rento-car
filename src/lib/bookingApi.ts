
// Booking and calendar API logic

import { supabase } from "@/integrations/supabase/client";
import type { BookingFormData, Booking } from "@/types/car";

// submitBooking: submits a booking form for a car
export const submitBooking = async (bookingData: BookingFormData): Promise<{ id: string } | null> => {
  try {
    const { car, startDate, endDate } = bookingData;
    const bookingRecord = {
      car_id: car.id,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: 'pending',
      user_id: (await supabase.auth.getUser()).data.user?.id
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingRecord)
      .select('id')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting booking:', error);
    return null;
  }
};

// getMonthlyAvailability: returns booking availability of car for a month
export const getMonthlyAvailability = (
  year: number, 
  month: number, 
  bookings: Booking[]
): { date: Date; isAvailable: boolean }[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isBooked = bookings.some(booking => {
      const startDate = new Date(booking.start_date);
      const endDate = new Date(booking.end_date);
      return (
        (booking.status === 'confirmed' || booking.status === 'pending') && 
        (date >= startDate && date <= endDate)
      );
    });
    days.push({
      date,
      isAvailable: !isBooked
    });
  }
  return days;
};
