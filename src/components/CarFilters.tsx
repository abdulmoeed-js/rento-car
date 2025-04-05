
import React, { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CarFilters as CarFiltersType } from "@/types/car";

interface CarFiltersProps {
  onFilterChange: (filters: CarFiltersType) => void;
}

const CarFilters: React.FC<CarFiltersProps> = ({ onFilterChange }) => {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [transmission, setTransmission] = useState<"automatic" | "manual" | "">("");
  const [carType, setCarType] = useState<string>("");
  const [fuelType, setFuelType] = useState<string>("");

  const handleApplyFilters = () => {
    onFilterChange({
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      transmission,
      carType,
      fuelType,
    });
  };

  const handleResetFilters = () => {
    setPriceRange([0, 200]);
    setTransmission("");
    setCarType("");
    setFuelType("");
    onFilterChange({});
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>
      
      {/* Price Range */}
      <div className="mb-4">
        <Label className="mb-1 block">Price per day: ${priceRange[0]} - ${priceRange[1]}</Label>
        <Slider
          defaultValue={[0, 200]}
          min={0}
          max={200}
          step={5}
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          className="my-4"
        />
      </div>
      
      {/* Transmission */}
      <div className="mb-4">
        <Label htmlFor="transmission" className="mb-1 block">Transmission</Label>
        <Select value={transmission} onValueChange={(value) => setTransmission(value as any)}>
          <SelectTrigger id="transmission">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            <SelectItem value="automatic">Automatic</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Car Type */}
      <div className="mb-4">
        <Label htmlFor="car-type" className="mb-1 block">Car Type</Label>
        <Select value={carType} onValueChange={setCarType}>
          <SelectTrigger id="car-type">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            <SelectItem value="sedan">Sedan</SelectItem>
            <SelectItem value="suv">SUV</SelectItem>
            <SelectItem value="sports">Sports</SelectItem>
            <SelectItem value="hatchback">Hatchback</SelectItem>
            <SelectItem value="van">Van</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Fuel Type */}
      <div className="mb-4">
        <Label htmlFor="fuel-type" className="mb-1 block">Fuel Type</Label>
        <Select value={fuelType} onValueChange={setFuelType}>
          <SelectTrigger id="fuel-type">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            <SelectItem value="gasoline">Gasoline</SelectItem>
            <SelectItem value="diesel">Diesel</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="electric">Electric</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2 mt-6">
        <Button onClick={handleApplyFilters} className="flex-1">Apply Filters</Button>
        <Button onClick={handleResetFilters} variant="outline" className="flex-1">Reset</Button>
      </div>
    </div>
  );
};

export default CarFilters;
