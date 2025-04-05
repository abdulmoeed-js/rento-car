
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
import { Checkbox } from "./ui/checkbox";

interface CarFiltersProps {
  onFilterChange: (filters: CarFiltersType) => void;
}

const CarFilters: React.FC<CarFiltersProps> = ({ onFilterChange }) => {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [carType, setCarType] = useState<string[]>([]);
  const [fuelType, setFuelType] = useState<string[]>([]);
  const [transmission, setTransmission] = useState<string[]>([]);
  const [city, setCity] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'newest' | 'rating'>('price_asc');

  const handleCarTypeChange = (type: string) => {
    setCarType(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  const handleFuelTypeChange = (type: string) => {
    setFuelType(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  const handleTransmissionChange = (type: string) => {
    setTransmission(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  const handleCityChange = (city: string) => {
    setCity(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city) 
        : [...prev, city]
    );
  };

  const handleApplyFilters = () => {
    onFilterChange({
      priceRange,
      carType,
      fuelType,
      transmission,
      city,
      sortBy
    });
  };

  const handleResetFilters = () => {
    setPriceRange([0, 200]);
    setCarType([]);
    setFuelType([]);
    setTransmission([]);
    setCity([]);
    setSortBy('price_asc');
    
    onFilterChange({
      priceRange: [0, 200],
      carType: [],
      fuelType: [],
      transmission: [],
      city: [],
      sortBy: 'price_asc'
    });
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
      
      {/* Car Type */}
      <div className="mb-4">
        <Label className="mb-2 block">Car Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {['sedan', 'suv', 'sports', 'hatchback', 'van'].map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox 
                id={`car-type-${type}`} 
                checked={carType.includes(type)}
                onCheckedChange={() => handleCarTypeChange(type)}
              />
              <label 
                htmlFor={`car-type-${type}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Fuel Type */}
      <div className="mb-4">
        <Label className="mb-2 block">Fuel Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {['gasoline', 'diesel', 'hybrid', 'electric'].map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox 
                id={`fuel-type-${type}`} 
                checked={fuelType.includes(type)}
                onCheckedChange={() => handleFuelTypeChange(type)}
              />
              <label 
                htmlFor={`fuel-type-${type}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Transmission */}
      <div className="mb-4">
        <Label className="mb-2 block">Transmission</Label>
        <div className="flex gap-3">
          {['automatic', 'manual'].map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox 
                id={`transmission-${type}`} 
                checked={transmission.includes(type)}
                onCheckedChange={() => handleTransmissionChange(type)}
              />
              <label 
                htmlFor={`transmission-${type}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Sort By */}
      <div className="mb-4">
        <Label htmlFor="sort-by" className="mb-1 block">Sort By</Label>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
          <SelectTrigger id="sort-by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="rating">Host Rating</SelectItem>
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
