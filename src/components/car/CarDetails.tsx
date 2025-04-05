
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Gauge, Fuel, CarFront, Calendar } from "lucide-react";
import { Car } from "@/types/car";

interface CarDetailsProps {
  car: Car;
}

const CarDetails: React.FC<CarDetailsProps> = ({ car }) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Car Details</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <Gauge className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-sm font-medium">{car.transmission}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <Fuel className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-sm font-medium">{car.fuel_type}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <CarFront className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-sm font-medium">{car.car_type}</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-sm font-medium">{car.year}</span>
          </div>
        </div>
        
        <h3 className="font-medium mb-2">Description</h3>
        <p className="text-muted-foreground">{car.description}</p>
      </CardContent>
    </Card>
  );
};

export default CarDetails;
