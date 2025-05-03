
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import WheelationshipQuiz from "@/components/wheelationship/WheelationshipQuiz";
import WheelationshipResults from "@/components/wheelationship/WheelationshipResults";
import { CarFront } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export type QuizAnswer = {
  tripType: string;
  partySize: string;
  budget: string;
  style: string;
  preferences: string[];
};

const Wheelationship = () => {
  const [step, setStep] = useState<"quiz" | "results">("quiz");
  const [answers, setAnswers] = useState<QuizAnswer | null>(null);
  const [matchedCars, setMatchedCars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleQuizComplete = async (quizAnswers: QuizAnswer) => {
    setAnswers(quizAnswers);
    setIsLoading(true);
    
    // Save quiz answers to database for analytics (if user is logged in)
    if (user) {
      try {
        await supabase.from("car_match_sessions").insert({
          user_id: user.id,
          answers: quizAnswers
        });
      } catch (error) {
        console.error("Error saving quiz answers:", error);
      }
    }
    
    try {
      // Map quiz answers to the format expected by the match_cars function
      const quizPayload: Record<string, string> = {};
      
      // Map trip type to use case
      const tripTypeMap: Record<string, string> = {
        "city": "city_driving",
        "roadTrip": "road_trip",
        "adventure": "off_road",
        "family": "family_travel",
        "business": "business",
        "moving": "moving"
      };
      
      if (quizAnswers.tripType) {
        quizPayload.tripType = tripTypeMap[quizAnswers.tripType] || quizAnswers.tripType;
      }
      
      // Map party size to seats
      if (quizAnswers.partySize) {
        const partySize = parseInt(quizAnswers.partySize);
        if (partySize <= 2) quizPayload.seats = "2_seats";
        else if (partySize <= 4) quizPayload.seats = "4_seats";
        else if (partySize <= 5) quizPayload.seats = "5_seats";
        else if (partySize <= 7) quizPayload.seats = "7_seats";
        else quizPayload.seats = "8+_seats";
      }
      
      // Map car style to body
      if (quizAnswers.style) {
        quizPayload.body = quizAnswers.style;
      }
      
      // Map budget
      if (quizAnswers.budget) {
        quizPayload.budget = quizAnswers.budget;
      }
      
      // Map preferences (fuel type)
      if (quizAnswers.preferences?.includes("eco")) {
        quizPayload.fuel = "electric";
      }
      
      console.log("Calling match_cars with payload:", quizPayload);
      
      // Call the match_cars RPC function
      const { data: matchResults, error: matchError } = await supabase
        .rpc('match_cars', { 
          quiz: quizPayload,
          limit_count: 5 
        });
      
      if (matchError) {
        console.error("Error finding matching cars:", matchError);
        toast.error("Error finding your perfect car match");
        setIsLoading(false);
        return;
      }
      
      if (matchResults && matchResults.length > 0) {
        // Fetch full car details for each matched car
        const carIds = matchResults.map(match => match.car_id);
        
        const { data: cars, error: carsError } = await supabase
          .from("cars")
          .select(`
            *,
            images:car_images(*)
          `)
          .in("id", carIds);
          
        if (carsError) {
          console.error("Error fetching cars:", carsError);
          toast.error("Error loading your car matches");
          setIsLoading(false);
          return;
        }
        
        // Process cars to include image URLs and match scores
        const processedCars = cars?.map(car => {
          const carImages = Array.isArray(car.images) ? car.images : [];
          const primaryImage = carImages.find(img => img.is_primary);
          const matchResult = matchResults.find(match => match.car_id === car.id);
          
          // Calculate match percentage from match_score (normalize to 70-100% range)
          const totalPossibleScore = 5; // This depends on your scoring logic in the SQL function
          let matchPercentage = Math.floor(70 + (matchResult?.match_score / totalPossibleScore) * 30);
          // Ensure it's within range
          matchPercentage = Math.max(70, Math.min(100, matchPercentage));
          
          return {
            ...car,
            image_url: primaryImage?.image_path || (carImages.length > 0 ? carImages[0].image_path : ''),
            match_percentage: matchPercentage
          };
        });
        
        setMatchedCars(processedCars || []);
      } else {
        // Fallback: fetch some random cars if no specific matches
        const { data: randomCars, error: randomError } = await supabase
          .from("cars")
          .select(`
            *,
            images:car_images(*)
          `)
          .limit(3);
        
        if (!randomError && randomCars) {
          const processedCars = randomCars.map(car => {
            const carImages = Array.isArray(car.images) ? car.images : [];
            const primaryImage = carImages.find(img => img.is_primary);
            
            return {
              ...car,
              image_url: primaryImage?.image_path || (carImages.length > 0 ? carImages[0].image_path : ''),
              match_percentage: Math.floor(50 + Math.random() * 20) // Lower match % for random results
            };
          });
          
          setMatchedCars(processedCars);
        } else {
          setMatchedCars([]);
        }
      }
    } catch (error) {
      console.error("Error in car matching algorithm:", error);
      toast.error("Something went wrong finding your car match");
      setMatchedCars([]);
    } finally {
      setIsLoading(false);
      setStep("results");
    }
  };

  const handleRetakeQuiz = () => {
    setStep("quiz");
    setAnswers(null);
    setMatchedCars([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rento-lightblue to-white flex flex-col items-center p-4">
      <div className="w-full max-w-4xl mb-6">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-rento-blue text-white p-3 rounded-full mr-3">
            <CarFront className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-rento-dark">Wheelationship</h1>
            <p className="text-muted-foreground">Find your perfect car match</p>
          </div>
        </div>
        
        <Card className="w-full p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin h-12 w-12 border-4 border-rento-blue border-t-transparent rounded-full mb-4"></div>
              <p className="text-lg">Finding your perfect match...</p>
            </div>
          ) : step === "quiz" ? (
            <WheelationshipQuiz onComplete={handleQuizComplete} />
          ) : (
            <WheelationshipResults 
              answers={answers} 
              matchedCars={matchedCars} 
              onRetakeQuiz={handleRetakeQuiz} 
            />
          )}
        </Card>
      </div>
      
      <button 
        onClick={() => navigate("/")} 
        className="mt-4 text-rento-blue hover:underline"
      >
        Back to home
      </button>
      
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <p>©{new Date().getFullYear()} Rento. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Wheelationship;
