
import React from "react";
import { Car } from "@/types/car";
import BookingFormManager from "./booking/BookingFormManager";

interface BookingFormProps {
  car: Car;
}

const BookingForm: React.FC<BookingFormProps> = ({ car }) => {
  return <BookingFormManager car={car} />;
};

export default BookingForm;
