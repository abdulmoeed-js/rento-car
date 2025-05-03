
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { QuizAnswer } from "@/pages/Wheelationship";
import { ArrowRight, CarFront } from "lucide-react";

// Quiz questions
const QUESTIONS = [
  {
    id: "tripType",
    question: "What kind of trip are you planning?",
    options: [
      { value: "city", label: "City driving", icon: "🏙️" },
      { value: "roadTrip", label: "Road trip", icon: "🛣️" },
      { value: "adventure", label: "Off-road adventure", icon: "🏞️" },
      { value: "family", label: "Family vacation", icon: "👨‍👩‍👧‍👦" },
      { value: "business", label: "Business travel", icon: "💼" },
      { value: "moving", label: "Moving/hauling", icon: "📦" }
    ]
  },
  {
    id: "partySize",
    question: "How many people will be traveling?",
    options: [
      { value: "1", label: "Just me", icon: "👤" },
      { value: "2", label: "Two people", icon: "👥" },
      { value: "4", label: "3-4 people", icon: "👨‍👩‍👧" },
      { value: "6", label: "5-6 people", icon: "👨‍👩‍👧‍👧" },
      { value: "8", label: "7+ people", icon: "👨‍👩‍👦‍👦" }
    ]
  },
  {
    id: "budget",
    question: "What's your budget range?",
    options: [
      { value: "low", label: "Economy (< 6,000 PKR/day)", icon: "💰" },
      { value: "mid", label: "Standard (6,000-10,000 PKR/day)", icon: "💰💰" },
      { value: "high", label: "Premium (> 10,000 PKR/day)", icon: "💰💰💰" }
    ]
  },
  {
    id: "style",
    question: "What type of vehicle do you prefer?",
    options: [
      { value: "sedan", label: "Sedan", icon: "🚗" },
      { value: "suv", label: "SUV", icon: "🚙" },
      { value: "coupe", label: "Coupe", icon: "🏎️" },
      { value: "convertible", label: "Convertible", icon: "🚗💨" },
      { value: "minivan", label: "Minivan", icon: "🚐" },
      { value: "pickup", label: "Pickup", icon: "🛻" }
    ]
  },
  {
    id: "preferences",
    question: "Any specific preferences? (Select all that apply)",
    multiSelect: true,
    options: [
      { value: "eco", label: "Eco-friendly", icon: "🌱" },
      { value: "luxury", label: "Luxury features", icon: "✨" },
      { value: "automatic", label: "Automatic transmission", icon: "🅰️" },
      { value: "manual", label: "Manual transmission", icon: "🅼" },
      { value: "pet", label: "Pet-friendly", icon: "🐕" }
    ]
  }
];

interface WheelationshipQuizProps {
  onComplete: (answers: QuizAnswer) => void;
}

const WheelationshipQuiz: React.FC<WheelationshipQuizProps> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer>({
    tripType: "",
    partySize: "",
    budget: "",
    style: "",
    preferences: []
  });
  const [direction, setDirection] = useState<"right" | "left">("right");

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const isMultiSelect = currentQuestion.multiSelect === true;
  const isLastQuestion = currentQuestionIndex === QUESTIONS.length - 1;

  const handleOptionSelect = (value: string) => {
    if (isMultiSelect) {
      // For multi-select, toggle the selected value
      setAnswers(prev => {
        const preferences = [...prev.preferences];
        const index = preferences.indexOf(value);
        
        if (index >= 0) {
          preferences.splice(index, 1);
        } else {
          preferences.push(value);
        }
        
        return { ...prev, preferences };
      });
    } else {
      // For single-select, store the value directly
      setAnswers(prev => ({ 
        ...prev, 
        [currentQuestion.id]: value 
      }));
      
      // Auto-advance to next question if not the last one
      if (!isLastQuestion) {
        setDirection("right");
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
        }, 300);
      }
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete(answers);
    } else {
      setDirection("right");
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setDirection("left");
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Progress indicator */}
      <div className="w-full mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {QUESTIONS.length}
          </span>
          <span className="text-sm font-medium">
            {Math.round(((currentQuestionIndex + 1) / QUESTIONS.length) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-rento-blue rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, x: direction === "right" ? 50 : -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full mb-8"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">{currentQuestion.question}</h2>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {currentQuestion.options.map((option) => {
            // Determine if this option is selected
            const isSelected = isMultiSelect
              ? answers.preferences.includes(option.value)
              : answers[currentQuestion.id as keyof typeof answers] === option.value;

            return (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(option.value)}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center h-24
                  ${
                    isSelected
                      ? "border-rento-blue bg-rento-blue/10 shadow-md"
                      : "border-gray-200 hover:border-rento-blue/50"
                  }`}
              >
                <span className="text-2xl mb-2">{option.icon}</span>
                <span className={`font-medium ${isSelected ? "text-rento-blue" : ""}`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between w-full pt-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentQuestionIndex === 0}
          className={currentQuestionIndex === 0 ? "invisible" : ""}
        >
          Previous
        </Button>

        {isMultiSelect || isLastQuestion ? (
          <Button 
            onClick={handleNext}
            disabled={isMultiSelect && answers.preferences.length === 0}
            className="ml-auto"
          >
            {isLastQuestion ? "Find My Match" : "Next"}
            {!isLastQuestion && <ArrowRight className="ml-2 h-4 w-4" />}
            {isLastQuestion && <CarFront className="ml-2 h-4 w-4" />}
          </Button>
        ) : (
          <div /> // Empty div for spacing when the Next button is not needed
        )}
      </div>
    </div>
  );
};

export default WheelationshipQuiz;
