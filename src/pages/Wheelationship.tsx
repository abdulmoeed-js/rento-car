
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleQuizComplete = async (quizAnswers: QuizAnswer) => {
    setAnswers(quizAnswers);
    
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
    
    // Find matching cars based on answers
    // This is a simplified version - in a real app you'd use a more sophisticated algorithm
    try {
      // Get car tags that correspond to the user's answers
      const tagPromises = [];
      
      // Trip type
      if (quizAnswers.tripType) {
        const tripTypeMap: Record<string, string> = {
          "city": "city_driving",
          "roadTrip": "road_trip",
          "adventure": "off_road",
          "family": "family_travel",
          "business": "business",
          "moving": "moving"
        };
        
        if (tripTypeMap[quizAnswers.tripType]) {
          tagPromises.push(
            supabase
              .from("car_tags")
              .select("id")
              .eq("tag", tripTypeMap[quizAnswers.tripType])
              .eq("tag_type", "use_case")
          );
        }
      }
      
      // Party size
      if (quizAnswers.partySize) {
        let capacityTag;
        const partySize = parseInt(quizAnswers.partySize);
        
        if (partySize <= 2) capacityTag = "2_seats";
        else if (partySize <= 4) capacityTag = "4_seats";
        else if (partySize <= 5) capacityTag = "5_seats";
        else if (partySize <= 7) capacityTag = "7_seats";
        else capacityTag = "8+_seats";
        
        tagPromises.push(
          supabase
            .from("car_tags")
            .select("id")
            .eq("tag", capacityTag)
            .eq("tag_type", "capacity")
        );
      }
      
      // Budget
      if (quizAnswers.budget) {
        const budgetMap: Record<string, string> = {
          "low": "economy",
          "mid": "standard",
          "high": "premium",
          "luxury": "luxury"
        };
        
        if (budgetMap[quizAnswers.budget]) {
          tagPromises.push(
            supabase
              .from("car_tags")
              .select("id")
              .eq("tag", budgetMap[quizAnswers.budget])
              .eq("tag_type", "luxury")
          );
        }
      }
      
      // Car style/body
      if (quizAnswers.style) {
        tagPromises.push(
          supabase
            .from("car_tags")
            .select("id")
            .eq("tag", quizAnswers.style)
            .eq("tag_type", "body")
        );
      }
      
      // Preferences may include fuel types
      if (quizAnswers.preferences?.includes("eco")) {
        const ecoTags = ["electric", "hybrid", "plugin_hybrid"];
        tagPromises.push(
          supabase
            .from("car_tags")
            .select("id")
            .in("tag", ecoTags)
            .eq("tag_type", "fuel")
        );
      }
      
      // Execute all tag queries
      const tagResults = await Promise.all(tagPromises);
      const tagIds = tagResults
        .filter(result => !result.error && result.data?.length > 0)
        .flatMap(result => result.data?.map(tag => tag.id) || []);
      
      if (tagIds.length > 0) {
        // Find cars that match these tags
        const { data: carTagJoins, error: joinError } = await supabase
          .from("car_tags_join")
          .select("car_id")
          .in("tag_id", tagIds);
        
        if (joinError) {
          console.error("Error finding matching cars:", joinError);
          toast.error("Error finding your perfect car match");
          return;
        }
        
        // Get unique car IDs
        const carIds = [...new Set(carTagJoins?.map(join => join.car_id))];
        
        if (carIds.length > 0) {
          // Fetch full car details
          const { data: cars, error: carsError } = await supabase
            .from("cars")
            .select(`
              *,
              images:car_images(*)
            `)
            .in("id", carIds)
            .limit(5);
          
          if (carsError) {
            console.error("Error fetching cars:", carsError);
            toast.error("Error loading your car matches");
            return;
          }
          
          // Process cars to include image URLs
          const processedCars = cars?.map(car => {
            const carImages = Array.isArray(car.images) ? car.images : [];
            const primaryImage = carImages.find(img => img.is_primary);
            
            return {
              ...car,
              image_url: primaryImage?.image_path || (carImages.length > 0 ? carImages[0].image_path : ''),
              match_percentage: Math.floor(70 + Math.random() * 30) // Random match % between 70-100%
            };
          });
          
          setMatchedCars(processedCars || []);
        } else {
          setMatchedCars([]);
        }
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
    }
    
    setStep("results");
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
          {step === "quiz" ? (
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
