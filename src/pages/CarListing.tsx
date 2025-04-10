
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCars } from "@/lib/api";
import { CarFilters } from "@/types/car";
import CarFiltersComponent from "@/components/CarFilters";
import CarCard from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { CarFront, User, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const defaultFilters: CarFilters = {
  priceRange: [0, 200],
  carType: [],
  fuelType: [],
  transmission: [],
  city: [],
  sortBy: 'price_asc'
};

const CarListing = () => {
  const { user, signOut } = useAuth();
  const [filters, setFilters] = useState<CarFilters>(defaultFilters);
  const navigate = useNavigate();

  const { data: cars = [], isLoading, refetch } = useQuery({
    queryKey: ['cars', filters],
    queryFn: () => fetchCars(filters, 1, 24) // Fetch first page with 24 items
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleFilterChange = (newFilters: CarFilters) => {
    setFilters(newFilters);
  };

  useEffect(() => {
    refetch();
  }, [filters, refetch]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-rento-blue text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <CarFront className="h-6 w-6" />
            <span className="font-bold text-xl">Rento</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <span className="hidden sm:inline">
                    {user.email || user.phone}
                  </span>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={signOut}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button asChild variant="secondary">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-rento-dark">Available Cars</h1>
          <p className="text-muted-foreground">Find the perfect car for your next trip</p>
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
                <p className="text-muted-foreground mb-4">Try adjusting your filters to find available cars.</p>
                <Button onClick={() => setFilters(defaultFilters)}>Reset Filters</Button>
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
