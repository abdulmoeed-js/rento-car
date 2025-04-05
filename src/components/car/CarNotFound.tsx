
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CarFront } from "lucide-react";

const CarNotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <CarFront className="h-12 w-12 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Car Not Found</h1>
      <p className="text-muted-foreground mb-4">The car you're looking for doesn't exist or has been removed.</p>
      <Button asChild>
        <Link to="/cars">Back to Car Listings</Link>
      </Button>
    </div>
  );
};

export default CarNotFound;
