import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuizAnswer } from "@/pages/Wheelationship";
import { Heart, RefreshCw, Sparkles, ThumbsUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WheelationshipResultsProps {
  answers: QuizAnswer | null;
  matchedCars: any[];
  onRetakeQuiz: () => void;
}

const WheelationshipResults: React.FC<WheelationshipResultsProps> = ({
  answers,
  matchedCars,
  onRetakeQuiz,
}) => {
  const navigate = useNavigate();

  if (matchedCars.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <Heart className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No perfect matches found</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't find cars that match your specific preferences.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={onRetakeQuiz}>
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
          <Button onClick={() => navigate("/cars")} variant="outline">
            Browse All Cars
          </Button>
        </div>
      </div>
    );
  }

  // Sort cars by match percentage (highest first)
  const sortedCars = [...matchedCars].sort(
    (a, b) => b.match_percentage - a.match_percentage
  );
  
  // The best match is the first one after sorting
  const bestMatch = sortedCars[0];

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
          <Sparkles className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-1">We Found Your Match!</h2>
        <p className="text-muted-foreground">
          Based on your preferences, here's your ideal car
        </p>
      </div>

      {/* Best match card */}
      <Card className="w-full max-w-2xl mb-8 overflow-hidden bg-gradient-to-b from-rento-lightblue/30 to-white border-2 border-rento-blue/20">
        <div className="relative">
          <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full font-bold flex items-center">
            {bestMatch.match_percentage}% Match
          </div>
          <img
            src={bestMatch.image_url || "/placeholder.svg"}
            alt={`${bestMatch.brand} ${bestMatch.model}`}
            className="w-full h-48 object-cover"
          />
        </div>
        
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">
                {bestMatch.brand} {bestMatch.model}
              </h3>
              <p className="text-muted-foreground text-sm">
                {bestMatch.year} • {bestMatch.location}
              </p>
            </div>
            <div className="mt-2 sm:mt-0">
              <p className="font-bold text-lg text-rento-blue">
                ${bestMatch.price_per_day}/day
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-gray-100 text-sm px-2 py-1 rounded">
              {bestMatch.car_type}
            </span>
            <span className="bg-gray-100 text-sm px-2 py-1 rounded">
              {bestMatch.fuel_type}
            </span>
            <span className="bg-gray-100 text-sm px-2 py-1 rounded">
              {bestMatch.transmission}
            </span>
          </div>
          
          <p className="mb-4 line-clamp-2">{bestMatch.description}</p>
          
          <Button 
            onClick={() => navigate(`/cars/${bestMatch.id}`)} 
            className="w-full"
          >
            <ThumbsUp className="mr-2 h-4 w-4" /> View This Car
          </Button>
        </div>
      </Card>
      
      {/* Other matches */}
      {sortedCars.length > 1 && (
        <>
          <h3 className="font-bold text-lg mb-4 w-full">Other Good Matches</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {sortedCars.slice(1, 5).map((car) => (
              <Card key={car.id} className="overflow-hidden">
                <div className="relative">
                  <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                    {car.match_percentage}% Match
                  </div>
                  <img
                    src={car.image_url || "/placeholder.svg"}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-32 object-cover"
                  />
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-bold">
                      {car.brand} {car.model}
                    </h4>
                    <span className="font-medium text-rento-blue">
                      ${car.price_per_day}/day
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    {car.year} • {car.transmission}
                  </div>
                  
                  <Button
                    onClick={() => navigate(`/cars/${car.id}`)}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full">
        <Button onClick={onRetakeQuiz} variant="outline" className="flex-1">
          <RefreshCw className="mr-2 h-4 w-4" /> Retake Quiz
        </Button>
        <Button onClick={() => navigate("/cars")} className="flex-1">
          Browse All Cars
        </Button>
      </div>
    </div>
  );
};

export default WheelationshipResults;
