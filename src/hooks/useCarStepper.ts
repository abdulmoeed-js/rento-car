
import { useState } from "react";
import type { FormStep } from "@/types/owner";

export const formSteps: FormStep[] = [
  "details",
  "photos",
  "pricing",
  "availability",
  "pickup",
  "review"
];

export const stepLabels: Record<FormStep, string> = {
  details: "Car Details",
  photos: "Photos",
  pricing: "Pricing",
  availability: "Availability",
  pickup: "Pickup",
  review: "Review"
};

export function useCarStepper(initialStep: FormStep = "details") {
  const [currentStep, setCurrentStep] = useState<FormStep>(initialStep);
  const [validatedSteps, setValidatedSteps] = useState<Set<FormStep>>(new Set());

  const goToNextStep = () => {
    const idx = formSteps.indexOf(currentStep);
    if (idx < formSteps.length - 1) setCurrentStep(formSteps[idx + 1]);
  };
  const goToPreviousStep = () => {
    const idx = formSteps.indexOf(currentStep);
    if (idx > 0) setCurrentStep(formSteps[idx - 1]);
  };

  const setStepValidation = (step: FormStep, valid: boolean) => {
    setValidatedSteps((prev) => {
      const next = new Set(prev);
      if (valid) next.add(step);
      else next.delete(step);
      return next;
    });
  };

  return {
    currentStep,
    setCurrentStep,
    validatedSteps,
    setStepValidation,
    goToNextStep,
    goToPreviousStep
  };
}
