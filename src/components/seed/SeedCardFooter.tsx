
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface SeedCardFooterProps {
  isLoading: boolean;
  isComplete: boolean;
  onSeed: () => void;
}

export const SeedCardFooter: React.FC<SeedCardFooterProps> = ({ 
  isLoading,
  isComplete,
  onSeed
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
      <div className="flex gap-2 w-full sm:w-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate("/cars")}
          className="flex-1 sm:flex-none"
        >
          Browse Cars
        </Button>
        
        <Button
          variant="outline"
          onClick={() => navigate("/wheelationship")}
          className="flex-1 sm:flex-none"
        >
          Try Wheelationship
        </Button>
      </div>
      
      <Button 
        disabled={isLoading || isComplete} 
        onClick={onSeed}
        className="w-full sm:w-auto"
      >
        {isLoading ? "Seeding Database..." : isComplete ? "Completed" : "Seed Database"}
      </Button>
    </div>
  );
};
