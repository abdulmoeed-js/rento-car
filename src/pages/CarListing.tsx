
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCars } from "@/lib/carApi";
import { CarFilters } from "@/types/car";
import CarFiltersComponent from "@/components/CarFilters";
import CarCard from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { CarFront, Plus, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const defaultFilters: CarFilters = {
  priceRange: [0, 200],
  carType: [],
  fuelType: [],
  transmission: [],
  city: [],
  sortBy: 'price_asc'
};

const CarListing = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [filters, setFilters] = useState<CarFilters>(defaultFilters);
  const navigate = useNavigate();

  const { data: cars = [], isLoading: carsLoading, refetch } = useQuery({
    queryKey: ['cars', filters],
    queryFn: () => fetchCars(filters, 1, 24) // Fetch first page with 24 items
  });

  const isLoading = authLoading || carsLoading;

  const handleFilterChange = (newFilters: CarFilters) => {
    setFilters(newFilters);
  };

  const handleSeedData = () => {
    navigate('/seed-cars');
  };

  useEffect(() => {
    refetch();
  }, [filters, refetch]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="container mx-auto p-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-rento-dark">Available Cars</h1>
            <p className="text-muted-foreground">Find the perfect car for your next trip</p>
          </div>
          
          {!authLoading && !user && (
            <Button asChild className="gap-2">
              <Link to="/auth">
                <User className="h-4 w-4" />
                Sign In / Sign Up
              </Link>
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <CarFiltersComponent onFilterChange={handleFilterChange} />
          </div>
          
          {/* Car Listing Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex justify-center items-center h-60">
                <div className="animate-spin h-8 w-8 border-4 border-rento-blue border-t-transparent rounded-full"></div>
              </div>
            ) : cars.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center shadow-sm border">
                <CarFront className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No cars found</h3>
                <p className="text-muted-foreground mb-4">
                  {user ? "No cars are available. Try seeding the database with demo cars." : "Try adjusting your filters to find available cars."}
                </p>
                
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button onClick={() => setFilters(defaultFilters)}>
                    Reset Filters
                  </Button>
                  
                  {user && (
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-1" 
                      onClick={handleSeedData}
                    >
                      <Plus className="h-4 w-4" />
                      Seed Demo Cars
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cars.map(car => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CarListing;
